import { Router } from "express";
import * as controller from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get(
  "/me",
  requireRole("TEAM_LEADER", "TEAM_MEMBER"),
  asyncHandler(controller.me)
);

router.patch(
  "/me",
  requireRole("TEAM_LEADER", "TEAM_MEMBER"),
  asyncHandler(controller.updateMe)
);

router.get(
  "/",
  requireRole("ADMIN"),
  asyncHandler(controller.listStudents)
);

router.get(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(controller.getStudent)
);

router.patch(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(controller.updateStudent)
);

export default router;