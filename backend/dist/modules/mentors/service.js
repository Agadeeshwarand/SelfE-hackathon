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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../utils/prisma");
const AppError_1 = require("../../utils/AppError");
const pagination_1 = require("../../utils/pagination");
const SALT_ROUNDS = 12;
const mentorInclude = {
    user: { select: { id: true, email: true, isActive: true, createdAt: true, role: true } },
    guidanceAssignments: {
        include: {
            team: { select: { id: true, name: true, isEligible: true } },
        },
        orderBy: { assignedAt: "desc" },
    },
};
function serializeMentor(mentor) {
    const assignedTeamCount = mentor.guidanceAssignments.length;
    const availableCapacity = Math.max(0, mentor.maxTeams - assignedTeamCount);
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
        maxTeams: mentor.maxTeams,
        assignedTeamCount,
        availableCapacity,
        atCapacity: assignedTeamCount >= mentor.maxTeams,
        belowRecommended: assignedTeamCount < mentor.minTeams,
        assignedTeams: mentor.guidanceAssignments.map((a) => ({
            assignmentId: a.id,
            teamId: a.team.id,
            teamName: a.team.name,
            isEligible: a.team.isEligible,
            assignedAt: a.assignedAt,
        })),
        createdAt: mentor.createdAt,
    };
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
        prisma_1.prisma.mentorProfile.findMany({
            where,
            skip,
            take,
            orderBy: { fullName: "asc" },
            include: mentorInclude,
        }),
        prisma_1.prisma.mentorProfile.count({ where }),
    ]);
    let items = rows.map(serializeMentor);
    if (query.hasCapacity === "true") {
        items = items.filter((m) => m.isActive && !m.atCapacity);
    }
    return (0, pagination_1.paginated)(items, items.length === rows.length ? total : items.length, page, pageSize);
}
async function listAllMentorsForAllocation() {
    const rows = await prisma_1.prisma.mentorProfile.findMany({
        orderBy: { fullName: "asc" },
        include: mentorInclude,
    });
    return rows.map(serializeMentor);
}
async function getMentor(id) {
    const mentor = await prisma_1.prisma.mentorProfile.findUnique({
        where: { id },
        include: mentorInclude,
    });
    if (!mentor)
        throw new AppError_1.AppError(404, "Mentor not found");
    return serializeMentor(mentor);
}
async function getMentorByUserId(userId) {
    const mentor = await prisma_1.prisma.mentorProfile.findUnique({
        where: { userId },
        include: mentorInclude,
    });
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
            user: {
                create: {
                    email: input.email.toLowerCase().trim(),
                    passwordHash,
                    role: "MENTOR",
                    isActive: input.isActive ?? true,
                },
            },
        },
        include: mentorInclude,
    });
    return serializeMentor(mentor);
}
async function updateMentor(id, input) {
    const existing = await prisma_1.prisma.mentorProfile.findUnique({
        where: { id },
        include: { user: true, guidanceAssignments: true },
    });
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
    const mentor = await prisma_1.prisma.mentorProfile.update({
        where: { id },
        data: {
            fullName: input.fullName?.trim(),
            phone: input.phone === undefined ? undefined : input.phone?.trim() || null,
            specialization: input.specialization === undefined ? undefined : input.specialization?.trim() || null,
            minTeams: input.minTeams,
            maxTeams: input.maxTeams,
            user: {
                update: {
                    email: input.email?.toLowerCase().trim(),
                    isActive: input.isActive,
                    ...(passwordHash ? { passwordHash } : {}),
                },
            },
        },
        include: mentorInclude,
    });
    return serializeMentor(mentor);
}
async function setMentorActive(id, isActive) {
    return updateMentor(id, { isActive });
}
async function deleteMentor(id) {
    const existing = await prisma_1.prisma.mentorProfile.findUnique({
        where: { id },
        include: { guidanceAssignments: true, user: true },
    });
    if (!existing)
        throw new AppError_1.AppError(404, "Mentor not found");
    if (existing.guidanceAssignments.length > 0) {
        throw new AppError_1.AppError(409, "Cannot delete a mentor with assigned teams. Unassign all teams first, or deactivate the mentor.");
    }
    await prisma_1.prisma.user.delete({ where: { id: existing.userId } });
    return { deleted: true };
}
