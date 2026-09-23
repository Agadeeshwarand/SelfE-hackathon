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
exports.listMentors = listMentors;
exports.listAllocationMentors = listAllocationMentors;
exports.getMentor = getMentor;
exports.createMentor = createMentor;
exports.updateMentor = updateMentor;
exports.setMentorStatus = setMentorStatus;
exports.deleteMentor = deleteMentor;
exports.myMentorProfile = myMentorProfile;
const validation_1 = require("./validation");
const mentorService = __importStar(require("./service"));
const zod_1 = require("zod");
const AppError_1 = require("../../utils/AppError");
async function listMentors(req, res) {
    const result = await mentorService.listMentors(req.query);
    res.status(200).json(result);
}
async function listAllocationMentors(_req, res) {
    const items = await mentorService.listAllMentorsForAllocation();
    res.status(200).json({ items });
}
async function getMentor(req, res) {
    const mentor = await mentorService.getMentor(req.params.id);
    if (req.auth.role === "MENTOR") {
        const mine = await mentorService.getMentorByUserId(req.auth.userId);
        if (mine.id !== mentor.id) {
            throw new AppError_1.AppError(403, "You do not have permission to view this mentor");
        }
    }
    res.status(200).json(mentor);
}
async function createMentor(req, res) {
    const input = validation_1.createMentorSchema.parse(req.body);
    const mentor = await mentorService.createMentor(input);
    res.status(201).json(mentor);
}
async function updateMentor(req, res) {
    const input = validation_1.updateMentorSchema.parse(req.body);
    const mentor = await mentorService.updateMentor(req.params.id, input);
    res.status(200).json(mentor);
}
async function setMentorStatus(req, res) {
    const { isActive } = zod_1.z.object({ isActive: zod_1.z.boolean() }).parse(req.body);
    const mentor = await mentorService.setMentorActive(req.params.id, isActive);
    res.status(200).json(mentor);
}
async function deleteMentor(req, res) {
    const result = await mentorService.deleteMentor(req.params.id);
    res.status(200).json(result);
}
async function myMentorProfile(req, res) {
    const mentor = await mentorService.getMentorByUserId(req.auth.userId);
    res.status(200).json(mentor);
}
