import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error";
import authRoutes from "./modules/auth/routes";
import teamRoutes from "./modules/teams/routes";
import mentorRoutes from "./modules/mentors/routes";
import allocationRoutes from "./modules/allocations/routes";
import studentRoutes from "./modules/students/routes";
import adminRoutes from "./modules/admin/routes";
import * as adminController from "./modules/admin/controller";
import exportRoutes from "./modules/exports/routes";
import notificationRoutes from "./modules/notifications/routes";
import * as allocationController from "./modules/allocations/controller";
import { asyncHandler } from "./utils/asyncHandler";
import { requireAuth, requireRole } from "./middleware/auth";

export const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/departments", asyncHandler(adminController.departments));

app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/mentor-allocations", allocationRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/api/mentor/dashboard", requireAuth, requireRole("MENTOR"), asyncHandler(allocationController.mentorDashboard));

app.use(notFoundHandler);
app.use(errorHandler);
