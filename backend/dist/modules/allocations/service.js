"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignTeams = assignTeams;
exports.unassign = unassign;
exports.unassignTeam = unassignTeam;
exports.listAssignments = listAssignments;
exports.getMentorDashboard = getMentorDashboard;
const prisma_1 = require("../../utils/prisma");
const AppError_1 = require("../../utils/AppError");
const service_1 = require("../teams/service");
const service_2 = require("../mentors/service");
async function resolveMentorGroup(mentorId) {
    const mentor = await prisma_1.prisma.mentorProfile.findUnique({
        where: { id: mentorId },
        include: {
            user: true,
            mentorGroupMembership: true,
            mainMentorGroup: {
                include: {
                    members: true,
                },
            },
        },
    });
    if (!mentor) {
        throw new AppError_1.AppError(404, "Mentor not found");
    }
    if (!mentor.user.isActive) {
        throw new AppError_1.AppError(409, "Cannot assign teams to an inactive mentor");
    }
    let group = mentor.mainMentorGroup;
    if (!group && mentor.mentorGroupMembership) {
        group = await prisma_1.prisma.mentorGroup.findUnique({
            where: {
                id: mentor.mentorGroupMembership.groupId,
            },
            include: {
                members: true,
            },
        });
    }
    if (!group) {
        group = await prisma_1.prisma.mentorGroup.create({
            data: {
                mainMentorId: mentor.id,
                members: {
                    create: {
                        mentorId: mentor.id,
                        role: "MAIN",
                    },
                },
            },
            include: {
                members: true,
            },
        });
    }
    const mainMentor = await prisma_1.prisma.mentorProfile.findUnique({
        where: {
            id: group.mainMentorId,
        },
        include: {
            user: true,
        },
    });
    if (!mainMentor) {
        throw new AppError_1.AppError(404, "Main mentor not found");
    }
    if (!mainMentor.user.isActive) {
        throw new AppError_1.AppError(409, "The main mentor account is inactive");
    }
    return {
        group,
        mainMentor,
    };
}
async function assignTeams(mentorId, teamIds, reassign = false) {
    const uniqueTeamIds = [
        ...new Set(teamIds.filter(Boolean)),
    ];
    if (uniqueTeamIds.length === 0) {
        throw new AppError_1.AppError(400, "Select at least one team to assign");
    }
    const { group, mainMentor, } = await resolveMentorGroup(mentorId);
    const teams = await prisma_1.prisma.team.findMany({
        where: {
            id: {
                in: uniqueTeamIds,
            },
        },
        include: {
            guidanceAssignment: true,
            members: true,
        },
    });
    if (teams.length !==
        uniqueTeamIds.length) {
        throw new AppError_1.AppError(404, "One or more selected teams do not exist");
    }
    for (const team of teams) {
        if (!team.isEligible) {
            throw new AppError_1.AppError(409, `Team "${team.name}" is not eligible and cannot be assigned a mentor`);
        }
        if (team.guidanceAssignment
            ?.mentorGroupId === group.id) {
            throw new AppError_1.AppError(409, `Team "${team.name}" is already assigned to this mentor group`);
        }
        if (team.guidanceAssignment &&
            team.guidanceAssignment
                .mentorGroupId !== group.id &&
            !reassign) {
            throw new AppError_1.AppError(409, `Team "${team.name}" already has a mentor. Confirm reassignment to continue.`);
        }
    }
    const groupAssignments = await prisma_1.prisma.mentorGuidanceAssignment.count({
        where: {
            mentorGroupId: group.id,
        },
    });
    if (groupAssignments +
        uniqueTeamIds.length >
        mainMentor.maxTeams) {
        throw new AppError_1.AppError(409, `Maximum team allocation reached for ${mainMentor.fullName}'s mentor group.`);
    }
    const results = await prisma_1.prisma.$transaction(async (tx) => {
        const created = [];
        for (const team of teams) {
            if (team.guidanceAssignment &&
                team.guidanceAssignment
                    .mentorGroupId !== group.id) {
                await tx.mentorGuidanceAssignment.delete({
                    where: {
                        id: team.guidanceAssignment.id,
                    },
                });
            }
            const existing = await tx.mentorGuidanceAssignment.findUnique({
                where: {
                    teamId: team.id,
                },
            });
            if (existing) {
                const updated = await tx.mentorGuidanceAssignment.update({
                    where: {
                        id: existing.id,
                    },
                    data: {
                        mentorId: mainMentor.id,
                        mentorGroupId: group.id,
                    },
                });
                created.push(updated);
            }
            else {
                const row = await tx.mentorGuidanceAssignment.create({
                    data: {
                        mentorId: mainMentor.id,
                        mentorGroupId: group.id,
                        teamId: team.id,
                    },
                });
                created.push(row);
            }
        }
        return created;
    });
    const updated = await prisma_1.prisma.mentorProfile.findUniqueOrThrow({
        where: {
            id: mainMentor.id,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    isActive: true,
                    createdAt: true,
                    role: true,
                },
            },
            guidanceAssignments: {
                include: {
                    team: {
                        select: {
                            id: true,
                            name: true,
                            isEligible: true,
                            teamCode: true,
                        },
                    },
                },
                orderBy: {
                    assignedAt: "desc",
                },
            },
            mainMentorGroup: {
                include: {
                    mainMentor: {
                        select: {
                            id: true,
                            fullName: true,
                            user: {
                                select: {
                                    email: true,
                                },
                            },
                        },
                    },
                    members: {
                        include: {
                            mentor: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    user: {
                                        select: {
                                            email: true,
                                            isActive: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    assignments: {
                        include: {
                            team: {
                                select: {
                                    id: true,
                                    name: true,
                                    isEligible: true,
                                    teamCode: true,
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
                            mainMentor: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                            members: {
                                include: {
                                    mentor: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                            user: {
                                                select: {
                                                    email: true,
                                                    isActive: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            assignments: {
                                include: {
                                    team: {
                                        select: {
                                            id: true,
                                            name: true,
                                            isEligible: true,
                                            teamCode: true,
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
    return {
        mentor: (0, service_2.serializeMentor)(updated),
        assignedCount: results.length,
    };
}
async function unassign(assignmentId) {
    const existing = await prisma_1.prisma.mentorGuidanceAssignment.findUnique({
        where: {
            id: assignmentId,
        },
    });
    if (!existing) {
        throw new AppError_1.AppError(404, "Assignment not found");
    }
    await prisma_1.prisma.mentorGuidanceAssignment.delete({
        where: {
            id: assignmentId,
        },
    });
    return {
        deleted: true,
    };
}
async function unassignTeam(teamId) {
    const existing = await prisma_1.prisma.mentorGuidanceAssignment.findUnique({
        where: {
            teamId,
        },
    });
    if (!existing) {
        throw new AppError_1.AppError(404, "This team does not have a mentor assigned");
    }
    await prisma_1.prisma.mentorGuidanceAssignment.delete({
        where: {
            id: existing.id,
        },
    });
    return {
        deleted: true,
    };
}
async function listAssignments() {
    const rows = await prisma_1.prisma.mentorGuidanceAssignment.findMany({
        include: {
            mentor: {
                include: {
                    user: {
                        select: {
                            email: true,
                        },
                    },
                },
            },
            mentorGroup: {
                include: {
                    mainMentor: {
                        select: {
                            id: true,
                            fullName: true,
                            user: {
                                select: {
                                    email: true,
                                },
                            },
                        },
                    },
                    members: {
                        include: {
                            mentor: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            team: {
                include: {
                    members: true,
                },
            },
        },
        orderBy: {
            assignedAt: "desc",
        },
    });
    return rows.map((row) => ({
        id: row.id,
        assignedAt: row.assignedAt,
        mentor: {
            id: row.mentor.id,
            fullName: row.mentorGroup
                ?.mainMentor
                ?.fullName ??
                row.mentor.fullName,
            email: row.mentorGroup
                ?.mainMentor
                ?.user?.email ??
                row.mentor.user.email,
        },
        mentorGroup: row.mentorGroup
            ? {
                id: row.mentorGroup.id,
                mainMentor: row.mentorGroup
                    .mainMentor,
                coMentors: row.mentorGroup.members
                    .filter((member) => member.mentorId !==
                    row.mentorGroup
                        .mainMentorId)
                    .map((member) => member.mentor),
            }
            : null,
        team: {
            id: row.team.id,
            name: row.team.name,
            teamCode: row.team.teamCode,
            isEligible: row.team.isEligible,
            memberCount: row.team.members.length,
        },
    }));
}
async function getMentorDashboard(userId) {
    const mentor = await prisma_1.prisma.mentorProfile.findUnique({
        where: {
            userId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    isActive: true,
                    createdAt: true,
                    role: true,
                },
            },
            mainMentorGroup: {
                include: {
                    mainMentor: {
                        select: {
                            id: true,
                            fullName: true,
                            user: {
                                select: {
                                    email: true,
                                },
                            },
                        },
                    },
                    members: {
                        include: {
                            mentor: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    phone: true,
                                    specialization: true,
                                    user: {
                                        select: {
                                            email: true,
                                            isActive: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    assignments: {
                        include: {
                            team: {
                                select: {
                                    id: true,
                                    name: true,
                                    isEligible: true,
                                },
                            },
                        },
                        orderBy: {
                            assignedAt: "desc",
                        },
                    },
                },
            },
            mentorGroupMembership: {
                include: {
                    group: {
                        include: {
                            mainMentor: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                            members: {
                                include: {
                                    mentor: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                            phone: true,
                                            specialization: true,
                                            user: {
                                                select: {
                                                    email: true,
                                                    isActive: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            assignments: {
                                include: {
                                    team: {
                                        select: {
                                            id: true,
                                            name: true,
                                            isEligible: true,
                                        },
                                    },
                                },
                                orderBy: {
                                    assignedAt: "desc",
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!mentor) {
        throw new AppError_1.AppError(404, "Mentor profile not found");
    }
    const group = mentor.mainMentorGroup ??
        mentor.mentorGroupMembership
            ?.group;
    if (!group) {
        const teams = [];
        return {
            mentor: (0, service_2.serializeMentor)(mentor),
            teams,
        };
    }
    const teams = [];
    for (const assignment of group.assignments) {
        teams.push(await (0, service_1.getTeamWithEligibility)(assignment.team.id));
    }
    return {
        mentor: (0, service_2.serializeMentor)(mentor),
        teams,
    };
}
