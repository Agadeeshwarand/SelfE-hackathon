"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
// Wraps async route handlers so thrown/rejected errors reach errorHandler
// instead of crashing the process or hanging the request.
function asyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
