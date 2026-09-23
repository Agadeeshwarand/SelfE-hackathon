"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listForUser = listForUser;
const prisma_1 = require("../../utils/prisma");
async function listForUser(role) {
    const audience = role === "TEAM_LEADER" || role === "TEAM_MEMBER" ? ["ALL", "STUDENTS"] : role === "MENTOR" ? ["ALL", "MENTORS"] : ["ALL"];
    return prisma_1.prisma.announcement.findMany({
        where: { audience: { in: audience }, publishedAt: { not: null } },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 50,
    });
}
