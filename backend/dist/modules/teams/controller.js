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
exports.createTeam = createTeam;
exports.joinTeam = joinTeam;
exports.getMyTeam = getMyTeam;
exports.listTeams = listTeams;
exports.getTeam = getTeam;
exports.removeMember = removeMember;
exports.requireTeamId = requireTeamId;
const validation_1 = require("./validation");
const teamService = __importStar(require("./service"));
const AppError_1 = require("../../utils/AppError");
async function createTeam(req, res) {
    const input = validation_1.createTeamSchema.parse(req.body);
    const team = await teamService.createTeam(req.auth.userId, input);
    res.status(201).json(team);
}
async function joinTeam(req, res) {
    const input = validation_1.joinTeamSchema.parse(req.body);
    const team = await teamService.joinTeam(req.auth.userId, input.teamCode);
    res.status(200).json(team);
}
async function getMyTeam(req, res) {
    const team = await teamService.getMyTeam(req.auth.userId);
    res.status(200).json({ team });
}
async function listTeams(req, res) {
    const result = await teamService.listTeams(req.query);
    res.status(200).json(result);
}
async function getTeam(req, res) {
    const team = await teamService.getTeamById(req.params.id, req.auth);
    res.status(200).json(team);
}
async function removeMember(req, res) {
    const result = await teamService.removeMember(req.auth, req.params.id, req.params.studentId);
    res.status(200).json(result);
}
async function requireTeamId(req, _res, next) {
    if (!req.params.id)
        throw new AppError_1.AppError(400, "Team id is required");
    next();
}
