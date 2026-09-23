"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const AppError_1 = require("../utils/AppError");
const prisma_1 = require("../utils/prisma");
async function requireAuth(req, _res, next) {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            throw new AppError_1.AppError(401, "Missing or invalid Authorization header");
        }
        const token = header.slice("Bearer ".length);
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        }
        catch {
            throw new AppError_1.AppError(401, "Invalid or expired token");
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, role: true, isActive: true },
        });
        if (!user || !user.isActive) {
            throw new AppError_1.AppError(401, "Invalid or expired token");
        }
        // Always use the database role — never trust a client-supplied or stale JWT role.
        req.auth = { userId: user.id, role: user.role };
        next();
    }
    catch (err) {
        next(err);
    }
}
// Role-based access control: usage `requireRole("ADMIN", "MENTOR")`
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.auth)
            throw new AppError_1.AppError(401, "Not authenticated");
        if (!roles.includes(req.auth.role)) {
            throw new AppError_1.AppError(403, "You do not have permission to perform this action");
        }
        next();
    };
}
