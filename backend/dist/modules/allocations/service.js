"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignTeams = assignTeams;
exports.unassign = unassign;
exports.unassignTeam = unassignTeam;
exports.listAssignments = listAssignments;
exports.getMentorDashboard = getMentorDashboard;
const prisma_1 = require("../../utils/prisma");
const AppError_1 = require("../../utils/AppError");
const service_1 = require("../teams/service");
const service_2 = require("../mentors/service");
const MAX_TEAMS_PER_MENTOR = 6;
async function assignTeams(mentorId, teamIds, reassign = false) {
    const uniqueTeamIds = [...new Set(teamIds.filter(Boolean))];
    if (uniqueTeamIds.length === 0) {
        throw new AppError_1.AppError(400, "Select at least one team to assign");
    }
    const mentor = await prisma_1.prisma.mentorProfile.findUnique({
        where: { id: mentorId },
        include: {
            user: true,
            guidanceAssignments: true,
        },
    });
    if (!mentor)
        throw new AppError_1.AppError(404, "Mentor not found");
    if (!mentor.user.isActive) {
        throw new AppError_1.AppError(409, "Cannot assign teams to an inactive mentor");
    }
    const teams = await prisma_1.prisma.team.findMany({
        where: { id: { in: uniqueTeamIds } },
        include: { guidanceAssignment: true, members: true },
    });
    if (teams.length !== uniqueTeamIds.length) {
        throw new AppError_1.AppError(404, "One or more selected teams do not exist");
    }
    for (const team of teams) {
        if (!team.isEligible) {
            throw new AppError_1.AppError(409, `Team "${team.name}" is not eligible and cannot be assigned a mentor`);
        }
        if (team.guidanceAssignment?.mentorId === mentor.id) {
            throw new AppError_1.AppError(409, `Team "${team.name}" is already assigned to this mentor`);
        }
        if (team.guidanceAssignment && team.guidanceAssignment.mentorId !== mentor.id && !reassign) {
            throw new AppError_1.AppError(409, `Team "${team.name}" already has a mentor. Confirm reassignment to continue.`);
        }
    }
    const alreadyAssignedToThis = mentor.guidanceAssignments.filter((a) => uniqueTeamIds.includes(a.teamId)).length;
    const newCount = uniqueTeamIds.length - alreadyAssignedToThis;
    const maxTeams = Math.min(mentor.maxTeams, MAX_TEAMS_PER_MENTOR);
    if (mentor.guidanceAssignments.length + newCount > maxTeams) {
        throw new AppError_1.AppError(409, "Maximum team allocation reached.");
    }
    const results = await prisma_1.prisma.$transaction(async (tx) => {
        const created = [];
        for (const team of teams) {
            if (team.guidanceAssignment && team.guidanceAssignment.mentorId !== mentor.id) {
                await tx.mentorGuidanceAssignment.delete({ where: { id: team.guidanceAssignment.id } });
            }
            const row = await tx.mentorGuidanceAssignment.create({
                data: { mentorId: mentor.id, teamId: team.id },
            });
            created.push(row);
        }
        return created;
    });
    const updated = await prisma_1.prisma.mentorProfile.findUniqueOrThrow({
        where: { id: mentor.id },
        include: {
            user: { select: { id: true, email: true, isActive: true, createdAt: true, role: true } },
            guidanceAssignments: {
                include: { team: { select: { id: true, name: true, isEligible: true } } },
                orderBy: { assignedAt: "desc" },
            },
        },
    });
    return {
        mentor: (0, service_2.serializeMentor)(updated),
        assignedCount: results.length,
    };
}
async function unassign(assignmentId) {
    const existing = await prisma_1.prisma.mentorGuidanceAssignment.findUnique({
        where: { id: assignmentId },
    });
    if (!existing)
        throw new AppError_1.AppError(404, "Assignment not found");
    await prisma_1.prisma.mentorGuidanceAssignment.delete({ where: { id: assignmentId } });
    return { deleted: true };
}
async function unassignTeam(teamId) {
    const existing = await prisma_1.prisma.mentorGuidanceAssignment.findUnique({
        where: { teamId },
    });
    if (!existing)
        throw new AppError_1.AppError(404, "This team does not have a mentor assigned");
    await prisma_1.prisma.mentorGuidanceAssignment.delete({ where: { id: existing.id } });
    return { deleted: true };
}
async function listAssignments() {
    const rows = await prisma_1.prisma.mentorGuidanceAssignment.findMany({
        include: {
            mentor: { include: { user: { select: { email: true } } } },
            team: { include: { members: true } },
        },
        orderBy: { assignedAt: "desc" },
    });
    return rows.map((row) => ({
        id: row.id,
        assignedAt: row.assignedAt,
        mentor: {
            id: row.mentor.id,
            fullName: row.mentor.fullName,
            email: row.mentor.user.email,
        },
        team: {
            id: row.team.id,
            name: row.team.name,
            isEligible: row.team.isEligible,
            memberCount: row.team.members.length,
        },
    }));
}
async function getMentorDashboard(userId) {
    const mentor = await prisma_1.prisma.mentorProfile.findUnique({
        where: { userId },
        include: {
            user: { select: { id: true, email: true, isActive: true, createdAt: true, role: true } },
            guidanceAssignments: {
                include: { team: { select: { id: true, name: true, isEligible: true } } },
                orderBy: { assignedAt: "desc" },
            },
        },
    });
    if (!mentor)
        throw new AppError_1.AppError(404, "Mentor profile not found");
    const teams = [];
    for (const assignment of mentor.guidanceAssignments) {
        teams.push(await (0, service_1.getTeamWithEligibility)(assignment.team.id));
    }
    return {
        mentor: (0, service_2.serializeMentor)(mentor),
        teams,
    };
}
