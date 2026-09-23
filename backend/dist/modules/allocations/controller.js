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
exports.assign = assign;
exports.unassign = unassign;
exports.unassignTeam = unassignTeam;
exports.list = list;
exports.mentorDashboard = mentorDashboard;
const validation_1 = require("./validation");
const allocationService = __importStar(require("./service"));
async function assign(req, res) {
    const input = validation_1.assignSchema.parse(req.body);
    const result = await allocationService.assignTeams(input.mentorId, input.teamIds, input.reassign ?? false);
    res.status(200).json(result);
}
async function unassign(req, res) {
    const result = await allocationService.unassign(req.params.id);
    res.status(200).json(result);
}
async function unassignTeam(req, res) {
    const result = await allocationService.unassignTeam(req.params.teamId);
    res.status(200).json(result);
}
async function list(req, res) {
    const items = await allocationService.listAssignments();
    res.status(200).json({ items });
}
async function mentorDashboard(req, res) {
    const result = await allocationService.getMentorDashboard(req.auth.userId);
    res.status(200).json(result);
}
