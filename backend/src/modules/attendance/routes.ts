import { Router } from "express";
import * as controller from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get(
  "/mentor",
  requireRole("MENTOR"),
  asyncHandler(controller.mentorAttendance)
);

router.post(
  "/mentor",
  requireRole("MENTOR"),
  asyncHandler(controller.saveMentorAttendance)
);

router.post(
  "/mentor/:id/submit",
  requireRole("MENTOR"),
  asyncHandler(controller.submitMentorAttendance)
);

router.get(
  "/admin",
  requireRole("ADMIN"),
  asyncHandler(controller.adminAttendance)
);

router.get(
  "/admin/:id",
  requireRole("ADMIN"),
  asyncHandler(controller.adminAttendanceSession)
);

export default router;
