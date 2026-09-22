import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { Role } from "@prisma/client";
import { prisma } from "../utils/prisma";

export interface AuthPayload {
  userId: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "Missing or invalid Authorization header");
    }
    const token = header.slice("Bearer ".length);
    let payload: AuthPayload;
    try {
      payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    } catch {
      throw new AppError(401, "Invalid or expired token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new AppError(401, "Invalid or expired token");
    }

    // Always use the database role — never trust a client-supplied or stale JWT role.
    req.auth = { userId: user.id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

// Role-based access control: usage `requireRole("ADMIN", "MENTOR")`
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new AppError(401, "Not authenticated");
    if (!roles.includes(req.auth.role)) {
      throw new AppError(403, "You do not have permission to perform this action");
    }
    next();
  };
}
