import { Router } from "express";
import * as controller from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);
router.get("/", requireRole("ADMIN"), asyncHandler(controller.list));
router.post("/", requireRole("ADMIN"), asyncHandler(controller.assign));
router.delete("/team/:teamId", requireRole("ADMIN"), asyncHandler(controller.unassignTeam));
router.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.unassign));

export default router;
