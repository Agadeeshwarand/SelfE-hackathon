"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// Central error type so controllers can throw domain errors with a clear
// HTTP status instead of leaking stack traces or ad-hoc error shapes.
class AppError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
