import { Request, Response } from "express";
import { createTeamSchema, joinTeamSchema } from "./validation";
import * as teamService from "./service";
import { AppError } from "../../utils/AppError";

export async function createTeam(req: Request, res: Response) {
  const input = createTeamSchema.parse(req.body);
  const team = await teamService.createTeam(req.auth!.userId, input);
  res.status(201).json(team);
}

export async function joinTeam(req: Request, res: Response) {
  const input = joinTeamSchema.parse(req.body);
  const team = await teamService.joinTeam(req.auth!.userId, input.teamCode);
  res.status(200).json(team);
}

export async function getMyTeam(req: Request, res: Response) {
  const team = await teamService.getMyTeam(req.auth!.userId);
  res.status(200).json({ team });
}

export async function listTeams(req: Request, res: Response) {
  const result = await teamService.listTeams(req.query as Record<string, unknown>);
  res.status(200).json(result);
}

export async function getTeam(req: Request, res: Response) {
  const team = await teamService.getTeamById(req.params.id, req.auth!);
  res.status(200).json(team);
}

export async function removeMember(req: Request, res: Response) {
  const result = await teamService.removeMember(req.auth!, req.params.id, req.params.studentId);
  res.status(200).json(result);
}

export async function requireTeamId(req: Request, _res: Response, next: () => void) {
  if (!req.params.id) throw new AppError(400, "Team id is required");
  next();
}
