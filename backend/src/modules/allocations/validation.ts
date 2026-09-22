import { z } from "zod";

export const assignSchema = z.object({
  mentorId: z.string().min(1),
  teamIds: z.array(z.string().min(1)).min(1),
  reassign: z.boolean().optional(),
});
export type AssignInput = z.infer<typeof assignSchema>;
