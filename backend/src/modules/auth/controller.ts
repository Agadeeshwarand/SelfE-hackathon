import { Request, Response } from "express";
import { registerSchema, loginSchema } from "./validation";
import * as authService from "./service";

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await authService.registerStudent(input);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.status(200).json(result);
}

export async function me(req: Request, res: Response) {
  const result = await authService.getMe(req.auth!.userId);
  res.status(200).json(result);
}
