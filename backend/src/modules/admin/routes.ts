import { Router } from "express";
import * as controller from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.get("/departments", asyncHandler(controller.departments));
router.use(requireAuth);
router.get("/stats", requireRole("ADMIN"), asyncHandler(controller.stats));
router.get("/messages", requireRole("ADMIN"), asyncHandler(controller.listMessages));
router.post("/messages", requireRole("ADMIN"), asyncHandler(controller.createMessage));
router.delete("/messages/:id", requireRole("ADMIN"), asyncHandler(controller.deleteMessage));

export default router;
