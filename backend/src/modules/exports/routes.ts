import { Router } from "express";
import * as controller from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));
router.get("/students", asyncHandler(controller.students));
router.get("/teams", asyncHandler(controller.teams));
router.get("/team-members", asyncHandler(controller.teamMembers));
router.get("/mentor-allocation", asyncHandler(controller.mentorAllocation));
router.get("/mentor-summary", asyncHandler(controller.mentorSummary));
router.get("/mentor-team-members", asyncHandler(controller.mentorTeamMembers));
router.get("/attendance", asyncHandler(controller.attendance));

export default router;
