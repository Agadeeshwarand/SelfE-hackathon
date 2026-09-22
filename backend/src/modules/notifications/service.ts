import { prisma } from "../../utils/prisma";

export async function listForUser(role: string) {
  const audience = role === "TEAM_LEADER" || role === "TEAM_MEMBER" ? ["ALL", "STUDENTS"] : role === "MENTOR" ? ["ALL", "MENTORS"] : ["ALL"];
  return prisma.announcement.findMany({
    where: { audience: { in: audience }, publishedAt: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
}
