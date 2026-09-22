import { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/AppError";
import { paginated, parsePagination } from "../../utils/pagination";

export function serializeStudent(
  student: {
    id: string;
    fullName: string;
    registerNumber: string;
    phone: string;
    gender: string;
    year: number;
    college: string;
    createdAt: Date;
    department: { name: string };
    user: { id: string; email: string; isActive: boolean; createdAt: Date; role: string };
    teamMembership: {
      isLeader: boolean;
      joinedAt: Date;
      team: { id: string; name: string; isEligible: boolean };
    } | null;
  }
) {
  return {
    id: student.id,
    studentId: student.registerNumber,
    fullName: student.fullName,
    email: student.user.email,
    phone: student.phone,
    gender: student.gender,
    department: student.department.name,
    year: student.year,
    college: student.college,
    role: student.user.role,
    team: student.teamMembership
      ? {
          id: student.teamMembership.team.id,
          name: student.teamMembership.team.name,
          isEligible: student.teamMembership.team.isEligible,
          role: student.teamMembership.isLeader ? "TEAM_LEADER" : "TEAM_MEMBER",
          joinedAt: student.teamMembership.joinedAt,
        }
      : null,
    createdAt: student.createdAt,
    registrationDate: student.user.createdAt,
  };
}

const studentInclude = {
  department: true,
  user: { select: { id: true, email: true, isActive: true, createdAt: true, role: true } },
  teamMembership: { include: { team: { select: { id: true, name: true, isEligible: true } } } },
};

export async function listStudents(query: Record<string, unknown>) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const where: Prisma.StudentProfileWhereInput = {};
  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { registerNumber: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  const department = typeof query.department === "string" ? query.department.trim() : "";
  if (department) where.department = { name: department };
  if (query.hasTeam === "true") where.teamMembership = { isNot: null };
  if (query.hasTeam === "false") where.teamMembership = { is: null };

  const [rows, total] = await Promise.all([
    prisma.studentProfile.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: studentInclude,
    }),
    prisma.studentProfile.count({ where }),
  ]);

  return paginated(rows.map(serializeStudent), total, page, pageSize);
}

export async function getStudent(id: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: studentInclude,
  });
  if (!student) throw new AppError(404, "Student not found");
  return serializeStudent(student);
}

export async function getMyStudentProfile(userId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: studentInclude,
  });
  if (!student) throw new AppError(404, "Student profile not found");
  return serializeStudent(student);
}


export async function updateMyStudentProfile(userId: string, input: { fullName: string }) {
  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 120) throw new AppError(400, "Name must be between 2 and 120 characters");
  const student = await prisma.studentProfile.update({
    where: { userId },
    data: { fullName },
    include: studentInclude,
  });
  return serializeStudent(student);
}
