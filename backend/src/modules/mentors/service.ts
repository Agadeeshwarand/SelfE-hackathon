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
      team: { select: { id: true, name: true, isEligible: true } },
    },
    orderBy: { assignedAt: "desc" as const },
  },
};

export function serializeMentor(
  mentor: {
    id: string;
    fullName: string;
    phone: string | null;
    specialization: string | null;
    maxTeams: number;
    minTeams: number;
    createdAt: Date;
    user: { id: string; email: string; isActive: boolean; createdAt: Date };
    guidanceAssignments: { id: string; assignedAt: Date; team: { id: string; name: string; isEligible: boolean } }[];
  }
) {
  const assignedTeamCount = mentor.guidanceAssignments.length;
  const availableCapacity = Math.max(0, mentor.maxTeams - assignedTeamCount);
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
    maxTeams: mentor.maxTeams,
    assignedTeamCount,
    availableCapacity,
    atCapacity: assignedTeamCount >= mentor.maxTeams,
    belowRecommended: assignedTeamCount < mentor.minTeams,
    assignedTeams: mentor.guidanceAssignments.map((a) => ({
      assignmentId: a.id,
      teamId: a.team.id,
      teamName: a.team.name,
      isEligible: a.team.isEligible,
      assignedAt: a.assignedAt,
    })),
    createdAt: mentor.createdAt,
  };
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
    prisma.mentorProfile.findMany({
      where,
      skip,
      take,
      orderBy: { fullName: "asc" },
      include: mentorInclude,
    }),
    prisma.mentorProfile.count({ where }),
  ]);

  let items = rows.map(serializeMentor);
  if (query.hasCapacity === "true") {
    items = items.filter((m) => m.isActive && !m.atCapacity);
  }
  return paginated(items, items.length === rows.length ? total : items.length, page, pageSize);
}

export async function listAllMentorsForAllocation() {
  const rows = await prisma.mentorProfile.findMany({
    orderBy: { fullName: "asc" },
    include: mentorInclude,
  });
  return rows.map(serializeMentor);
}

export async function getMentor(id: string) {
  const mentor = await prisma.mentorProfile.findUnique({
    where: { id },
    include: mentorInclude,
  });
  if (!mentor) throw new AppError(404, "Mentor not found");
  return serializeMentor(mentor);
}

export async function getMentorByUserId(userId: string) {
  const mentor = await prisma.mentorProfile.findUnique({
    where: { userId },
    include: mentorInclude,
  });
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
      user: {
        create: {
          email: input.email.toLowerCase().trim(),
          passwordHash,
          role: "MENTOR",
          isActive: input.isActive ?? true,
        },
      },
    },
    include: mentorInclude,
  });
  return serializeMentor(mentor);
}

export async function updateMentor(id: string, input: UpdateMentorInput) {
  const existing = await prisma.mentorProfile.findUnique({
    where: { id },
    include: { user: true, guidanceAssignments: true },
  });
  if (!existing) throw new AppError(404, "Mentor not found");

  if (input.email && input.email.toLowerCase() !== existing.user.email) {
    const clash = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (clash) throw new AppError(409, "An account with this email already exists");
  }

  const maxTeams = input.maxTeams ?? existing.maxTeams;
  if (existing.guidanceAssignments.length > maxTeams) {
    throw new AppError(
      409,
      `Cannot set max teams to ${maxTeams} because this mentor already has ${existing.guidanceAssignments.length} assigned teams`
    );
  }

  const passwordHash = input.password ? await bcrypt.hash(input.password, SALT_ROUNDS) : undefined;

  const mentor = await prisma.mentorProfile.update({
    where: { id },
    data: {
      fullName: input.fullName?.trim(),
      phone: input.phone === undefined ? undefined : input.phone?.trim() || null,
      specialization: input.specialization === undefined ? undefined : input.specialization?.trim() || null,
      minTeams: input.minTeams,
      maxTeams: input.maxTeams,
      user: {
        update: {
          email: input.email?.toLowerCase().trim(),
          isActive: input.isActive,
          ...(passwordHash ? { passwordHash } : {}),
        },
      },
    },
    include: mentorInclude,
  });
  return serializeMentor(mentor);
}

export async function setMentorActive(id: string, isActive: boolean) {
  return updateMentor(id, { isActive });
}

export async function deleteMentor(id: string) {
  const existing = await prisma.mentorProfile.findUnique({
    where: { id },
    include: { guidanceAssignments: true, user: true },
  });
  if (!existing) throw new AppError(404, "Mentor not found");
  if (existing.guidanceAssignments.length > 0) {
    throw new AppError(
      409,
      "Cannot delete a mentor with assigned teams. Unassign all teams first, or deactivate the mentor."
    );
  }
  await prisma.user.delete({ where: { id: existing.userId } });
  return { deleted: true };
}
