"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAttendanceQuerySchema = exports.saveAttendanceSchema = exports.attendanceQuerySchema = void 0;
const zod_1 = require("zod");
exports.attendanceQuerySchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    sessionName: zod_1.z.string().trim().min(2).max(100).default("Mentor Guidance Session"),
});
exports.saveAttendanceSchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    sessionName: zod_1.z.string().trim().min(2).max(100),
    records: zod_1.z.array(zod_1.z.object({
        studentId: zod_1.z.string().min(1),
        teamId: zod_1.z.string().min(1),
        status: zod_1.z.enum(["PRESENT", "ABSENT"]),
    })).max(2000),
});
exports.adminAttendanceQuerySchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional(),
    mentorId: zod_1.z.string().optional(),
    status: zod_1.z.enum(["DRAFT", "SUBMITTED"]).optional(),
});
