"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMentorSchema = exports.createMentorSchema = void 0;
const zod_1 = require("zod");
exports.createMentorSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(120),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(7).max(20).optional().or(zod_1.z.literal("")),
    specialization: zod_1.z.string().max(120).optional().or(zod_1.z.literal("")),
    password: zod_1.z.string().min(8).max(72),
    minTeams: zod_1.z.number().int().min(0).max(6).optional(),
    maxTeams: zod_1.z.number().int().min(1).max(6).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateMentorSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(120).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().min(7).max(20).optional().or(zod_1.z.literal("")),
    specialization: zod_1.z.string().max(120).optional().or(zod_1.z.literal("")),
    password: zod_1.z.string().min(8).max(72).optional(),
    minTeams: zod_1.z.number().int().min(0).max(6).optional(),
    maxTeams: zod_1.z.number().int().min(1).max(6).optional(),
    isActive: zod_1.z.boolean().optional(),
});
