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
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorAttendance = mentorAttendance;
exports.saveMentorAttendance = saveMentorAttendance;
exports.submitMentorAttendance = submitMentorAttendance;
exports.adminAttendance = adminAttendance;
exports.adminAttendanceSession = adminAttendanceSession;
const validation_1 = require("./validation");
const attendanceService = __importStar(require("./service"));
async function mentorAttendance(req, res) {
    const input = validation_1.attendanceQuerySchema.parse(req.query);
    const result = await attendanceService.getMentorAttendance(req.auth.userId, input.date, input.sessionName);
    res.status(200).json(result);
}
async function saveMentorAttendance(req, res) {
    const input = validation_1.saveAttendanceSchema.parse(req.body);
    const result = await attendanceService.saveMentorAttendance(req.auth.userId, input);
    res.status(200).json(result);
}
async function submitMentorAttendance(req, res) {
    const result = await attendanceService.submitMentorAttendance(req.auth.userId, req.params.id);
    res.status(200).json(result);
}
async function adminAttendance(req, res) {
    const input = validation_1.adminAttendanceQuerySchema.parse(req.query);
    const items = await attendanceService.listAdminAttendance(input);
    res.status(200).json({ items });
}
async function adminAttendanceSession(req, res) {
    const result = await attendanceService.getAdminAttendanceSession(req.params.id);
    res.status(200).json(result);
}
