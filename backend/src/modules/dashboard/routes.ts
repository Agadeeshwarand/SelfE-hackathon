import { Router } from "express";
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as dashboardService from "./service";

const router = Router();

router.get(
  "/stats",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await dashboardService.getAdminStats());
  })
);

router.get(
  "/departments",
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await dashboardService.listDepartments());
  })
);

router.get(
  "/hackathon",
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await dashboardService.getHackathon());
  })
);

export default router;
