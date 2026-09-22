import { Request, Response } from "express";
import { assignSchema } from "./validation";
import * as allocationService from "./service";

export async function assign(req: Request, res: Response) {
  const input = assignSchema.parse(req.body);
  const result = await allocationService.assignTeams(input.mentorId, input.teamIds, input.reassign ?? false);
  res.status(200).json(result);
}

export async function unassign(req: Request, res: Response) {
  const result = await allocationService.unassign(req.params.id);
  res.status(200).json(result);
}

export async function unassignTeam(req: Request, res: Response) {
  const result = await allocationService.unassignTeam(req.params.teamId);
  res.status(200).json(result);
}

export async function list(req: Request, res: Response) {
  const items = await allocationService.listAssignments();
  res.status(200).json({ items });
}

export async function mentorDashboard(req: Request, res: Response) {
  const result = await allocationService.getMentorDashboard(req.auth!.userId);
  res.status(200).json(result);
}
