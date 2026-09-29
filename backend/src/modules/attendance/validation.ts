import { z } from "zod";

export const attendanceQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  sessionName: z.string().trim().min(2).max(100).default("Mentor Guidance Session"),
});

export const saveAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  sessionName: z.string().trim().min(2).max(100),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      teamId: z.string().min(1),
      status: z.enum(["PRESENT", "ABSENT"]),
    })
  ).max(2000),
});

export const adminAttendanceQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional(),
  mentorId: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
});
