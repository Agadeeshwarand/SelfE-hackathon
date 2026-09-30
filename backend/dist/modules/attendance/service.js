"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMentorAttendance = getMentorAttendance;
exports.saveMentorAttendance = saveMentorAttendance;
exports.submitMentorAttendance = submitMentorAttendance;
exports.listAdminAttendance = listAdminAttendance;
exports.getAdminAttendanceSession = getAdminAttendanceSession;
const prisma_1 = require("../../utils/prisma");
const AppError_1 = require("../../utils/AppError");
const db = prisma_1.prisma;
function parseDate(value) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()))
        throw new AppError_1.AppError(400, "Invalid attendance date");
    return date;
}
function normalizeSessionName(value) {
    return (value?.trim() || "Mentor Guidance Session").slice(0, 100);
}
async function getMentorContext(userId) {
    const mentor = await db.mentorProfile.findUnique({
        where: { userId },
        include: {
            user: { select: { email: true, isActive: true } },
            mainMentorGroup: {
                include: {
                    mainMentor: { select: { id: true, fullName: true, user: { select: { email: true } } } },
                    members: {
                        include: {
                            mentor: {
                                select: {
                                    id: true, fullName: true, phone: true, specialization: true,
                                    user: { select: { email: true, isActive: true } },
                                },
                            },
                        },
                    },
                    assignments: {
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
            },
            mentorGroupMembership: {
                include: {
                    group: {
                        include: {
                            mainMentor: { select: { id: true, fullName: true, user: { select: { email: true } } } },
                            members: {
                                include: {
                                    mentor: {
                                        select: {
                                            id: true, fullName: true, phone: true, specialization: true,
                                            user: { select: { email: true, isActive: true } },
                                        },
                                    },
                                },
                            },
                            assignments: {
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
                    },
                },
            },
        },
    });
    if (!mentor)
        throw new AppError_1.AppError(404, "Mentor profile not found");
    if (!mentor.user.isActive)
        throw new AppError_1.AppError(403, "Your mentor account is inactive");
    const group = mentor.mainMentorGroup ?? mentor.mentorGroupMembership?.group;
    if (!group)
        throw new AppError_1.AppError(409, "You are not part of a mentor group yet");
    return { mentor, group };
}
function getAssignedStudents(group) {
    const students = [];
    for (const assignment of group.assignments) {
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
function serializeSession(session) {
    return {
        id: session.id,
        attendanceDate: session.attendanceDate,
        sessionName: session.sessionName,
        status: session.status,
        submittedAt: session.submittedAt,
        submittedByMentor: session.submittedByMentor
            ? { id: session.submittedByMentor.id, fullName: session.submittedByMentor.fullName }
            : null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        recordCount: session.records?.length ?? 0,
    };
}
async function findSession(groupId, mainMentorId, attendanceDate, sessionName) {
    const grouped = await db.attendanceSession.findFirst({
        where: { mentorGroupId: groupId, attendanceDate, sessionName },
        include: { records: true, submittedByMentor: { select: { id: true, fullName: true } } },
    });
    if (grouped)
        return grouped;
    return db.attendanceSession.findUnique({
        where: { mentorId_attendanceDate_sessionName: { mentorId: mainMentorId, attendanceDate, sessionName } },
        include: { records: true, submittedByMentor: { select: { id: true, fullName: true } } },
    });
}
async function getMentorAttendance(userId, date, sessionName) {
    const { mentor, group } = await getMentorContext(userId);
    const attendanceDate = parseDate(date);
    const normalizedName = normalizeSessionName(sessionName);
    const assignedStudents = getAssignedStudents(group);
    const session = await findSession(group.id, group.mainMentorId, attendanceDate, normalizedName);
    const statusMap = new Map((session?.records ?? []).map((record) => [record.studentId, record.status]));
    const teams = group.assignments.map((assignment) => {
        const members = assignedStudents.filter((student) => student.teamId === assignment.team.id);
        const present = members.filter((student) => statusMap.get(student.studentId) === "PRESENT").length;
        const absent = members.filter((student) => statusMap.get(student.studentId) === "ABSENT").length;
        return {
            id: assignment.team.id,
            name: assignment.team.name,
            teamCode: assignment.team.teamCode,
            members: members.map((student) => ({ ...student, status: statusMap.get(student.studentId) ?? null })),
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
            groupRole: mentor.id === group.mainMentorId ? "MAIN" : "CO_MENTOR",
            mainMentor: group.mainMentor,
            coMentors: group.members.filter((m) => m.mentorId !== group.mainMentorId).map((m) => m.mentor),
            assignedTeamCount: group.assignments.length,
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
async function saveMentorAttendance(userId, input) {
    const { mentor, group } = await getMentorContext(userId);
    const attendanceDate = parseDate(input.date);
    const sessionName = normalizeSessionName(input.sessionName);
    const assignedStudents = getAssignedStudents(group);
    const allowedStudents = new Map(assignedStudents.map((student) => [student.studentId, student.teamId]));
    for (const record of input.records) {
        if (allowedStudents.get(record.studentId) !== record.teamId) {
            throw new AppError_1.AppError(403, "You can only mark attendance for students in your mentor group's assigned teams");
        }
    }
    let session = await findSession(group.id, group.mainMentorId, attendanceDate, sessionName);
    if (!session) {
        session = await db.attendanceSession.create({
            data: { mentorId: group.mainMentorId, mentorGroupId: group.id, attendanceDate, sessionName },
            include: { records: true, submittedByMentor: { select: { id: true, fullName: true } } },
        });
    }
    if (session.status === "SUBMITTED")
        throw new AppError_1.AppError(409, "This attendance session has already been submitted and is locked");
    await db.$transaction(input.records.map((record) => db.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId: session.id, studentId: record.studentId } },
        create: { sessionId: session.id, studentId: record.studentId, teamId: record.teamId, status: record.status },
        update: { teamId: record.teamId, status: record.status, markedAt: new Date() },
    })));
    return getMentorAttendance(userId, input.date, sessionName);
}
async function submitMentorAttendance(userId, sessionId) {
    const { mentor, group } = await getMentorContext(userId);
    const session = await db.attendanceSession.findUnique({
        where: { id: sessionId },
        include: { records: true, submittedByMentor: { select: { id: true, fullName: true } } },
    });
    if (!session)
        throw new AppError_1.AppError(404, "Attendance session not found");
    if (session.mentorGroupId !== group.id)
        throw new AppError_1.AppError(403, "You do not have access to this attendance session");
    if (session.status === "SUBMITTED")
        return serializeSession(session);
    const assignedStudents = getAssignedStudents(group);
    const recordedStudents = new Set(session.records.map((record) => record.studentId));
    const missing = assignedStudents.filter((student) => !recordedStudents.has(student.studentId));
    if (missing.length > 0)
        throw new AppError_1.AppError(400, `Mark attendance for all assigned students before submitting. ${missing.length} student(s) are still unmarked.`);
    const updated = await db.attendanceSession.update({
        where: { id: session.id },
        data: { status: "SUBMITTED", submittedAt: new Date(), submittedByMentorId: mentor.id },
        include: { records: true, submittedByMentor: { select: { id: true, fullName: true } } },
    });
    const admins = await prisma_1.prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
    if (admins.length) {
        await prisma_1.prisma.notification.createMany({
            data: admins.map((admin) => ({
                userId: admin.id,
                message: `${mentor.fullName} submitted attendance for ${session.attendanceDate.toISOString().slice(0, 10)} (${session.sessionName}).`,
            })),
        });
    }
    return serializeSession(updated);
}
async function listAdminAttendance(query) {
    const where = {};
    if (query.date)
        where.attendanceDate = parseDate(query.date);
    if (query.status)
        where.status = query.status;
    if (query.mentorId) {
        const mentor = await prisma_1.prisma.mentorProfile.findUnique({ where: { id: query.mentorId }, include: { mainMentorGroup: true, mentorGroupMembership: true } });
        const groupId = mentor?.mainMentorGroup?.id ?? mentor?.mentorGroupMembership?.groupId;
        if (groupId)
            where.mentorGroupId = groupId;
        else
            where.mentorId = query.mentorId;
    }
    const sessions = await db.attendanceSession.findMany({
        where,
        orderBy: [{ attendanceDate: "desc" }, { createdAt: "desc" }],
        include: {
            mentor: { select: { id: true, fullName: true } },
            mentorGroup: { include: { mainMentor: { select: { id: true, fullName: true } }, members: { include: { mentor: { select: { id: true, fullName: true } } } } } },
            submittedByMentor: { select: { id: true, fullName: true } },
            records: {
                include: {
                    student: { include: { department: true, user: { select: { email: true } } } },
                    team: { select: { id: true, name: true, teamCode: true } },
                },
                orderBy: [{ team: { name: "asc" } }, { student: { fullName: "asc" } }],
            },
        },
    });
    return sessions.map((session) => {
        const present = session.records.filter((record) => record.status === "PRESENT").length;
        const absent = session.records.filter((record) => record.status === "ABSENT").length;
        return {
            ...serializeSession(session),
            mentor: session.mentorGroup?.mainMentor ?? session.mentor,
            mentorGroup: session.mentorGroup ? {
                id: session.mentorGroup.id,
                mainMentor: session.mentorGroup.mainMentor,
                coMentors: session.mentorGroup.members.filter((m) => m.mentorId !== session.mentorGroup.mainMentor.id).map((m) => m.mentor),
            } : null,
            summary: { total: session.records.length, present, absent },
            records: session.records.map((record) => ({
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
async function getAdminAttendanceSession(id) {
    const sessions = await listAdminAttendance({});
    const session = sessions.find((item) => item.id === id);
    if (!session)
        throw new AppError_1.AppError(404, "Attendance session not found");
    return session;
}
