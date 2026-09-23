"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(120),
    registerNumber: zod_1.z.string().min(2).max(40),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(7).max(20),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
    department: zod_1.z.string().min(1),
    year: zod_1.z.number().int().min(1).max(6),
    college: zod_1.z.string().min(2).max(160),
    password: zod_1.z.string().min(8).max(72),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
