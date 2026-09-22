import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  registerNumber: z.string().min(2).max(40),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  department: z.string().min(1),
  year: z.number().int().min(1).max(6),
  college: z.string().min(2).max(160),
  password: z.string().min(8).max(72),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
