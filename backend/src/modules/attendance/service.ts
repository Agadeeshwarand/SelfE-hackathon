import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/AppError";

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, "Invalid attendance date");
  }
  return date;
}

function normalizeSessionName(value?: string) {
  return (value?.trim() || "Mentor Guidance Session").slice(0, 100);
}

async function getMentorForUser(userId: string) {
  const mentor = await prisma.mentorProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true } },
      guidanceAssignments: {
        include: {
          team: {
            include: {
              members: {
                include: {
                  student: {
                    include: {
                      user: { select: { email: true } },
                      department: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mentor) {
    throw new AppError(404, "Mentor profile not found");
  }

  return mentor;
}

const db = prisma as any;

function getAssignedStudents(
  mentor: Awaited<ReturnType<typeof getMentorForUser>>
) {
  const students: Array<{
    studentId: string;
    teamId: string;
    teamName: string;
    teamCode: string;
    fullName: string;
    registerNumber: string;
    department: string;
    phone: string;
    email: string;
    isLeader: boolean;
  }> = [];

  for (const assignment of mentor.guidanceAssignments) {
    for (const member of assignment.team.members) {
      students.push({
        studentId: member.student.id,
        teamId: assignment.team.id,
        teamName: assignment.team.name,
        teamCode: assignment.team.teamCode,
        fullName: member.student.fullName,
        registerNumber: member.student.registerNumber,
        department: member.student.department.name,
        phone: member.student.phone,
        email: member.student.user.email,
        isLeader: member.isLeader,
      });
    }
  }

  return students;
}

function serializeSession(session: {
  id: string;
  attendanceDate: Date;
  sessionName: string;
  status: string;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  records?: unknown[];
}) {
  return {
    id: session.id,
    attendanceDate: session.attendanceDate,
    sessionName: session.sessionName,
    status: session.status,
    submittedAt: session.submittedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    recordCount: session.records?.length ?? 0,
  };
}

export async function getMentorAttendance(
  userId: string,
  date: string,
  sessionName?: string
) {
  const mentor = await getMentorForUser(userId);
  const attendanceDate = parseDate(date);
  const normalizedName = normalizeSessionName(sessionName);
  const assignedStudents = getAssignedStudents(mentor);

  const session = await db.attendanceSession.findUnique({
    where: {
      mentorId_attendanceDate_sessionName: {
        mentorId: mentor.id,
        attendanceDate,
        sessionName: normalizedName,
      },
    },
    include: { records: true },
  });

  const statusMap = new Map(
    (session?.records ?? []).map((record: any) => [
      record.studentId,
      record.status,
    ])
  );

  const teams = mentor.guidanceAssignments.map((assignment) => {
    const members = assignedStudents.filter(
      (student) => student.teamId === assignment.team.id
    );

    const present = members.filter(
      (student) => statusMap.get(student.studentId) === "PRESENT"
    ).length;

    const absent = members.filter(
      (student) => statusMap.get(student.studentId) === "ABSENT"
    ).length;

    return {
      id: assignment.team.id,
      name: assignment.team.name,
      teamCode: assignment.team.teamCode,
      members: members.map((student) => ({
        ...student,
        status: statusMap.get(student.studentId) ?? null,
      })),
      present,
      absent,
      unmarked: members.length - present - absent,
    };
  });

  const allMembers = teams.flatMap((team) => team.members);

  return {
    mentor: {
      id: mentor.id,
      fullName: mentor.fullName,
      email: mentor.user.email,
      assignedTeamCount: mentor.guidanceAssignments.length,
    },
    session: session ? serializeSession(session) : null,
    attendanceDate: date,
    sessionName: normalizedName,
    teams,
    summary: {
      total: allMembers.length,
      present: allMembers.filter((member) => member.status === "PRESENT").length,
      absent: allMembers.filter((member) => member.status === "ABSENT").length,
      unmarked: allMembers.filter((member) => !member.status).length,
    },
  };
}

export async function saveMentorAttendance(
  userId: string,
  input: {
    date: string;
    sessionName: string;
    records: {
      studentId: string;
      teamId: string;
      status: "PRESENT" | "ABSENT";
    }[];
  }
) {
  const mentor = await getMentorForUser(userId);
  const attendanceDate = parseDate(input.date);
  const sessionName = normalizeSessionName(input.sessionName);
  const assignedStudents = getAssignedStudents(mentor);

  const allowedStudents = new Map(
    assignedStudents.map((student) => [student.studentId, student.teamId])
  );

  for (const record of input.records) {
    const allowedTeam = allowedStudents.get(record.studentId);
    if (!allowedTeam || allowedTeam !== record.teamId) {
      throw new AppError(
        403,
        "You can only mark attendance for students in your assigned teams"
      );
    }
  }

  const session = await db.attendanceSession.upsert({
    where: {
      mentorId_attendanceDate_sessionName: {
        mentorId: mentor.id,
        attendanceDate,
        sessionName,
      },
    },
    create: {
      mentorId: mentor.id,
      attendanceDate,
      sessionName,
    },
    update: {},
  });

  if (session.status === "SUBMITTED") {
    throw new AppError(
      409,
      "This attendance session has already been submitted and is locked"
    );
  }

  await db.$transaction(
    input.records.map((record) =>
      db.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: record.studentId,
          },
        },
        create: {
          sessionId: session.id,
          studentId: record.studentId,
          teamId: record.teamId,
          status: record.status,
        },
        update: {
          teamId: record.teamId,
          status: record.status,
          markedAt: new Date(),
        },
      })
    )
  );

  return getMentorAttendance(userId, input.date, sessionName);
}

export async function submitMentorAttendance(
  userId: string,
  sessionId: string
) {
  const mentor = await getMentorForUser(userId);

  const session = await db.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { records: true },
  });

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  if (session.mentorId !== mentor.id) {
    throw new AppError(
      403,
      "You do not have access to this attendance session"
    );
  }

  if (session.status === "SUBMITTED") {
    return serializeSession(session);
  }

  const assignedStudents = getAssignedStudents(mentor);
  const recordedStudents = new Set(
    session.records.map((record: any) => record.studentId)
  );

  const missing = assignedStudents.filter(
    (student) => !recordedStudents.has(student.studentId)
  );

  if (missing.length > 0) {
    throw new AppError(
      400,
      `Mark attendance for all assigned students before submitting. ${missing.length} student(s) are still unmarked.`
    );
  }

  const updated = await db.attendanceSession.update({
    where: { id: session.id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    include: { records: true },
  });

  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      isActive: true,
    },
    select: { id: true },
  });

  if (admins.length) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        message: `${mentor.fullName} submitted attendance for ${session.attendanceDate.toISOString().slice(0, 10)} (${session.sessionName}).`,
      })),
    });
  }

  return serializeSession(updated);
}

export async function listAdminAttendance(query: {
  date?: string;
  mentorId?: string;
  status?: "DRAFT" | "SUBMITTED";
}) {
  const where: any = {};

  if (query.date) {
    where.attendanceDate = parseDate(query.date);
  }

  if (query.mentorId) {
    where.mentorId = query.mentorId;
  }

  if (query.status) {
    where.status = query.status;
  }

  const sessions = await db.attendanceSession.findMany({
    where,
    orderBy: [
      { attendanceDate: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      mentor: {
        select: {
          id: true,
          fullName: true,
        },
      },
      records: {
        include: {
          student: {
            include: {
              department: true,
              user: { select: { email: true } },
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              teamCode: true,
            },
          },
        },
        orderBy: [
          { team: { name: "asc" } },
          { student: { fullName: "asc" } },
        ],
      },
    },
  });

  return sessions.map((session: any) => {
    const present = session.records.filter(
      (record: any) => record.status === "PRESENT"
    ).length;

    const absent = session.records.filter(
      (record: any) => record.status === "ABSENT"
    ).length;

    return {
      ...serializeSession(session),
      mentor: session.mentor,
      summary: {
        total: session.records.length,
        present,
        absent,
      },
      records: session.records.map((record: any) => ({
        id: record.id,
        studentId: record.studentId,
        status: record.status,
        markedAt: record.markedAt,
        student: {
          fullName: record.student.fullName,
          registerNumber: record.student.registerNumber,
          department: record.student.department.name,
          email: record.student.user.email,
          phone: record.student.phone,
        },
        team: record.team,
      })),
    };
  });
}

export async function getAdminAttendanceSession(id: string) {
  const sessions = await listAdminAttendance({});
  const session = sessions.find((item: any) => item.id === id);

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  return session;
}
