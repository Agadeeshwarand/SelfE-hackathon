"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMentor = serializeMentor;
exports.listMentors = listMentors;
exports.listAllMentorsForAllocation = listAllMentorsForAllocation;
exports.getMentor = getMentor;
exports.getMentorByUserId = getMentorByUserId;
exports.createMentor = createMentor;
exports.updateMentor = updateMentor;
exports.setMentorActive = setMentorActive;
exports.deleteMentor = deleteMentor;
exports.getMentorGroup = getMentorGroup;
exports.updateMentorGroup = updateMentorGroup;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../utils/prisma");
const AppError_1 = require("../../utils/AppError");
const pagination_1 = require("../../utils/pagination");
const SALT_ROUNDS = 12;
const mentorInclude = {
    user: { select: { id: true, email: true, isActive: true, createdAt: true, role: true } },
    guidanceAssignments: {
        include: {
            team: { select: { id: true, name: true, isEligible: true, teamCode: true } },
        },
        orderBy: { assignedAt: "desc" },
    },
    mainMentorGroup: {
        include: {
            members: {
                include: {
                    mentor: { select: { id: true, fullName: true, phone: true, specialization: true, user: { select: { email: true, isActive: true } } } },
                },
            },
            assignments: { include: { team: { select: { id: true, name: true, isEligible: true, teamCode: true } } } },
        },
    },
    mentorGroupMembership: {
        include: {
            group: {
                include: {
                    mainMentor: { select: { id: true, fullName: true, user: { select: { email: true } } } },
                    members: {
                        include: {
                            mentor: { select: { id: true, fullName: true, phone: true, specialization: true, user: { select: { email: true, isActive: true } } } },
                        },
                    },
                    assignments: { include: { team: { select: { id: true, name: true, isEligible: true, teamCode: true } } } },
                },
            },
        },
    },
};
function groupForMentor(mentor) {
    const group = mentor.mainMentorGroup ?? mentor.mentorGroupMembership?.group ?? null;
    if (!group) {
        return {
            id: null,
            role: "MAIN",
            mainMentor: { id: mentor.id, fullName: mentor.fullName, email: mentor.user.email },
            coMentors: [],
            members: [{ id: mentor.id, fullName: mentor.fullName, email: mentor.user.email, role: "MAIN", isActive: mentor.user.isActive }],
        };
    }
    const main = group.mainMentor ?? mentor;
    const members = (group.members ?? []).map((m) => ({
        id: m.mentor.id,
        fullName: m.mentor.fullName,
        email: m.mentor.user.email,
        phone: m.mentor.phone,
        specialization: m.mentor.specialization,
        isActive: m.mentor.user.isActive,
        role: m.role,
    }));
    return {
        id: group.id,
        role: mentor.id === group.mainMentorId ? "MAIN" : ((group.members ?? []).find((m) => m.mentorId === mentor.id)?.role ?? "CO_MENTOR"),
        mainMentor: { id: main.id, fullName: main.fullName, email: main.user.email },
        coMentors: members.filter((m) => m.id !== group.mainMentorId),
        members,
    };
}
function serializeMentor(mentor) {
    const group = groupForMentor(mentor);
    const groupData = mentor.mainMentorGroup ?? mentor.mentorGroupMembership?.group ?? null;
    const groupAssignments = groupData?.assignments ?? null;
    const assignedTeamCount = groupAssignments ? groupAssignments.length : mentor.guidanceAssignments.length;
    const maxTeams = groupData?.mainMentor?.maxTeams ?? mentor.maxTeams;
    const availableCapacity = Math.max(0, maxTeams - assignedTeamCount);
    return {
        id: mentor.id,
        userId: mentor.user.id,
        fullName: mentor.fullName,
        email: mentor.user.email,
        phone: mentor.phone,
        specialization: mentor.specialization,
        department: mentor.specialization,
        status: mentor.user.isActive ? "ACTIVE" : "INACTIVE",
        isActive: mentor.user.isActive,
        minTeams: mentor.minTeams,
        maxTeams,
        assignedTeamCount,
        availableCapacity,
        atCapacity: assignedTeamCount >= maxTeams,
        belowRecommended: assignedTeamCount < mentor.minTeams,
        assignedTeams: (groupAssignments ?? mentor.guidanceAssignments).map((a) => ({
            assignmentId: a.id,
            teamId: a.team.id,
            teamName: a.team.name,
            teamCode: a.team.teamCode,
            isEligible: a.team.isEligible,
            assignedAt: a.assignedAt,
        })),
        mentorGroup: group,
        createdAt: mentor.createdAt,
    };
}
async function ensureMentorGroup(mentorId) {
    const mentor = await prisma_1.prisma.mentorProfile.findUnique({ where: { id: mentorId } });
    if (!mentor)
        throw new AppError_1.AppError(404, "Mentor not found");
    const membership = await prisma_1.prisma.mentorGroupMember.findUnique({ where: { mentorId } });
    if (membership)
        return membership.groupId;
    const existingMain = await prisma_1.prisma.mentorGroup.findUnique({ where: { mainMentorId: mentorId } });
    if (existingMain)
        return existingMain.id;
    const group = await prisma_1.prisma.mentorGroup.create({
        data: {
            mainMentorId: mentorId,
            members: { create: { mentorId, role: "MAIN" } },
        },
    });
    await prisma_1.prisma.mentorGuidanceAssignment.updateMany({
        where: { mentorId },
        data: { mentorGroupId: group.id },
    });
    return group.id;
}
async function listMentors(query) {
    const { page, pageSize, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    const search = typeof query.search === "string" ? query.search.trim() : "";
    if (search) {
        where.OR = [
            { fullName: { contains: search, mode: "insensitive" } },
            { specialization: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
        ];
    }
    if (query.status === "ACTIVE")
        where.user = { isActive: true };
    if (query.status === "INACTIVE")
        where.user = { isActive: false };
    const [rows, total] = await Promise.all([
        prisma_1.prisma.mentorProfile.findMany({ where, skip, take, orderBy: { fullName: "asc" }, include: mentorInclude }),
        prisma_1.prisma.mentorProfile.count({ where }),
    ]);
    let items = rows.map(serializeMentor);
    if (query.hasCapacity === "true")
        items = items.filter((m) => m.isActive && !m.atCapacity);
    return (0, pagination_1.paginated)(items, items.length === rows.length ? total : items.length, page, pageSize);
}
async function listAllMentorsForAllocation() {
    const rows = await prisma_1.prisma.mentorProfile.findMany({ orderBy: { fullName: "asc" }, include: mentorInclude });
    for (const row of rows)
        await ensureMentorGroup(row.id);
    const refreshed = await prisma_1.prisma.mentorProfile.findMany({ orderBy: { fullName: "asc" }, include: mentorInclude });
    return refreshed.map(serializeMentor).filter((mentor) => mentor.mentorGroup?.role === "MAIN");
}
async function getMentor(id) {
    const mentor = await prisma_1.prisma.mentorProfile.findUnique({ where: { id }, include: mentorInclude });
    if (!mentor)
        throw new AppError_1.AppError(404, "Mentor not found");
    return serializeMentor(mentor);
}
async function getMentorByUserId(userId) {
    const mentor = await prisma_1.prisma.mentorProfile.findUnique({ where: { userId }, include: mentorInclude });
    if (!mentor)
        throw new AppError_1.AppError(404, "Mentor profile not found");
    return serializeMentor(mentor);
}
async function createMentor(input) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
    if (existing)
        throw new AppError_1.AppError(409, "An account with this email already exists");
    const passwordHash = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
    const mentor = await prisma_1.prisma.mentorProfile.create({
        data: {
            fullName: input.fullName.trim(),
            phone: input.phone?.trim() || null,
            specialization: input.specialization?.trim() || null,
            minTeams: input.minTeams ?? 4,
            maxTeams: input.maxTeams ?? 6,
            user: { create: { email: input.email.toLowerCase().trim(), passwordHash, role: "MENTOR", isActive: input.isActive ?? true } },
        },
        include: mentorInclude,
    });
    await ensureMentorGroup(mentor.id);
    return getMentor(mentor.id);
}
async function updateMentor(id, input) {
    const existing = await prisma_1.prisma.mentorProfile.findUnique({ where: { id }, include: { user: true, guidanceAssignments: true } });
    if (!existing)
        throw new AppError_1.AppError(404, "Mentor not found");
    if (input.email && input.email.toLowerCase() !== existing.user.email) {
        const clash = await prisma_1.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
        if (clash)
            throw new AppError_1.AppError(409, "An account with this email already exists");
    }
    const maxTeams = input.maxTeams ?? existing.maxTeams;
    if (existing.guidanceAssignments.length > maxTeams) {
        throw new AppError_1.AppError(409, `Cannot set max teams to ${maxTeams} because this mentor already has ${existing.guidanceAssignments.length} assigned teams`);
    }
    const passwordHash = input.password ? await bcryptjs_1.default.hash(input.password, SALT_ROUNDS) : undefined;
    await prisma_1.prisma.mentorProfile.update({
        where: { id },
        data: {
            fullName: input.fullName?.trim(),
            phone: input.phone === undefined ? undefined : input.phone?.trim() || null,
            specialization: input.specialization === undefined ? undefined : input.specialization?.trim() || null,
            minTeams: input.minTeams,
            maxTeams: input.maxTeams,
            user: { update: { email: input.email?.toLowerCase().trim(), isActive: input.isActive, ...(passwordHash ? { passwordHash } : {}) } },
        },
    });
    return getMentor(id);
}
async function setMentorActive(id, isActive) {
    return updateMentor(id, { isActive });
}
async function deleteMentor(id) {
    const existing = await prisma_1.prisma.mentorProfile.findUnique({
        where: { id },
        include: {
            guidanceAssignments: true,
            user: true,
            mentorGroupMembership: { include: { group: { include: { members: true } } } },
            mainMentorGroup: { include: { members: true, assignments: true } },
        },
    });
    if (!existing)
        throw new AppError_1.AppError(404, "Mentor not found");
    if (existing.guidanceAssignments.length > 0 || (existing.mainMentorGroup?.assignments?.length ?? 0) > 0) {
        throw new AppError_1.AppError(409, "Cannot delete a mentor with assigned teams. Unassign all teams first, or deactivate the mentor.");
    }
    if (existing.mentorGroupMembership && existing.mentorGroupMembership.group.members.length > 1) {
        throw new AppError_1.AppError(409, "Cannot delete a co-mentor while they are part of a mentor group. Remove them from the group first.");
    }
    if (existing.mainMentorGroup && existing.mainMentorGroup.members.length > 1) {
        throw new AppError_1.AppError(409, "Cannot delete the main mentor while co-mentors are attached. Remove the co-mentors first.");
    }
    await prisma_1.prisma.user.delete({ where: { id: existing.userId } });
    return { deleted: true };
}
async function getMentorGroup(mentorId) {
    const groupId = await ensureMentorGroup(mentorId);
    const group = await prisma_1.prisma.mentorGroup.findUnique({
        where: { id: groupId },
        include: {
            mainMentor: { select: { id: true, fullName: true, phone: true, specialization: true, maxTeams: true, minTeams: true, user: { select: { email: true, isActive: true } } } },
            members: { include: { mentor: { select: { id: true, fullName: true, phone: true, specialization: true, user: { select: { email: true, isActive: true } } } } }, orderBy: { createdAt: "asc" } },
            assignments: { include: { team: { select: { id: true, name: true, teamCode: true } } } },
        },
    });
    if (!group)
        throw new AppError_1.AppError(404, "Mentor group not found");
    return {
        id: group.id,
        mainMentor: { ...group.mainMentor, role: "MAIN" },
        coMentors: group.members.filter((m) => m.mentorId !== group.mainMentorId).map((m) => ({ ...m.mentor, role: "CO_MENTOR" })),
        members: group.members.map((m) => ({ ...m.mentor, role: m.role })),
        assignedTeamCount: group.assignments.length,
        maxTeams: group.mainMentor.maxTeams,
        availableCapacity: Math.max(0, group.mainMentor.maxTeams - group.assignments.length),
        assignments: group.assignments.map((a) => ({ id: a.id, teamId: a.team.id, teamName: a.team.name, teamCode: a.team.teamCode })),
    };
}
async function updateMentorGroup(mentorId, input) {
    const requested = Array.from(new Set([input.mainMentorId, ...input.coMentorIds].filter(Boolean)));
    const mentors = await prisma_1.prisma.mentorProfile.findMany({ where: { id: { in: requested } }, include: { user: true } });
    if (mentors.length !== requested.length)
        throw new AppError_1.AppError(404, "One or more selected mentors do not exist");
    if (mentors.some((m) => !m.user.isActive))
        throw new AppError_1.AppError(409, "All selected mentors must be active");
    const currentGroupId = await ensureMentorGroup(mentorId);
    const existingMemberships = await prisma_1.prisma.mentorGroupMember.findMany({
        where: { mentorId: { in: requested } },
        include: { group: { include: { members: true, assignments: true } } },
    });
    const foreignGroups = existingMemberships
        .filter((m) => m.groupId !== currentGroupId)
        .map((m) => m.group)
        .filter((group, index, all) => all.findIndex((item) => item.id === group.id) === index);
    const blockedForeignGroup = foreignGroups.find((group) => group.members.length > 1 || group.assignments.length > 0);
    if (blockedForeignGroup)
        throw new AppError_1.AppError(409, "One or more selected mentors already belongs to another mentor group. Remove that mentor from their current group first.");
    const currentGroup = await prisma_1.prisma.mentorGroup.findUnique({ where: { id: currentGroupId }, include: { members: true, assignments: true } });
    if (!currentGroup)
        throw new AppError_1.AppError(404, "Mentor group not found");
    const targetMain = mentors.find((m) => m.id === input.mainMentorId);
    const assignedCount = currentGroup.members.length ? await prisma_1.prisma.mentorGuidanceAssignment.count({ where: { mentorGroupId: currentGroup.id } }) : 0;
    if (assignedCount > targetMain.maxTeams) {
        throw new AppError_1.AppError(409, `${targetMain.fullName} has a maximum capacity of ${targetMain.maxTeams}, but this group already has ${assignedCount} assigned teams.`);
    }
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        for (const foreignGroup of foreignGroups) {
            await tx.mentorGroup.delete({ where: { id: foreignGroup.id } });
        }
        const group = await tx.mentorGroup.update({ where: { id: currentGroup.id }, data: { mainMentorId: input.mainMentorId } });
        await tx.mentorGroupMember.deleteMany({ where: { groupId: group.id } });
        await tx.mentorGroupMember.createMany({ data: requested.map((id) => ({ groupId: group.id, mentorId: id, role: id === input.mainMentorId ? "MAIN" : "CO_MENTOR" })) });
        await tx.mentorGuidanceAssignment.updateMany({ where: { mentorGroupId: group.id }, data: { mentorId: input.mainMentorId } });
        return group;
    });
    return getMentorGroup(result.mainMentorId);
}
