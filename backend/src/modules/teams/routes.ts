import { Router } from "express";
import * as controller from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);
router.get("/me", requireRole("TEAM_LEADER", "TEAM_MEMBER"), asyncHandler(controller.getMyTeam));
router.post("/", requireRole("TEAM_LEADER", "TEAM_MEMBER"), asyncHandler(controller.createTeam));
router.post("/join", requireRole("TEAM_LEADER", "TEAM_MEMBER"), asyncHandler(controller.joinTeam));
router.get("/", requireRole("ADMIN"), asyncHandler(controller.listTeams));
router.get("/:id", asyncHandler(controller.getTeam));
router.delete("/:id/members/:studentId", asyncHandler(controller.removeMember));

export default router;
