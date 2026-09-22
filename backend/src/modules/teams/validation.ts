import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(2).max(80),
});
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const joinTeamSchema = z.object({
  teamCode: z.string().min(4).max(20),
});
export type JoinTeamInput = z.infer<typeof joinTeamSchema>;
