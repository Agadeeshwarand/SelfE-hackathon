import { Request, Response } from "express";
import {
  adminAttendanceQuerySchema,
  attendanceQuerySchema,
  saveAttendanceSchema,
} from "./validation";
import * as attendanceService from "./service";

export async function mentorAttendance(req: Request, res: Response) {
  const input = attendanceQuerySchema.parse(req.query);
  const result = await attendanceService.getMentorAttendance(
    req.auth!.userId,
    input.date,
    input.sessionName
  );
  res.status(200).json(result);
}

export async function saveMentorAttendance(req: Request, res: Response) {
  const input = saveAttendanceSchema.parse(req.body);
  const result = await attendanceService.saveMentorAttendance(
    req.auth!.userId,
    input
  );
  res.status(200).json(result);
}

export async function submitMentorAttendance(req: Request, res: Response) {
  const result = await attendanceService.submitMentorAttendance(
    req.auth!.userId,
    req.params.id
  );
  res.status(200).json(result);
}

export async function adminAttendance(req: Request, res: Response) {
  const input = adminAttendanceQuerySchema.parse(req.query);
  const items = await attendanceService.listAdminAttendance(input);
  res.status(200).json({ items });
}

export async function adminAttendanceSession(req: Request, res: Response) {
  const result = await attendanceService.getAdminAttendanceSession(req.params.id);
  res.status(200).json(result);
}
