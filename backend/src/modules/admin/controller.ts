import { Request, Response } from "express";
import * as adminService from "./service";

export async function stats(_req: Request, res: Response) {
  const result = await adminService.getAdminStats();
  res.status(200).json(result);
}

export async function departments(_req: Request, res: Response) {
  const items = await adminService.listDepartments();
  res.status(200).json({ items });
}

export async function listMessages(_req: Request, res: Response) {
  const result = await adminService.listMessages();
  res.status(200).json({ items: result });
}

export async function createMessage(req: Request, res: Response) {
  const result = await adminService.createStudentMessage(req.body);
  res.status(201).json(result);
}

export async function deleteMessage(req: Request, res: Response) {
  const result = await adminService.deleteStudentMessage(req.params.id);
  res.status(200).json(result);
}
