import { Prisma, Gender } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/AppError";
import { paginated, parsePagination } from "../../utils/pagination";
import { isPrismaUniqueViolation } from "../../utils/prismaErrors";

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
    user: {
      id: string;
      email: string;
      isActive: boolean;
      createdAt: Date;
      role: string;
    };
    teamMembership: {
      isLeader: boolean;
      joinedAt: Date;
      team: {
        id: string;
        name: string;
        isEligible: boolean;
      };
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
    isActive: student.user.isActive,

    team: student.teamMembership
      ? {
          id: student.teamMembership.team.id,
          name: student.teamMembership.team.name,
          isEligible: student.teamMembership.team.isEligible,
          role: student.teamMembership.isLeader
            ? "TEAM_LEADER"
            : "TEAM_MEMBER",
          joinedAt: student.teamMembership.joinedAt,
        }
      : null,

    createdAt: student.createdAt,
    registrationDate: student.user.createdAt,
  };
}

const studentInclude = {
  department: true,

  user: {
    select: {
      id: true,
      email: true,
      isActive: true,
      createdAt: true,
      role: true,
    },
  },

  teamMembership: {
    include: {
      team: {
        select: {
          id: true,
          name: true,
          isEligible: true,
        },
      },
    },
  },
};

export async function listStudents(
  query: Record<string, unknown>
) {
  const {
    page,
    pageSize,
    skip,
    take,
  } = parsePagination(query);

  const where: Prisma.StudentProfileWhereInput = {};

  const search =
    typeof query.search === "string"
      ? query.search.trim()
      : "";

  if (search) {
    where.OR = [
      {
        fullName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        registerNumber: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        user: {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const department =
    typeof query.department === "string"
      ? query.department.trim()
      : "";

  if (department) {
    where.department = {
      name: department,
    };
  }

  if (query.hasTeam === "true") {
    where.teamMembership = {
      isNot: null,
    };
  }

  if (query.hasTeam === "false") {
    where.teamMembership = {
      is: null,
    };
  }

  const [rows, total] = await Promise.all([
    prisma.studentProfile.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: studentInclude,
    }),

    prisma.studentProfile.count({
      where,
    }),
  ]);

  return paginated(
    rows.map(serializeStudent),
    total,
    page,
    pageSize
  );
}

export async function getStudent(id: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: studentInclude,
  });

  if (!student) {
    throw new AppError(404, "Student not found");
  }

  return serializeStudent(student);
}

export async function updateStudent(
  id: string,
  input: Record<string, unknown>
) {
  const existing = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      teamMembership: true,
    },
  });

  if (!existing) {
    throw new AppError(404, "Student not found");
  }

  const fullName =
    typeof input.fullName === "string"
      ? input.fullName.trim()
      : existing.fullName;

  const registerNumber =
    typeof input.registerNumber === "string"
      ? input.registerNumber.trim()
      : existing.registerNumber;

  const email =
    typeof input.email === "string"
      ? input.email.trim().toLowerCase()
      : undefined;

  const phone =
    typeof input.phone === "string"
      ? input.phone.trim()
      : existing.phone;

  const college =
    typeof input.college === "string"
      ? input.college.trim()
      : existing.college;

  const year =
    input.year === undefined
      ? existing.year
      : Number(input.year);

  const gender =
    input.gender === undefined
      ? existing.gender
      : String(input.gender);

  const departmentName =
    typeof input.department === "string"
      ? input.department.trim()
      : "";

  const isActive =
    input.isActive === undefined
      ? undefined
      : Boolean(input.isActive);

  if (fullName.length < 2 || fullName.length > 120) {
    throw new AppError(
      400,
      "Name must be between 2 and 120 characters"
    );
  }

  if (
    registerNumber.length < 2 ||
    registerNumber.length > 40
  ) {
    throw new AppError(
      400,
      "Register number must be between 2 and 40 characters"
    );
  }

  if (phone.length < 7 || phone.length > 20) {
    throw new AppError(
      400,
      "Phone number must be between 7 and 20 characters"
    );
  }

  if (college.length < 2 || college.length > 160) {
    throw new AppError(
      400,
      "College name must be between 2 and 160 characters"
    );
  }

  if (
    !Number.isInteger(year) ||
    year < 1 ||
    year > 6
  ) {
    throw new AppError(
      400,
      "Year must be between 1 and 6"
    );
  }

  if (
    ![
      "MALE",
      "FEMALE",
      "OTHER",
      "PREFER_NOT_TO_SAY",
    ].includes(gender)
  ) {
    throw new AppError(400, "Invalid gender");
  }

  if (
    email !== undefined &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new AppError(
      400,
      "Invalid email address"
    );
  }

  try {
    const department = departmentName
      ? await prisma.department.upsert({
          where: {
            name: departmentName,
          },
          update: {},
          create: {
            name: departmentName,
          },
        })
      : await prisma.department.findUniqueOrThrow({
          where: {
            id: existing.departmentId,
          },
        });

    const updated =
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: {
            id: existing.userId,
          },
          data: {
            ...(email !== undefined
              ? { email }
              : {}),

            ...(isActive !== undefined
              ? { isActive }
              : {}),
          },
        });

        return tx.studentProfile.update({
          where: {
            id,
          },

          data: {
            fullName,
            registerNumber,
            phone,
            gender: gender as Gender,
            year,
            college,
            departmentId: department.id,
          },

          include: studentInclude,
        });
      });

    return serializeStudent(updated);
  } catch (err) {
    if (isPrismaUniqueViolation(err)) {
      throw new AppError(
        409,
        "Email or register number is already in use"
      );
    }

    throw err;
  }
}

export async function getMyStudentProfile(
  userId: string
) {
  const student =
    await prisma.studentProfile.findUnique({
      where: { userId },
      include: studentInclude,
    });

  if (!student) {
    throw new AppError(
      404,
      "Student profile not found"
    );
  }

  return serializeStudent(student);
}

export async function updateMyStudentProfile(
  userId: string,
  input: { fullName: string }
) {
  const fullName = input.fullName.trim();

  if (
    fullName.length < 2 ||
    fullName.length > 120
  ) {
    throw new AppError(
      400,
      "Name must be between 2 and 120 characters"
    );
  }

  const student =
    await prisma.studentProfile.update({
      where: { userId },
      data: { fullName },
      include: studentInclude,
    });

  return serializeStudent(student);
}