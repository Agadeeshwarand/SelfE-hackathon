import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/AppError";
import { getTeamWithEligibility } from "../teams/service";
import { serializeMentor } from "../mentors/service";

const MAX_TEAMS_PER_MENTOR = 6;

export async function assignTeams(mentorId: string, teamIds: string[], reassign = false) {
  const uniqueTeamIds = [...new Set(teamIds.filter(Boolean))];
  if (uniqueTeamIds.length === 0) {
    throw new AppError(400, "Select at least one team to assign");
  }

  const mentor = await prisma.mentorProfile.findUnique({
    where: { id: mentorId },
    include: {
      user: true,
      guidanceAssignments: true,
    },
  });
  if (!mentor) throw new AppError(404, "Mentor not found");
  if (!mentor.user.isActive) {
    throw new AppError(409, "Cannot assign teams to an inactive mentor");
  }

  const teams = await prisma.team.findMany({
    where: { id: { in: uniqueTeamIds } },
    include: { guidanceAssignment: true, members: true },
  });
  if (teams.length !== uniqueTeamIds.length) {
    throw new AppError(404, "One or more selected teams do not exist");
  }

  for (const team of teams) {
    if (!team.isEligible) {
      throw new AppError(409, `Team "${team.name}" is not eligible and cannot be assigned a mentor`);
    }
    if (team.guidanceAssignment?.mentorId === mentor.id) {
      throw new AppError(409, `Team "${team.name}" is already assigned to this mentor`);
    }
    if (team.guidanceAssignment && team.guidanceAssignment.mentorId !== mentor.id && !reassign) {
      throw new AppError(
        409,
        `Team "${team.name}" already has a mentor. Confirm reassignment to continue.`
      );
    }
  }

  const alreadyAssignedToThis = mentor.guidanceAssignments.filter((a) =>
    uniqueTeamIds.includes(a.teamId)
  ).length;
  const newCount = uniqueTeamIds.length - alreadyAssignedToThis;
  const maxTeams = Math.min(mentor.maxTeams, MAX_TEAMS_PER_MENTOR);
  if (mentor.guidanceAssignments.length + newCount > maxTeams) {
    throw new AppError(409, "Maximum team allocation reached.");
  }

  const results = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const team of teams) {
      if (team.guidanceAssignment && team.guidanceAssignment.mentorId !== mentor.id) {
        await tx.mentorGuidanceAssignment.delete({ where: { id: team.guidanceAssignment.id } });
      }
      const row = await tx.mentorGuidanceAssignment.create({
        data: { mentorId: mentor.id, teamId: team.id },
      });
      created.push(row);
    }
    return created;
  });

  const updated = await prisma.mentorProfile.findUniqueOrThrow({
    where: { id: mentor.id },
    include: {
      user: { select: { id: true, email: true, isActive: true, createdAt: true, role: true } },
      guidanceAssignments: {
        include: { team: { select: { id: true, name: true, isEligible: true } } },
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  return {
    mentor: serializeMentor(updated),
    assignedCount: results.length,
  };
}

export async function unassign(assignmentId: string) {
  const existing = await prisma.mentorGuidanceAssignment.findUnique({
    where: { id: assignmentId },
  });
  if (!existing) throw new AppError(404, "Assignment not found");
  await prisma.mentorGuidanceAssignment.delete({ where: { id: assignmentId } });
  return { deleted: true };
}

export async function unassignTeam(teamId: string) {
  const existing = await prisma.mentorGuidanceAssignment.findUnique({
    where: { teamId },
  });
  if (!existing) throw new AppError(404, "This team does not have a mentor assigned");
  await prisma.mentorGuidanceAssignment.delete({ where: { id: existing.id } });
  return { deleted: true };
}

export async function listAssignments() {
  const rows = await prisma.mentorGuidanceAssignment.findMany({
    include: {
      mentor: { include: { user: { select: { email: true } } } },
      team: { include: { members: true } },
    },
    orderBy: { assignedAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    assignedAt: row.assignedAt,
    mentor: {
      id: row.mentor.id,
      fullName: row.mentor.fullName,
      email: row.mentor.user.email,
    },
    team: {
      id: row.team.id,
      name: row.team.name,
      isEligible: row.team.isEligible,
      memberCount: row.team.members.length,
    },
  }));
}

export async function getMentorDashboard(userId: string) {
  const mentor = await prisma.mentorProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, email: true, isActive: true, createdAt: true, role: true } },
      guidanceAssignments: {
        include: { team: { select: { id: true, name: true, isEligible: true } } },
        orderBy: { assignedAt: "desc" },
      },
    },
  });
  if (!mentor) throw new AppError(404, "Mentor profile not found");

  const teams = [];
  for (const assignment of mentor.guidanceAssignments) {
    teams.push(await getTeamWithEligibility(assignment.team.id));
  }

  return {
    mentor: serializeMentor(mentor),
    teams,
  };
}
