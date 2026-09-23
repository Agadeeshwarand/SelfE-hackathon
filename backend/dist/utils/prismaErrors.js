"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrismaUniqueViolation = isPrismaUniqueViolation;
function isPrismaUniqueViolation(err) {
    return typeof err === "object" && err !== null && err.code === "P2002";
}
