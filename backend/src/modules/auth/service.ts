import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/prisma";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { RegisterInput, LoginInput } from "./validation";

const SALT_ROUNDS = 12;

export async function registerStudent(input: RegisterInput) {
  const [existingEmail, existingRegNo] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email } }),
    prisma.studentProfile.findUnique({ where: { registerNumber: input.registerNumber } }),
  ]);

  if (existingEmail) {
    throw new AppError(409, "An account with this email already exists");
  }
  if (existingRegNo) {
    throw new AppError(409, "This register number is already registered");
  }

  const department = await prisma.department.upsert({
    where: { name: input.department },
    update: {},
    create: { name: input.department },
  });

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: "TEAM_MEMBER",
      studentProfile: {
        create: {
          fullName: input.fullName,
          registerNumber: input.registerNumber,
          phone: input.phone,
          gender: input.gender,
          year: input.year,
          college: input.college,
          departmentId: department.id,
        },
      },
    },
  });

  return toAuthResult(user.id);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.isActive) {
    throw new AppError(401, "Invalid email or password");
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }
  return toAuthResult(user.id);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      studentProfile: {
        include: { department: true, teamMembership: { select: { teamId: true, isLeader: true } } },
      },
      mentorProfile: { select: { id: true, fullName: true, phone: true, specialization: true, maxTeams: true, minTeams: true } },
    },
  });
  if (!user) throw new AppError(404, "User not found");
  return user;
}

async function toAuthResult(userId: string) {
  const user = await getMe(userId);
  const token = jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
  return { token, user };
}
