"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudentMessage = exports.createStudentMessage = exports.listMessages = void 0;
exports.getAdminStats = getAdminStats;
exports.listDepartments = listDepartments;
const prisma_1 = require("../../utils/prisma");
async function getAdminStats() {
    const [totalStudents, totalTeams, eligibleTeams, totalMentors, assignedTeams, activeMentors, departments,] = await Promise.all([
        prisma_1.prisma.studentProfile.count(),
        prisma_1.prisma.team.count(),
        prisma_1.prisma.team.count({ where: { isEligible: true } }),
        prisma_1.prisma.mentorProfile.count(),
        prisma_1.prisma.mentorGuidanceAssignment.count(),
        prisma_1.prisma.user.count({ where: { role: "MENTOR", isActive: true } }),
        prisma_1.prisma.department.findMany({
            include: { _count: { select: { students: true } } },
            orderBy: { name: "asc" },
        }),
    ]);
    const unassignedTeams = totalTeams - assignedTeams;
    const ineligibleTeams = totalTeams - eligibleTeams;
    const recentTeams = await prisma_1.prisma.team.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, teamCode: true, isEligible: true, createdAt: true, _count: { select: { members: true } } },
    });
    return {
        totals: {
            students: totalStudents,
            teams: totalTeams,
            eligibleTeams,
            ineligibleTeams,
            mentors: totalMentors,
            activeMentors,
            assignedTeams,
            unassignedTeams,
        },
        eligibilityDistribution: {
            eligible: eligibleTeams,
            ineligible: ineligibleTeams,
        },
        allocationDistribution: {
            assigned: assignedTeams,
            unassigned: unassignedTeams,
        },
        departments: departments.map((d) => ({
            name: d.name,
            studentCount: d._count.students,
        })),
        recentTeams,
    };
}
async function listDepartments() {
    return prisma_1.prisma.department.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    });
}
var announcements_1 = require("./announcements");
Object.defineProperty(exports, "listMessages", { enumerable: true, get: function () { return announcements_1.listMessages; } });
Object.defineProperty(exports, "createStudentMessage", { enumerable: true, get: function () { return announcements_1.createStudentMessage; } });
Object.defineProperty(exports, "deleteStudentMessage", { enumerable: true, get: function () { return announcements_1.deleteStudentMessage; } });
