"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStudent = registerStudent;
exports.login = login;
exports.getMe = getMe;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../utils/prisma");
const env_1 = require("../../config/env");
const AppError_1 = require("../../utils/AppError");
const SALT_ROUNDS = 12;
async function registerStudent(input) {
    const [existingEmail, existingRegNo] = await Promise.all([
        prisma_1.prisma.user.findUnique({ where: { email: input.email } }),
        prisma_1.prisma.studentProfile.findUnique({ where: { registerNumber: input.registerNumber } }),
    ]);
    if (existingEmail) {
        throw new AppError_1.AppError(409, "An account with this email already exists");
    }
    if (existingRegNo) {
        throw new AppError_1.AppError(409, "This register number is already registered");
    }
    const department = await prisma_1.prisma.department.upsert({
        where: { name: input.department },
        update: {},
        create: { name: input.department },
    });
    const passwordHash = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
    const user = await prisma_1.prisma.user.create({
        data: {
            email: input.email,
            passwordHash,
            role: "TEAM_MEMBER",
            studentProfile: {
                create: {
                    fullName: input.fullName,
                    registerNumber: input.registerNumber,
                    phone: input.phone,
                    gender: input.gender,
                    year: input.year,
                    college: input.college,
                    departmentId: department.id,
                },
            },
        },
    });
    return toAuthResult(user.id);
}
async function login(input) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) {
        throw new AppError_1.AppError(401, "Invalid email or password");
    }
    const valid = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!valid) {
        throw new AppError_1.AppError(401, "Invalid email or password");
    }
    return toAuthResult(user.id);
}
async function getMe(userId) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            studentProfile: {
                include: { department: true, teamMembership: { select: { teamId: true, isLeader: true } } },
            },
            mentorProfile: { select: { id: true, fullName: true, phone: true, specialization: true, maxTeams: true, minTeams: true } },
        },
    });
    if (!user)
        throw new AppError_1.AppError(404, "User not found");
    return user;
}
async function toAuthResult(userId) {
    const user = await getMe(userId);
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, env_1.env.jwtSecret, {
        expiresIn: env_1.env.jwtExpiresIn,
    });
    return { token, user };
}
