import { Router } from "express";
import * as controller from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/me", requireRole("MENTOR"), asyncHandler(controller.myMentorProfile));
router.get("/allocation", requireRole("ADMIN"), asyncHandler(controller.listAllocationMentors));
router.get("/", requireRole("ADMIN"), asyncHandler(controller.listMentors));
router.post("/", requireRole("ADMIN"), asyncHandler(controller.createMentor));
router.get("/:id", requireRole("ADMIN", "MENTOR"), asyncHandler(controller.getMentor));
router.patch("/:id", requireRole("ADMIN"), asyncHandler(controller.updateMentor));
router.patch("/:id/status", requireRole("ADMIN"), asyncHandler(controller.setMentorStatus));
router.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.deleteMentor));

export default router;
