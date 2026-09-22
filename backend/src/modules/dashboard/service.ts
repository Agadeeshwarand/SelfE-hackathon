import { prisma } from "../../utils/prisma";

export async function getAdminStats() {
  const [students, teams, eligibleTeams, mentors, assignedTeams, departments] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.team.count(),
    prisma.team.count({ where: { isEligible: true } }),
    prisma.mentorProfile.count(),
    prisma.mentorGuidanceAssignment.count(),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  const unassignedTeams = teams - assignedTeams;
  const ineligibleTeams = teams - eligibleTeams;

  const teamsByDept = await Promise.all(
    departments.map(async (d) => ({
      department: d.name,
      teams: await prisma.team.count({
        where: { members: { some: { student: { departmentId: d.id } } } },
      }),
    }))
  );

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

export async function listDepartments() {
  return prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}

export async function getHackathon() {
  return prisma.hackathon.findFirst({ where: { isActive: true } });
}
