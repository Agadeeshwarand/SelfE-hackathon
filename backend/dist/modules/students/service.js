"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeStudent = serializeStudent;
exports.listStudents = listStudents;
exports.getStudent = getStudent;
exports.createStudent = createStudent;
exports.deleteStudent = deleteStudent;
exports.updateStudent = updateStudent;
exports.getMyStudentProfile = getMyStudentProfile;
exports.updateMyStudentProfile = updateMyStudentProfile;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../utils/prisma");
const AppError_1 = require("../../utils/AppError");
const pagination_1 = require("../../utils/pagination");
const prismaErrors_1 = require("../../utils/prismaErrors");
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
        isActive: student.user.isActive,
        team: student.teamMembership
            ? {
                id: student.teamMembership.team.id,
                name: student.teamMembership.team.name,
                isEligible: student.teamMembership.team.isEligible,
                role: student.teamMembership.isLeader
                    ? "TEAM_LEADER"
                    : "TEAM_MEMBER",
                joinedAt: student.teamMembership.joinedAt,
            }
            : null,
        createdAt: student.createdAt,
        registrationDate: student.user.createdAt,
    };
}
const studentInclude = {
    department: true,
    user: {
        select: {
            id: true,
            email: true,
            isActive: true,
            createdAt: true,
            role: true,
        },
    },
    teamMembership: {
        include: {
            team: {
                select: {
                    id: true,
                    name: true,
                    isEligible: true,
                },
            },
        },
    },
};
async function listStudents(query) {
    const { page, pageSize, skip, take, } = (0, pagination_1.parsePagination)(query);
    const where = {};
    const search = typeof query.search === "string"
        ? query.search.trim()
        : "";
    if (search) {
        where.OR = [
            {
                fullName: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            {
                registerNumber: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            {
                user: {
                    email: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            },
        ];
    }
    const department = typeof query.department === "string"
        ? query.department.trim()
        : "";
    if (department) {
        where.department = {
            name: department,
        };
    }
    if (query.hasTeam === "true") {
        where.teamMembership = {
            isNot: null,
        };
    }
    if (query.hasTeam === "false") {
        where.teamMembership = {
            is: null,
        };
    }
    const [rows, total] = await Promise.all([
        prisma_1.prisma.studentProfile.findMany({
            where,
            skip,
            take,
            orderBy: {
                createdAt: "desc",
            },
            include: studentInclude,
        }),
        prisma_1.prisma.studentProfile.count({
            where,
        }),
    ]);
    return (0, pagination_1.paginated)(rows.map(serializeStudent), total, page, pageSize);
}
async function getStudent(id) {
    const student = await prisma_1.prisma.studentProfile.findUnique({
        where: { id },
        include: studentInclude,
    });
    if (!student) {
        throw new AppError_1.AppError(404, "Student not found");
    }
    return serializeStudent(student);
}
/*
 * ADMIN — CREATE STUDENT
 *
 * This is intentionally separate from the public registration
 * flow, so REGISTRATION_OPEN=false does not affect admin creation.
 */
async function createStudent(input) {
    const fullName = typeof input.fullName === "string"
        ? input.fullName.trim()
        : "";
    const registerNumber = typeof input.registerNumber === "string"
        ? input.registerNumber.trim()
        : "";
    const email = typeof input.email === "string"
        ? input.email.trim().toLowerCase()
        : "";
    const phone = typeof input.phone === "string"
        ? input.phone.trim()
        : "";
    const gender = typeof input.gender === "string"
        ? input.gender
        : "";
    const departmentName = typeof input.department === "string"
        ? input.department.trim()
        : "";
    const year = input.year === undefined
        ? NaN
        : Number(input.year);
    const college = typeof input.college === "string"
        ? input.college.trim()
        : "";
    const password = typeof input.password === "string"
        ? input.password
        : "";
    if (fullName.length < 2 ||
        fullName.length > 120) {
        throw new AppError_1.AppError(400, "Name must be between 2 and 120 characters");
    }
    if (registerNumber.length < 2 ||
        registerNumber.length > 40) {
        throw new AppError_1.AppError(400, "Register number must be between 2 and 40 characters");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError_1.AppError(400, "Invalid email address");
    }
    if (phone.length < 7 ||
        phone.length > 20) {
        throw new AppError_1.AppError(400, "Phone number must be between 7 and 20 characters");
    }
    if (![
        "MALE",
        "FEMALE",
        "OTHER",
        "PREFER_NOT_TO_SAY",
    ].includes(gender)) {
        throw new AppError_1.AppError(400, "Invalid gender");
    }
    if (!departmentName) {
        throw new AppError_1.AppError(400, "Department is required");
    }
    if (!Number.isInteger(year) ||
        year < 1 ||
        year > 6) {
        throw new AppError_1.AppError(400, "Year must be between 1 and 6");
    }
    if (college.length < 2 ||
        college.length > 160) {
        throw new AppError_1.AppError(400, "College name must be between 2 and 160 characters");
    }
    if (password.length < 8 ||
        password.length > 72) {
        throw new AppError_1.AppError(400, "Password must be between 8 and 72 characters");
    }
    const [existingEmail, existingRegNo] = await Promise.all([
        prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
        }),
        prisma_1.prisma.studentProfile.findUnique({
            where: {
                registerNumber,
            },
        }),
    ]);
    if (existingEmail) {
        throw new AppError_1.AppError(409, "An account with this email already exists");
    }
    if (existingRegNo) {
        throw new AppError_1.AppError(409, "This register number is already registered");
    }
    try {
        const department = await prisma_1.prisma.department.upsert({
            where: {
                name: departmentName,
            },
            update: {},
            create: {
                name: departmentName,
            },
        });
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                passwordHash,
                role: "TEAM_MEMBER",
                studentProfile: {
                    create: {
                        fullName,
                        registerNumber,
                        phone,
                        gender: gender,
                        year,
                        college,
                        departmentId: department.id,
                    },
                },
            },
            include: {
                studentProfile: true,
            },
        });
        if (!user.studentProfile) {
            throw new AppError_1.AppError(500, "Student profile could not be created");
        }
        return getStudent(user.studentProfile.id);
    }
    catch (err) {
        if ((0, prismaErrors_1.isPrismaUniqueViolation)(err)) {
            throw new AppError_1.AppError(409, "Email or register number is already in use");
        }
        throw err;
    }
}
/*
 * ADMIN — DELETE STUDENT
 *
 * A student currently belonging to a team cannot be deleted.
 * Admin must remove the student from the team first.
 */
async function deleteStudent(id) {
    const student = await prisma_1.prisma.studentProfile.findUnique({
        where: {
            id,
        },
        include: {
            user: true,
            teamMembership: {
                include: {
                    team: true,
                },
            },
        },
    });
    if (!student) {
        throw new AppError_1.AppError(404, "Student not found");
    }
    if (student.teamMembership) {
        throw new AppError_1.AppError(409, `Cannot delete ${student.fullName} because the student is currently a member of team "${student.teamMembership.team.name}". Remove the student from the team first.`);
    }
    await prisma_1.prisma.user.delete({
        where: {
            id: student.userId,
        },
    });
    return {
        success: true,
    };
}
async function updateStudent(id, input) {
    const existing = await prisma_1.prisma.studentProfile.findUnique({
        where: {
            id,
        },
        include: {
            teamMembership: true,
        },
    });
    if (!existing) {
        throw new AppError_1.AppError(404, "Student not found");
    }
    const fullName = typeof input.fullName === "string"
        ? input.fullName.trim()
        : existing.fullName;
    const registerNumber = typeof input.registerNumber === "string"
        ? input.registerNumber.trim()
        : existing.registerNumber;
    const email = typeof input.email === "string"
        ? input.email.trim().toLowerCase()
        : undefined;
    const phone = typeof input.phone === "string"
        ? input.phone.trim()
        : existing.phone;
    const college = typeof input.college === "string"
        ? input.college.trim()
        : existing.college;
    const year = input.year === undefined
        ? existing.year
        : Number(input.year);
    const gender = input.gender === undefined
        ? existing.gender
        : String(input.gender);
    const departmentName = typeof input.department === "string"
        ? input.department.trim()
        : "";
    const isActive = input.isActive === undefined
        ? undefined
        : Boolean(input.isActive);
    if (fullName.length < 2 ||
        fullName.length > 120) {
        throw new AppError_1.AppError(400, "Name must be between 2 and 120 characters");
    }
    if (registerNumber.length < 2 ||
        registerNumber.length > 40) {
        throw new AppError_1.AppError(400, "Register number must be between 2 and 40 characters");
    }
    if (phone.length < 7 ||
        phone.length > 20) {
        throw new AppError_1.AppError(400, "Phone number must be between 7 and 20 characters");
    }
    if (college.length < 2 ||
        college.length > 160) {
        throw new AppError_1.AppError(400, "College name must be between 2 and 160 characters");
    }
    if (!Number.isInteger(year) ||
        year < 1 ||
        year > 6) {
        throw new AppError_1.AppError(400, "Year must be between 1 and 6");
    }
    if (![
        "MALE",
        "FEMALE",
        "OTHER",
        "PREFER_NOT_TO_SAY",
    ].includes(gender)) {
        throw new AppError_1.AppError(400, "Invalid gender");
    }
    if (email !== undefined &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError_1.AppError(400, "Invalid email address");
    }
    try {
        const department = departmentName
            ? await prisma_1.prisma.department.upsert({
                where: {
                    name: departmentName,
                },
                update: {},
                create: {
                    name: departmentName,
                },
            })
            : await prisma_1.prisma.department.findUniqueOrThrow({
                where: {
                    id: existing.departmentId,
                },
            });
        const updated = await prisma_1.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: {
                    id: existing.userId,
                },
                data: {
                    ...(email !== undefined
                        ? { email }
                        : {}),
                    ...(isActive !== undefined
                        ? { isActive }
                        : {}),
                },
            });
            return tx.studentProfile.update({
                where: {
                    id,
                },
                data: {
                    fullName,
                    registerNumber,
                    phone,
                    gender: gender,
                    year,
                    college,
                    departmentId: department.id,
                },
                include: studentInclude,
            });
        });
        return serializeStudent(updated);
    }
    catch (err) {
        if ((0, prismaErrors_1.isPrismaUniqueViolation)(err)) {
            throw new AppError_1.AppError(409, "Email or register number is already in use");
        }
        throw err;
    }
}
async function getMyStudentProfile(userId) {
    const student = await prisma_1.prisma.studentProfile.findUnique({
        where: {
            userId,
        },
        include: studentInclude,
    });
    if (!student) {
        throw new AppError_1.AppError(404, "Student profile not found");
    }
    return serializeStudent(student);
}
async function updateMyStudentProfile(userId, input) {
    const fullName = input.fullName.trim();
    if (fullName.length < 2 ||
        fullName.length > 120) {
        throw new AppError_1.AppError(400, "Name must be between 2 and 120 characters");
    }
    const student = await prisma_1.prisma.studentProfile.update({
        where: {
            userId,
        },
        data: {
            fullName,
        },
        include: studentInclude,
    });
    return serializeStudent(student);
}
