"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeStudent = serializeStudent;
exports.listStudents = listStudents;
exports.getStudent = getStudent;
exports.getMyStudentProfile = getMyStudentProfile;
exports.updateMyStudentProfile = updateMyStudentProfile;
const prisma_1 = require("../../utils/prisma");
const AppError_1 = require("../../utils/AppError");
const pagination_1 = require("../../utils/pagination");
function serializeStudent(student) {
    return {
        id: student.id,
        studentId: student.registerNumber,
        fullName: student.fullName,
        email: student.user.email,
        phone: student.phone,
        gender: student.gender,
        department: student.department.name,
        year: student.year,
        college: student.college,
        role: student.user.role,
        team: student.teamMembership
            ? {
                id: student.teamMembership.team.id,
                name: student.teamMembership.team.name,
                isEligible: student.teamMembership.team.isEligible,
                role: student.teamMembership.isLeader ? "TEAM_LEADER" : "TEAM_MEMBER",
                joinedAt: student.teamMembership.joinedAt,
            }
            : null,
        createdAt: student.createdAt,
        registrationDate: student.user.createdAt,
    };
}
const studentInclude = {
    department: true,
    user: { select: { id: true, email: true, isActive: true, createdAt: true, role: true } },
    teamMembership: { include: { team: { select: { id: true, name: true, isEligible: true } } } },
};
async function listStudents(query) {
    const { page, pageSize, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    const search = typeof query.search === "string" ? query.search.trim() : "";
    if (search) {
        where.OR = [
            { fullName: { contains: search, mode: "insensitive" } },
            { registerNumber: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
        ];
    }
    const department = typeof query.department === "string" ? query.department.trim() : "";
    if (department)
        where.department = { name: department };
    if (query.hasTeam === "true")
        where.teamMembership = { isNot: null };
    if (query.hasTeam === "false")
        where.teamMembership = { is: null };
    const [rows, total] = await Promise.all([
        prisma_1.prisma.studentProfile.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
            include: studentInclude,
        }),
        prisma_1.prisma.studentProfile.count({ where }),
    ]);
    return (0, pagination_1.paginated)(rows.map(serializeStudent), total, page, pageSize);
}
async function getStudent(id) {
    const student = await prisma_1.prisma.studentProfile.findUnique({
        where: { id },
        include: studentInclude,
    });
    if (!student)
        throw new AppError_1.AppError(404, "Student not found");
    return serializeStudent(student);
}
async function getMyStudentProfile(userId) {
    const student = await prisma_1.prisma.studentProfile.findUnique({
        where: { userId },
        include: studentInclude,
    });
    if (!student)
        throw new AppError_1.AppError(404, "Student profile not found");
    return serializeStudent(student);
}
async function updateMyStudentProfile(userId, input) {
    const fullName = input.fullName.trim();
    if (fullName.length < 2 || fullName.length > 120)
        throw new AppError_1.AppError(400, "Name must be between 2 and 120 characters");
    const student = await prisma_1.prisma.studentProfile.update({
        where: { userId },
        data: { fullName },
        include: studentInclude,
    });
    return serializeStudent(student);
}
