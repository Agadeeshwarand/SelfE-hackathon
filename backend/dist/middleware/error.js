"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const zod_1 = require("zod");
const AppError_1 = require("../utils/AppError");
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError_1.AppError) {
        return res.status(err.status).json({
            error: err.message,
            ...(err.details !== undefined
                ? { details: err.details }
                : {}),
        });
    }
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: "Validation failed",
            details: err.flatten(),
        });
    }
    console.error("Unhandled error:", err);
    return res.status(500).json({
        error: "Internal server error",
    });
}
function notFoundHandler(req, res) {
    console.warn(`[404] ${req.method} ${req.originalUrl}`);
    return res.status(404).json({
        error: "Route not found",
        method: req.method,
        path: req.originalUrl,
    });
}
