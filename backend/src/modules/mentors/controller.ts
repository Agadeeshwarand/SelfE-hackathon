import { Request, Response } from "express";
import { createMentorSchema, updateMentorSchema } from "./validation";
import * as mentorService from "./service";
import { z } from "zod";
import { AppError } from "../../utils/AppError";

export async function listMentors(req: Request, res: Response) {
  const result = await mentorService.listMentors(req.query as Record<string, unknown>);
  res.status(200).json(result);
}

export async function listAllocationMentors(_req: Request, res: Response) {
  const items = await mentorService.listAllMentorsForAllocation();
  res.status(200).json({ items });
}

export async function getMentor(req: Request, res: Response) {
  const mentor = await mentorService.getMentor(req.params.id);
  if (req.auth!.role === "MENTOR") {
    const mine = await mentorService.getMentorByUserId(req.auth!.userId);
    if (mine.id !== mentor.id) {
      throw new AppError(403, "You do not have permission to view this mentor");
    }
  }
  res.status(200).json(mentor);
}

export async function createMentor(req: Request, res: Response) {
  const input = createMentorSchema.parse(req.body);
  const mentor = await mentorService.createMentor(input);
  res.status(201).json(mentor);
}

export async function updateMentor(req: Request, res: Response) {
  const input = updateMentorSchema.parse(req.body);
  const mentor = await mentorService.updateMentor(req.params.id, input);
  res.status(200).json(mentor);
}

export async function setMentorStatus(req: Request, res: Response) {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  const mentor = await mentorService.setMentorActive(req.params.id, isActive);
  res.status(200).json(mentor);
}

export async function deleteMentor(req: Request, res: Response) {
  const result = await mentorService.deleteMentor(req.params.id);
  res.status(200).json(result);
}

export async function myMentorProfile(req: Request, res: Response) {
  const mentor = await mentorService.getMentorByUserId(req.auth!.userId);
  res.status(200).json(mentor);
}
