"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMessages = listMessages;
exports.createStudentMessage = createStudentMessage;
exports.deleteStudentMessage = deleteStudentMessage;
exports.listStudentNotifications = listStudentNotifications;
const prisma_1 = require("../../utils/prisma");
const AppError_1 = require("../../utils/AppError");
async function listMessages() {
    return prisma_1.prisma.announcement.findMany({
        where: { audience: "STUDENTS" },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 50,
    });
}
async function createStudentMessage(input) {
    const title = input.title.trim();
    const description = input.description.trim();
    if (!title || !description)
        throw new AppError_1.AppError(400, "Title and message are required");
    return prisma_1.prisma.announcement.create({
        data: {
            title,
            description,
            audience: "STUDENTS",
            priority: input.priority?.trim() || "NORMAL",
            publishedAt: new Date(),
        },
    });
}
async function deleteStudentMessage(id) {
    const message = await prisma_1.prisma.announcement.findUnique({ where: { id } });
    if (!message)
        throw new AppError_1.AppError(404, "Message not found");
    await prisma_1.prisma.announcement.delete({ where: { id } });
    return { deleted: true };
}
async function listStudentNotifications() {
    return prisma_1.prisma.announcement.findMany({
        where: { audience: { in: ["ALL", "STUDENTS"] }, publishedAt: { not: null } },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 50,
    });
}
