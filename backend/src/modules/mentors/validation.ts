import { z } from "zod";

export const createMentorSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional().or(z.literal("")),
  specialization: z.string().max(120).optional().or(z.literal("")),
  password: z.string().min(8).max(72),
  minTeams: z.number().int().min(0).max(1000).optional(),
  maxTeams: z.number().int().min(1).max(1000).optional(),
  isActive: z.boolean().optional(),
});
export type CreateMentorInput = z.infer<typeof createMentorSchema>;

export const updateMentorSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional().or(z.literal("")),
  specialization: z.string().max(120).optional().or(z.literal("")),
  password: z.string().min(8).max(72).optional(),
  minTeams: z.number().int().min(0).max(1000).optional(),
  maxTeams: z.number().int().min(1).max(1000).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateMentorInput = z.infer<typeof updateMentorSchema>;


export const mentorGroupSchema = z.object({
  mainMentorId: z.string().min(1),
  coMentorIds: z.array(z.string().min(1)).max(10).default([]),
});
export type MentorGroupInput = z.infer<typeof mentorGroupSchema>;
