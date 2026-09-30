import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/AppError";
import { paginated, parsePagination } from "../../utils/pagination";
import { CreateMentorInput, UpdateMentorInput } from "./validation";

const SALT_ROUNDS = 12;

const mentorInclude = {
  user: { select: { id: true, email: true, isActive: true, createdAt: true, role: true } },
  guidanceAssignments: {
    include: {
      team: { select: { id: true, name: true, isEligible: true, teamCode: true } },
    },
    orderBy: { assignedAt: "desc" as const },
  },
  mainMentorGroup: {
    include: {
      members: {
        include: {
          mentor: { select: { id: true, fullName: true, phone: true, specialization: true, user: { select: { email: true, isActive: true } } } },
        },
      },
      assignments: { include: { team: { select: { id: true, name: true, isEligible: true, teamCode: true } } } },
    },
  },
  mentorGroupMembership: {
    include: {
      group: {
        include: {
          mainMentor: { select: { id: true, fullName: true, user: { select: { email: true } } } },
          members: {
            include: {
              mentor: { select: { id: true, fullName: true, phone: true, specialization: true, user: { select: { email: true, isActive: true } } } },
            },
          },
          assignments: { include: { team: { select: { id: true, name: true, isEligible: true, teamCode: true } } } },
        },
      },
    },
  },
};

function groupForMentor(mentor: any) {
  const group = mentor.mainMentorGroup ?? mentor.mentorGroupMembership?.group ?? null;
  if (!group) {
    return {
      id: null,
      role: "MAIN" as const,
      mainMentor: { id: mentor.id, fullName: mentor.fullName, email: mentor.user.email },
      coMentors: [],
      members: [{ id: mentor.id, fullName: mentor.fullName, email: mentor.user.email, role: "MAIN", isActive: mentor.user.isActive }],
    };
  }
  const main = group.mainMentor ?? mentor;
  const members = (group.members ?? []).map((m: any) => ({
    id: m.mentor.id,
    fullName: m.mentor.fullName,
    email: m.mentor.user.email,
    phone: m.mentor.phone,
    specialization: m.mentor.specialization,
    isActive: m.mentor.user.isActive,
    role: m.role,
  }));
  return {
    id: group.id,
    role: mentor.id === group.mainMentorId ? "MAIN" as const : ((group.members ?? []).find((m: any) => m.mentorId === mentor.id)?.role ?? "CO_MENTOR"),
    mainMentor: { id: main.id, fullName: main.fullName, email: main.user.email },
    coMentors: members.filter((m: any) => m.id !== group.mainMentorId),
    members,
  };
}

export function serializeMentor(mentor: any) {
  const group = groupForMentor(mentor);
  const groupData = mentor.mainMentorGroup ?? mentor.mentorGroupMembership?.group ?? null;
  const groupAssignments = groupData?.assignments ?? null;
  const assignedTeamCount = groupAssignments ? groupAssignments.length : mentor.guidanceAssignments.length;
  const maxTeams = groupData?.mainMentor?.maxTeams ?? mentor.maxTeams;
  const availableCapacity = Math.max(0, maxTeams - assignedTeamCount);
  return {
    id: mentor.id,
    userId: mentor.user.id,
    fullName: mentor.fullName,
    email: mentor.user.email,
    phone: mentor.phone,
    specialization: mentor.specialization,
    department: mentor.specialization,
    status: mentor.user.isActive ? "ACTIVE" : "INACTIVE",
    isActive: mentor.user.isActive,
    minTeams: mentor.minTeams,
    maxTeams,
    assignedTeamCount,
    availableCapacity,
    atCapacity: assignedTeamCount >= maxTeams,
    belowRecommended: assignedTeamCount < mentor.minTeams,
    assignedTeams: (groupAssignments ?? mentor.guidanceAssignments).map((a: any) => ({
      assignmentId: a.id,
      teamId: a.team.id,
      teamName: a.team.name,
      teamCode: a.team.teamCode,
      isEligible: a.team.isEligible,
      assignedAt: a.assignedAt,
    })),
    mentorGroup: group,
    createdAt: mentor.createdAt,
  };
}

async function ensureMentorGroup(mentorId: string) {
  const mentor = await prisma.mentorProfile.findUnique({ where: { id: mentorId } });
  if (!mentor) throw new AppError(404, "Mentor not found");

  const membership = await prisma.mentorGroupMember.findUnique({ where: { mentorId } });
  if (membership) return membership.groupId;

  const existingMain = await prisma.mentorGroup.findUnique({ where: { mainMentorId: mentorId } });
  if (existingMain) return existingMain.id;

  const group = await prisma.mentorGroup.create({
    data: {
      mainMentorId: mentorId,
      members: { create: { mentorId, role: "MAIN" } },
    },
  });
  await prisma.mentorGuidanceAssignment.updateMany({
    where: { mentorId },
    data: { mentorGroupId: group.id },
  });
  return group.id;
}

export async function listMentors(query: Record<string, unknown>) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const where: Prisma.MentorProfileWhereInput = {};
  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { specialization: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (query.status === "ACTIVE") where.user = { isActive: true };
  if (query.status === "INACTIVE") where.user = { isActive: false };

  const [rows, total] = await Promise.all([
    prisma.mentorProfile.findMany({ where, skip, take, orderBy: { fullName: "asc" }, include: mentorInclude }),
    prisma.mentorProfile.count({ where }),
  ]);

  let items = rows.map(serializeMentor);
  if (query.hasCapacity === "true") items = items.filter((m) => m.isActive && !m.atCapacity);
  return paginated(items, items.length === rows.length ? total : items.length, page, pageSize);
}

export async function listAllMentorsForAllocation() {
  const rows = await prisma.mentorProfile.findMany({ orderBy: { fullName: "asc" }, include: mentorInclude });
  for (const row of rows) await ensureMentorGroup(row.id);
  const refreshed = await prisma.mentorProfile.findMany({ orderBy: { fullName: "asc" }, include: mentorInclude });
  return refreshed.map(serializeMentor).filter((mentor) => mentor.mentorGroup?.role === "MAIN");
}

export async function getMentor(id: string) {
  const mentor = await prisma.mentorProfile.findUnique({ where: { id }, include: mentorInclude });
  if (!mentor) throw new AppError(404, "Mentor not found");
  return serializeMentor(mentor);
}

export async function getMentorByUserId(userId: string) {
  const mentor = await prisma.mentorProfile.findUnique({ where: { userId }, include: mentorInclude });
  if (!mentor) throw new AppError(404, "Mentor profile not found");
  return serializeMentor(mentor);
}

export async function createMentor(input: CreateMentorInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const mentor = await prisma.mentorProfile.create({
    data: {
      fullName: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      specialization: input.specialization?.trim() || null,
      minTeams: input.minTeams ?? 4,
      maxTeams: input.maxTeams ?? 6,
      user: { create: { email: input.email.toLowerCase().trim(), passwordHash, role: "MENTOR", isActive: input.isActive ?? true } },
    },
    include: mentorInclude,
  });
  await ensureMentorGroup(mentor.id);
  return getMentor(mentor.id);
}

export async function updateMentor(id: string, input: UpdateMentorInput) {
  const existing = await prisma.mentorProfile.findUnique({ where: { id }, include: { user: true, guidanceAssignments: true } });
  if (!existing) throw new AppError(404, "Mentor not found");
  if (input.email && input.email.toLowerCase() !== existing.user.email) {
    const clash = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (clash) throw new AppError(409, "An account with this email already exists");
  }
  const maxTeams = input.maxTeams ?? existing.maxTeams;
  if (existing.guidanceAssignments.length > maxTeams) {
    throw new AppError(409, `Cannot set max teams to ${maxTeams} because this mentor already has ${existing.guidanceAssignments.length} assigned teams`);
  }
  const passwordHash = input.password ? await bcrypt.hash(input.password, SALT_ROUNDS) : undefined;
  await prisma.mentorProfile.update({
    where: { id },
    data: {
      fullName: input.fullName?.trim(),
      phone: input.phone === undefined ? undefined : input.phone?.trim() || null,
      specialization: input.specialization === undefined ? undefined : input.specialization?.trim() || null,
      minTeams: input.minTeams,
      maxTeams: input.maxTeams,
      user: { update: { email: input.email?.toLowerCase().trim(), isActive: input.isActive, ...(passwordHash ? { passwordHash } : {}) } },
    },
  });
  return getMentor(id);
}

export async function setMentorActive(id: string, isActive: boolean) {
  return updateMentor(id, { isActive });
}

export async function deleteMentor(id: string) {
  const existing = await prisma.mentorProfile.findUnique({
    where: { id },
    include: {
      guidanceAssignments: true,
      user: true,
      mentorGroupMembership: { include: { group: { include: { members: true } } } },
      mainMentorGroup: { include: { members: true, assignments: true } },
    },
  });
  if (!existing) throw new AppError(404, "Mentor not found");
  if (existing.guidanceAssignments.length > 0 || (existing.mainMentorGroup?.assignments?.length ?? 0) > 0) {
    throw new AppError(409, "Cannot delete a mentor with assigned teams. Unassign all teams first, or deactivate the mentor.");
  }
  if (existing.mentorGroupMembership && existing.mentorGroupMembership.group.members.length > 1) {
    throw new AppError(409, "Cannot delete a co-mentor while they are part of a mentor group. Remove them from the group first.");
  }
  if (existing.mainMentorGroup && existing.mainMentorGroup.members.length > 1) {
    throw new AppError(409, "Cannot delete the main mentor while co-mentors are attached. Remove the co-mentors first.");
  }
  await prisma.user.delete({ where: { id: existing.userId } });
  return { deleted: true };
}

export async function getMentorGroup(mentorId: string) {
  const groupId = await ensureMentorGroup(mentorId);
  const group = await prisma.mentorGroup.findUnique({
    where: { id: groupId },
    include: {
      mainMentor: { select: { id: true, fullName: true, phone: true, specialization: true, maxTeams: true, minTeams: true, user: { select: { email: true, isActive: true } } } },
      members: { include: { mentor: { select: { id: true, fullName: true, phone: true, specialization: true, user: { select: { email: true, isActive: true } } } } }, orderBy: { createdAt: "asc" } },
      assignments: { include: { team: { select: { id: true, name: true, teamCode: true } } } },
    },
  });
  if (!group) throw new AppError(404, "Mentor group not found");
  return {
    id: group.id,
    mainMentor: { ...group.mainMentor, role: "MAIN" },
    coMentors: group.members.filter((m) => m.mentorId !== group.mainMentorId).map((m) => ({ ...m.mentor, role: "CO_MENTOR" })),
    members: group.members.map((m) => ({ ...m.mentor, role: m.role })),
    assignedTeamCount: group.assignments.length,
    maxTeams: group.mainMentor.maxTeams,
    availableCapacity: Math.max(0, group.mainMentor.maxTeams - group.assignments.length),
    assignments: group.assignments.map((a) => ({ id: a.id, teamId: a.team.id, teamName: a.team.name, teamCode: a.team.teamCode })),
  };
}

export async function updateMentorGroup(mentorId: string, input: { mainMentorId: string; coMentorIds: string[] }) {
  const requested = Array.from(new Set([input.mainMentorId, ...input.coMentorIds].filter(Boolean)));
  const mentors = await prisma.mentorProfile.findMany({ where: { id: { in: requested } }, include: { user: true } });
  if (mentors.length !== requested.length) throw new AppError(404, "One or more selected mentors do not exist");
  if (mentors.some((m) => !m.user.isActive)) throw new AppError(409, "All selected mentors must be active");

  const currentGroupId = await ensureMentorGroup(mentorId);
  const existingMemberships = await prisma.mentorGroupMember.findMany({
    where: { mentorId: { in: requested } },
    include: { group: { include: { members: true, assignments: true } } },
  });
  const foreignGroups = existingMemberships
    .filter((m: any) => m.groupId !== currentGroupId)
    .map((m: any) => m.group)
    .filter((group: any, index: number, all: any[]) => all.findIndex((item) => item.id === group.id) === index);
  const blockedForeignGroup = foreignGroups.find((group: any) => group.members.length > 1 || group.assignments.length > 0);
  if (blockedForeignGroup) throw new AppError(409, "One or more selected mentors already belongs to another mentor group. Remove that mentor from their current group first.");
  const currentGroup = await prisma.mentorGroup.findUnique({ where: { id: currentGroupId }, include: { members: true, assignments: true } });
  if (!currentGroup) throw new AppError(404, "Mentor group not found");

  const targetMain = mentors.find((m) => m.id === input.mainMentorId)!;
  const assignedCount = currentGroup.members.length ? await prisma.mentorGuidanceAssignment.count({ where: { mentorGroupId: currentGroup.id } }) : 0;
  if (assignedCount > targetMain.maxTeams) {
    throw new AppError(409, `${targetMain.fullName} has a maximum capacity of ${targetMain.maxTeams}, but this group already has ${assignedCount} assigned teams.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    for (const foreignGroup of foreignGroups) {
      await tx.mentorGroup.delete({ where: { id: foreignGroup.id } });
    }
    const group = await tx.mentorGroup.update({ where: { id: currentGroup.id }, data: { mainMentorId: input.mainMentorId } });
    await tx.mentorGroupMember.deleteMany({ where: { groupId: group.id } });
    await tx.mentorGroupMember.createMany({ data: requested.map((id) => ({ groupId: group.id, mentorId: id, role: id === input.mainMentorId ? "MAIN" : "CO_MENTOR" })) });
    await tx.mentorGuidanceAssignment.updateMany({ where: { mentorGroupId: group.id }, data: { mentorId: input.mainMentorId } });
    return group;
  });

  return getMentorGroup(result.mainMentorId);
}

