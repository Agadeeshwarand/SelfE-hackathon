import { Request, Response } from "express";
import { exporters } from "./service";
import { AppError } from "../../utils/AppError";

async function sendExport(kind: keyof typeof exporters, req: Request, res: Response) {
  const result = await exporters[kind](req.query as Record<string, unknown>);
  res.setHeader("Content-Type", result.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(result.buffer);
}

export async function students(req: Request, res: Response) {
  await sendExport("students", req, res);
}
export async function teams(req: Request, res: Response) {
  await sendExport("teams", req, res);
}
export async function teamMembers(req: Request, res: Response) {
  await sendExport("team-members", req, res);
}
export async function mentorAllocation(req: Request, res: Response) {
  await sendExport("mentor-allocation", req, res);
}
export async function mentorSummary(req: Request, res: Response) {
  await sendExport("mentor-summary", req, res);
}

export function unknownExport(): never {
  throw new AppError(404, "Unknown export");
}
