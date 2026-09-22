import { Request, Response } from "express";
import * as studentService from "./service";

export async function listStudents(req: Request, res: Response) {
  const result = await studentService.listStudents(req.query as Record<string, unknown>);
  res.status(200).json(result);
}

export async function getStudent(req: Request, res: Response) {
  const student = await studentService.getStudent(req.params.id);
  res.status(200).json(student);
}

export async function me(req: Request, res: Response) {
  const student = await studentService.getMyStudentProfile(req.auth!.userId);
  res.status(200).json(student);
}


export async function updateMe(req: Request, res: Response) {
  const student = await studentService.updateMyStudentProfile(req.auth!.userId, req.body);
  res.status(200).json(student);
}
