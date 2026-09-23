"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = getAdminStats;
exports.listDepartments = listDepartments;
exports.getHackathon = getHackathon;
const prisma_1 = require("../../utils/prisma");
async function getAdminStats() {
    const [students, teams, eligibleTeams, mentors, assignedTeams, departments] = await Promise.all([
        prisma_1.prisma.studentProfile.count(),
        prisma_1.prisma.team.count(),
        prisma_1.prisma.team.count({ where: { isEligible: true } }),
        prisma_1.prisma.mentorProfile.count(),
        prisma_1.prisma.mentorGuidanceAssignment.count(),
        prisma_1.prisma.department.findMany({ orderBy: { name: "asc" } }),
    ]);
    const unassignedTeams = teams - assignedTeams;
    const ineligibleTeams = teams - eligibleTeams;
    const teamsByDept = await Promise.all(departments.map(async (d) => ({
        department: d.name,
        teams: await prisma_1.prisma.team.count({
            where: { members: { some: { student: { departmentId: d.id } } } },
        }),
    })));
    return {
        totalStudents: students,
        totalTeams: teams,
        eligibleTeams,
        ineligibleTeams,
        totalMentors: mentors,
        assignedTeams,
        unassignedTeams,
        eligibilityDistribution: [
            { label: "Eligible", value: eligibleTeams },
            { label: "Not eligible", value: ineligibleTeams },
        ],
        allocationDistribution: [
            { label: "Assigned", value: assignedTeams },
            { label: "Unassigned", value: unassignedTeams },
        ],
        teamsByDepartment: teamsByDept.filter((d) => d.teams > 0),
    };
}
async function listDepartments() {
    return prisma_1.prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}
async function getHackathon() {
    return prisma_1.prisma.hackathon.findFirst({ where: { isActive: true } });
}
