import { prisma } from "../../utils/prisma";

export async function getAdminStats() {
  const [
    totalStudents,
    totalTeams,
    eligibleTeams,
    totalMentors,
    assignedTeams,
    activeMentors,
    departments,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.team.count(),
    prisma.team.count({ where: { isEligible: true } }),
    prisma.mentorProfile.count(),
    prisma.mentorGuidanceAssignment.count(),
    prisma.user.count({ where: { role: "MENTOR", isActive: true } }),
    prisma.department.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const unassignedTeams = totalTeams - assignedTeams;
  const ineligibleTeams = totalTeams - eligibleTeams;

  const recentTeams = await prisma.team.findMany({
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

export async function listDepartments() {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export { listMessages, createStudentMessage, deleteStudentMessage } from "./announcements";
