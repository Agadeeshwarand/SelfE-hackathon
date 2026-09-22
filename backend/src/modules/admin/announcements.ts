import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/AppError";

export async function listMessages() {
  return prisma.announcement.findMany({
    where: { audience: "STUDENTS" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
}

export async function createStudentMessage(input: { title: string; description: string; priority?: string }) {
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) throw new AppError(400, "Title and message are required");
  return prisma.announcement.create({
    data: {
      title,
      description,
      audience: "STUDENTS",
      priority: input.priority?.trim() || "NORMAL",
      publishedAt: new Date(),
    },
  });
}

export async function deleteStudentMessage(id: string) {
  const message = await prisma.announcement.findUnique({ where: { id } });
  if (!message) throw new AppError(404, "Message not found");
  await prisma.announcement.delete({ where: { id } });
  return { deleted: true };
}

export async function listStudentNotifications() {
  return prisma.announcement.findMany({
    where: { audience: { in: ["ALL", "STUDENTS"] }, publishedAt: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
}
