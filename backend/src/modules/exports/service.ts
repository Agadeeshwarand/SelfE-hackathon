import ExcelJS from "exceljs";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/AppError";
import { buildTeamWhere } from "../teams/service";
import { Prisma } from "@prisma/client";

export type ExportFormat = "xlsx" | "csv";

function parseFormat(value: unknown): ExportFormat {
  const format = String(value ?? "xlsx").toLowerCase();
  if (format === "csv" || format === "xlsx") return format;
  throw new AppError(400, "Format must be xlsx or csv");
}

function teamWhereFromQuery(query: Record<string, unknown>): Prisma.TeamWhereInput {
  return buildTeamWhere(query);
}

function studentWhereFromQuery(query: Record<string, unknown>): Prisma.StudentProfileWhereInput {
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
  return where;
}

function mentorWhereFromQuery(query: Record<string, unknown>): Prisma.MentorProfileWhereInput {
  const where: Prisma.MentorProfileWhereInput = {};
  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  const mentorId = typeof query.mentorId === "string" ? query.mentorId.trim() : "";
  if (mentorId) where.id = mentorId;
  if (query.status === "ACTIVE") where.user = { isActive: true };
  if (query.status === "INACTIVE") where.user = { isActive: false };
  return where;
}

async function buildWorkbook(sheetName: string, columns: { header: string; key: string; width: number }[], rows: Record<string, unknown>[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Hackathon Management Platform";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF111827" },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
  return workbook;
}

function toCsv(columns: { header: string; key: string }[], rows: Record<string, unknown>[]) {
  const escape = (value: unknown) => {
    const str = value == null ? "" : String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(","));
  return [header, ...body].join("\n");
}

export async function studentsExport(query: Record<string, unknown>) {
  const format = parseFormat(query.format);
  const students = await prisma.studentProfile.findMany({
    where: studentWhereFromQuery(query),
    orderBy: { createdAt: "desc" },
    include: {
      department: true,
      user: true,
      teamMembership: { include: { team: true } },
    },
  });

  const columns = [
    { header: "Student ID", key: "studentId", width: 18 },
    { header: "Name", key: "name", width: 24 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Gender", key: "gender", width: 14 },
    { header: "Department", key: "department", width: 16 },
    { header: "Team Name", key: "teamName", width: 22 },
    { header: "Team Role", key: "teamRole", width: 16 },
    { header: "Registration Date", key: "registrationDate", width: 22 },
  ];

  const rows = students.map((s) => ({
    studentId: s.registerNumber,
    name: s.fullName,
    email: s.user.email,
    phone: s.phone,
    gender: s.gender,
    department: s.department.name,
    teamName: s.teamMembership?.team.name ?? "",
    teamRole: s.teamMembership ? (s.teamMembership.isLeader ? "TEAM_LEADER" : "TEAM_MEMBER") : "",
    registrationDate: s.user.createdAt.toISOString(),
  }));

  return fileResult("Hackathon_Students", "Students", columns, rows, format);
}

export async function teamsExport(query: Record<string, unknown>) {
  const format = parseFormat(query.format);
  const teams = await prisma.team.findMany({
    where: teamWhereFromQuery(query),
    orderBy: { createdAt: "desc" },
    include: {
      members: { include: { student: { include: { department: true } } } },
      guidanceAssignment: { include: { mentor: true } },
    },
  });

  const columns = [
    { header: "Team ID", key: "teamId", width: 26 },
    { header: "Team Name", key: "teamName", width: 24 },
    { header: "Team Leader", key: "leader", width: 24 },
    { header: "Member Count", key: "memberCount", width: 16 },
    { header: "Female Count", key: "femaleCount", width: 16 },
    { header: "Department Count", key: "departmentCount", width: 18 },
    { header: "Departments", key: "departments", width: 28 },
    { header: "Eligibility", key: "eligibility", width: 14 },
    { header: "Mentor", key: "mentor", width: 24 },
    { header: "Created At", key: "createdAt", width: 22 },
  ];

  const rows = teams.map((t) => {
    const departments = [...new Set(t.members.map((m) => m.student.department.name))].sort();
    const leader = t.members.find((m) => m.isLeader);
    return {
      teamId: t.id,
      teamName: t.name,
      leader: leader?.student.fullName ?? "",
      memberCount: t.members.length,
      femaleCount: t.members.filter((m) => m.student.gender === "FEMALE").length,
      departmentCount: departments.length,
      departments: departments.join(", "),
      eligibility: t.isEligible ? "ELIGIBLE" : "NOT ELIGIBLE",
      mentor: t.guidanceAssignment?.mentor.fullName ?? "",
      createdAt: t.createdAt.toISOString(),
    };
  });

  return fileResult("Hackathon_Teams", "Teams", columns, rows, format);
}

export async function teamMembersExport(query: Record<string, unknown>) {
  const format = parseFormat(query.format);
  const members = await prisma.teamMember.findMany({
    where: { team: teamWhereFromQuery(query) },
    orderBy: [{ team: { name: "asc" } }, { isLeader: "desc" }, { joinedAt: "asc" }],
    include: {
      team: {
        include: {
          members: { include: { student: true } },
        },
      },
      student: { include: { department: true, user: true } },
    },
  });

  const columns = [
    { header: "Team Name", key: "teamName", width: 24 },
    { header: "Team Leader", key: "leader", width: 24 },
    { header: "Student Name", key: "studentName", width: 24 },
    { header: "Student ID", key: "studentId", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Gender", key: "gender", width: 14 },
    { header: "Department", key: "department", width: 16 },
    { header: "Role", key: "role", width: 16 },
  ];

  const rows = members.map((m) => {
    const leader = m.team.members.find((x) => x.isLeader);
    return {
      teamName: m.team.name,
      leader: leader?.student.fullName ?? "",
      studentName: m.student.fullName,
      studentId: m.student.registerNumber,
      email: m.student.user.email,
      gender: m.student.gender,
      department: m.student.department.name,
      role: m.isLeader ? "TEAM_LEADER" : "TEAM_MEMBER",
    };
  });

  return fileResult("Hackathon_Team_Members", "Team Members", columns, rows, format);
}

export async function mentorAllocationExport(query: Record<string, unknown>) {
  const format = parseFormat(query.format);
  const assignmentWhere: Prisma.MentorGuidanceAssignmentWhereInput = {};
  const mentorId = typeof query.mentorId === "string" ? query.mentorId.trim() : "";
  if (mentorId) assignmentWhere.mentorId = mentorId;
  const teamWhere = teamWhereFromQuery(query);
  if (Object.keys(teamWhere).length) assignmentWhere.team = teamWhere;

  const rowsDb = await prisma.mentorGuidanceAssignment.findMany({
    where: assignmentWhere,
    orderBy: { assignedAt: "desc" },
    include: {
      mentor: { include: { user: true } },
      team: { include: { members: { include: { student: true } } } },
    },
  });

  const columns = [
    { header: "Mentor Name", key: "mentorName", width: 24 },
    { header: "Mentor Email", key: "mentorEmail", width: 28 },
    { header: "Team Name", key: "teamName", width: 24 },
    { header: "Team Leader", key: "leader", width: 24 },
    { header: "Member Count", key: "memberCount", width: 16 },
    { header: "Team Eligibility", key: "eligibility", width: 16 },
    { header: "Assignment Date", key: "assignedAt", width: 22 },
  ];

  const rows = rowsDb.map((a) => ({
    mentorName: a.mentor.fullName,
    mentorEmail: a.mentor.user.email,
    teamName: a.team.name,
    leader: a.team.members.find((m) => m.isLeader)?.student.fullName ?? "",
    memberCount: a.team.members.length,
    eligibility: a.team.isEligible ? "ELIGIBLE" : "NOT ELIGIBLE",
    assignedAt: a.assignedAt.toISOString(),
  }));

  return fileResult("Hackathon_Mentor_Allocation", "Mentor Allocation", columns, rows, format);
}

export async function mentorSummaryExport(query: Record<string, unknown>) {
  const format = parseFormat(query.format);
  const mentors = await prisma.mentorProfile.findMany({
    where: mentorWhereFromQuery(query),
    orderBy: { fullName: "asc" },
    include: {
      user: true,
      guidanceAssignments: { include: { team: true } },
    },
  });

  const columns = [
    { header: "Mentor Name", key: "mentorName", width: 24 },
    { header: "Mentor Email", key: "mentorEmail", width: 28 },
    { header: "Assigned Team Count", key: "assignedCount", width: 20 },
    { header: "Available Capacity", key: "availableCapacity", width: 20 },
    { header: "Assigned Teams", key: "assignedTeams", width: 40 },
  ];

  const rows = mentors.map((m) => ({
    mentorName: m.fullName,
    mentorEmail: m.user.email,
    assignedCount: m.guidanceAssignments.length,
    availableCapacity: Math.max(0, m.maxTeams - m.guidanceAssignments.length),
    assignedTeams: m.guidanceAssignments.map((a) => a.team.name).join(", "),
  }));

  return fileResult("Hackathon_Mentor_Summary", "Mentor Summary", columns, rows, format);
}

async function fileResult(
  filename: string,
  sheetName: string,
  columns: { header: string; key: string; width: number }[],
  rows: Record<string, unknown>[],
  format: ExportFormat
) {
  if (format === "csv") {
    return {
      filename: `${filename}.csv`,
      contentType: "text/csv; charset=utf-8",
      buffer: Buffer.from(toCsv(columns, rows), "utf8"),
    };
  }
  const workbook = await buildWorkbook(sheetName, columns, rows);
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    filename: `${filename}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  };
}

export const exporters = {
  students: studentsExport,
  teams: teamsExport,
  "team-members": teamMembersExport,
  "mentor-allocation": mentorAllocationExport,
  "mentor-summary": mentorSummaryExport,
} as const;
