"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinTeamSchema = exports.createTeamSchema = void 0;
const zod_1 = require("zod");
exports.createTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(80),
});
exports.joinTeamSchema = zod_1.z.object({
    teamCode: zod_1.z.string().min(4).max(20),
});
