"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignSchema = void 0;
const zod_1 = require("zod");
exports.assignSchema = zod_1.z.object({
    mentorId: zod_1.z.string().min(1),
    teamIds: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    reassign: zod_1.z.boolean().optional(),
});
