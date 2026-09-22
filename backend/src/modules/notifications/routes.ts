import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(controller.list));
export default router;
