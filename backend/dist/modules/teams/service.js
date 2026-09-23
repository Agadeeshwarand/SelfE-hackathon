"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeam = createTeam;
exports.joinTeam = joinTeam;
exports.getTeamWithEligibility = getTeamWithEligibility;
exports.getMyTeam = getMyTeam;
exports.getTeamById = getTeamById;
exports.listTeams = listTeams;
exports.buildTeamWhere = buildTeamWhere;
exports.removeMember = removeMember;
const prisma_1 = require("../../utils/prisma");
const AppError_1 = require("../../utils/AppError");
const eligibility_1 = require("./eligibility");
const presenter_1 = require("./presenter");
const pagination_1 = require("../../utils/pagination");
const prismaErrors_1 = require("../../utils/prismaErrors");
const MAX_TEAM_SIZE = 6;
function generateTeamCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
}
async function getOwnStudentProfileOrThrow(userId) {
    const profile = await prisma_1.prisma.studentProfile.findUnique({
        where: { userId },
        include: { teamMembership: true },
    });
    if (!profile) {
        throw new AppError_1.AppError(403, "Only registered students can perform this action");
    }
    return profile;
}
async function assertStudentHasNoTeam(studentId) {
    const existing = await prisma_1.prisma.teamMember.findUnique({ where: { studentId } });
    if (existing) {
        throw new AppError_1.AppError(409, "You already belong to a team");
    }
}
function withEligibility(team) {
    const eligibility = (0, eligibility_1.evaluateTeamEligibility)(team.members.map((m) => ({
        gender: m.student.gender,
        departmentId: m.student.departmentId,
    })));
    return (0, presenter_1.serializeTeam)(team, eligibility);
}
async function createTeam(userId, input) {
    const student = await getOwnStudentProfileOrThrow(userId);
    await assertStudentHasNoTeam(student.id);
    for (let attempt = 0; attempt < 5; attempt++) {
        const teamCode = generateTeamCode();
        try {
            const teamId = await prisma_1.prisma.$transaction(async (tx) => {
                const member = await tx.teamMember.create({
                    data: {
                        isLeader: true,
                        student: { connect: { id: student.id } },
                        team: { create: { name: input.name.trim(), teamCode } },
                    },
                });
                await tx.team.update({
                    where: { id: member.teamId },
                    data: { leaderId: member.id },
                });
                await tx.user.update({ where: { id: userId }, data: { role: "TEAM_LEADER" } });
                return member.teamId;
            });
            return getTeamWithEligibility(teamId);
        }
        catch (err) {
            if (!(0, prismaErrors_1.isPrismaUniqueViolation)(err))
                throw err;
        }
    }
    throw new AppError_1.AppError(500, "Could not generate a unique team code, please try again");
}
async function joinTeam(userId, teamCode) {
    const student = await getOwnStudentProfileOrThrow(userId);
    await assertStudentHasNoTeam(student.id);
    const team = await prisma_1.prisma.team.findUnique({
        where: { teamCode: teamCode.trim().toUpperCase() },
        include: { members: true },
    });
    if (!team)
        throw new AppError_1.AppError(404, "No team found with that code");
    if (team.members.length >= MAX_TEAM_SIZE) {
        throw new AppError_1.AppError(409, `Team is already full (${MAX_TEAM_SIZE}/${MAX_TEAM_SIZE})`);
    }
    try {
        await prisma_1.prisma.teamMember.create({
            data: {
                student: { connect: { id: student.id } },
                team: { connect: { id: team.id } },
            },
        });
    }
    catch (err) {
        if ((0, prismaErrors_1.isPrismaUniqueViolation)(err)) {
            throw new AppError_1.AppError(409, "You already belong to a team");
        }
        throw err;
    }
    return recalculateAndPersistEligibility(team.id);
}
async function getTeamWithEligibility(teamId) {
    return recalculateAndPersistEligibility(teamId);
}
async function getMyTeam(userId) {
    const student = await getOwnStudentProfileOrThrow(userId);
    if (!student.teamMembership)
        return null;
    return getTeamWithEligibility(student.teamMembership.teamId);
}
async function getTeamById(teamId, actor) {
    const team = await prisma_1.prisma.team.findUnique({
        where: { id: teamId },
        include: presenter_1.teamDetailInclude,
    });
    if (!team)
        throw new AppError_1.AppError(404, "Team not found");
    if (actor.role === "ADMIN") {
        return withEligibility(team);
    }
    if (actor.role === "MENTOR") {
        const mentor = await prisma_1.prisma.mentorProfile.findUnique({ where: { userId: actor.userId } });
        if (!mentor || team.guidanceAssignment?.mentorId !== mentor.id) {
            throw new AppError_1.AppError(403, "You do not have access to this team");
        }
        return withEligibility(team);
    }
    const student = await prisma_1.prisma.studentProfile.findUnique({
        where: { userId: actor.userId },
        include: { teamMembership: true },
    });
    if (!student?.teamMembership || student.teamMembership.teamId !== teamId) {
        throw new AppError_1.AppError(403, "You do not have access to this team");
    }
    return withEligibility(team);
}
async function listTeams(query) {
    const { page, pageSize, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = buildTeamWhere(query);
    const sort = String(query.sort ?? "createdAt");
    const dir = String(query.dir ?? "desc") === "asc" ? "asc" : "desc";
    const orderBy = sort === "name"
        ? { name: dir }
        : sort === "updatedAt"
            ? { updatedAt: dir }
            : { createdAt: dir };
    const [rows, total] = await Promise.all([
        prisma_1.prisma.team.findMany({
            where,
            skip,
            take,
            orderBy,
            include: presenter_1.teamDetailInclude,
        }),
        prisma_1.prisma.team.count({ where }),
    ]);
    return (0, pagination_1.paginated)(rows.map((row) => withEligibility(row)), total, page, pageSize);
}
function buildTeamWhere(query) {
    const where = {};
    const search = typeof query.search === "string" ? query.search.trim() : "";
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { teamCode: { contains: search, mode: "insensitive" } },
        ];
    }
    if (query.eligible === "true" || query.eligible === true)
        where.isEligible = true;
    if (query.eligible === "false" || query.eligible === false)
        where.isEligible = false;
    const mentorAssigned = query.mentorAssigned ?? query.assigned;
    if (mentorAssigned === "true" || mentorAssigned === true) {
        where.guidanceAssignment = { isNot: null };
    }
    if (mentorAssigned === "false" || mentorAssigned === false) {
        where.guidanceAssignment = { is: null };
    }
    const department = typeof query.department === "string" ? query.department.trim() : "";
    if (department) {
        where.members = {
            some: { student: { department: { name: department } } },
        };
    }
    const mentorId = typeof query.mentorId === "string" ? query.mentorId.trim() : "";
    if (mentorId) {
        where.guidanceAssignment = { mentorId };
    }
    return where;
}
async function removeMember(actor, teamId, studentId) {
    const team = await prisma_1.prisma.team.findUnique({
        where: { id: teamId },
        include: { members: true },
    });
    if (!team)
        throw new AppError_1.AppError(404, "Team not found");
    const target = team.members.find((m) => m.studentId === studentId);
    if (!target)
        throw new AppError_1.AppError(404, "Student is not a member of this team");
    const actorStudent = await prisma_1.prisma.studentProfile.findUnique({ where: { userId: actor.userId } });
    const actorMembership = team.members.find((m) => m.studentId === actorStudent?.id);
    const isAdmin = actor.role === "ADMIN";
    const isLeader = Boolean(actorMembership?.isLeader);
    const isSelf = actorStudent?.id === studentId;
    if (!isAdmin && !isLeader && !isSelf) {
        throw new AppError_1.AppError(403, "You cannot modify this team's membership");
    }
    if (target.isLeader && team.members.length > 1) {
        throw new AppError_1.AppError(409, "The team leader cannot leave while other members remain");
    }
    if (isSelf && target.isLeader && team.members.length > 1) {
        throw new AppError_1.AppError(409, "Transfer or remove members before leaving as team leader");
    }
    await prisma_1.prisma.$transaction(async (tx) => {
        if (team.members.length === 1) {
            await tx.mentorGuidanceAssignment.deleteMany({ where: { teamId } });
            await tx.team.delete({ where: { id: teamId } });
        }
        else {
            await tx.teamMember.delete({ where: { id: target.id } });
        }
        if (target.isLeader) {
            await tx.user.update({ where: { id: actor.userId }, data: { role: "TEAM_MEMBER" } });
        }
    });
    if (team.members.length === 1) {
        return { deleted: true };
    }
    return recalculateAndPersistEligibility(teamId);
}
async function recalculateAndPersistEligibility(teamId) {
    const team = await prisma_1.prisma.team.findUnique({
        where: { id: teamId },
        include: presenter_1.teamDetailInclude,
    });
    if (!team)
        throw new AppError_1.AppError(404, "Team not found");
    const eligibility = (0, eligibility_1.evaluateTeamEligibility)(team.members.map((m) => ({
        gender: m.student.gender,
        departmentId: m.student.departmentId,
    })));
    await prisma_1.prisma.team.update({
        where: { id: teamId },
        data: {
            isEligible: eligibility.isEligible,
            eligibilityDetails: eligibility,
        },
    });
    return (0, presenter_1.serializeTeam)(team, eligibility);
}
