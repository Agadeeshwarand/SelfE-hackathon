"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const error_1 = require("./middleware/error");
const routes_1 = __importDefault(require("./modules/auth/routes"));
const routes_2 = __importDefault(require("./modules/teams/routes"));
const routes_3 = __importDefault(require("./modules/mentors/routes"));
const routes_4 = __importDefault(require("./modules/allocations/routes"));
const routes_5 = __importDefault(require("./modules/students/routes"));
const routes_6 = __importDefault(require("./modules/admin/routes"));
const adminController = __importStar(require("./modules/admin/controller"));
const routes_7 = __importDefault(require("./modules/exports/routes"));
const routes_8 = __importDefault(require("./modules/notifications/routes"));
const allocationController = __importStar(require("./modules/allocations/controller"));
const asyncHandler_1 = require("./utils/asyncHandler");
const auth_1 = require("./middleware/auth");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({
    origin: env_1.env.corsOrigin,
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
}));
exports.app.use(express_1.default.json());
exports.app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
exports.app.get("/api/departments", (0, asyncHandler_1.asyncHandler)(adminController.departments));
exports.app.use("/api/auth", routes_1.default);
exports.app.use("/api/teams", routes_2.default);
exports.app.use("/api/mentors", routes_3.default);
exports.app.use("/api/mentor-allocations", routes_4.default);
exports.app.use("/api/students", routes_5.default);
exports.app.use("/api/admin", routes_6.default);
exports.app.use("/api/exports", routes_7.default);
exports.app.use("/api/notifications", routes_8.default);
exports.app.get("/api/mentor/dashboard", auth_1.requireAuth, (0, auth_1.requireRole)("MENTOR"), (0, asyncHandler_1.asyncHandler)(allocationController.mentorDashboard));
exports.app.use(error_1.notFoundHandler);
exports.app.use(error_1.errorHandler);
