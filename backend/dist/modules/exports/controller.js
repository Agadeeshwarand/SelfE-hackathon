"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.students = students;
exports.teams = teams;
exports.teamMembers = teamMembers;
exports.mentorAllocation = mentorAllocation;
exports.mentorSummary = mentorSummary;
exports.unknownExport = unknownExport;
const service_1 = require("./service");
const AppError_1 = require("../../utils/AppError");
async function sendExport(kind, req, res) {
    const result = await service_1.exporters[kind](req.query);
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.setHeader("Cache-Control", "no-store");
    res.send(result.buffer);
}
async function students(req, res) {
    await sendExport("students", req, res);
}
async function teams(req, res) {
    await sendExport("teams", req, res);
}
async function teamMembers(req, res) {
    await sendExport("team-members", req, res);
}
async function mentorAllocation(req, res) {
    await sendExport("mentor-allocation", req, res);
}
async function mentorSummary(req, res) {
    await sendExport("mentor-summary", req, res);
}
function unknownExport() {
    throw new AppError_1.AppError(404, "Unknown export");
}
