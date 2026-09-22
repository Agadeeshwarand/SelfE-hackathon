import { Request, Response } from "express";
import * as notificationService from "./service";

export async function list(req: Request, res: Response) {
  const items = await notificationService.listForUser(req.auth!.role);
  res.status(200).json({ items });
}
