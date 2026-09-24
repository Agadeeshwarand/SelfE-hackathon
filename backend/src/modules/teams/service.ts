import { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/AppError";
import { evaluateTeamEligibility } from "./eligibility";
import { CreateTeamInput } from "./validation";
import {
  serializeTeam,
  teamDetailInclude,
} from "./presenter";
import {
  paginated,
  parsePagination,
} from "../../utils/pagination";
import { isPrismaUniqueViolation } from "../../utils/prismaErrors";

const MAX_TEAM_SIZE = 6;

function generateTeamCode(): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code +=
      alphabet[
        Math.floor(
          Math.random() * alphabet.length
        )
      ];
  }

  return code;
}

async function getOwnStudentProfileOrThrow(
  userId: string
) {
  const profile =
    await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        teamMembership: true,
      },
    });

  if (!profile) {
    throw new AppError(
      403,
      "Only registered students can perform this action"
    );
  }

  return profile;
}

async function assertStudentHasNoTeam(
  studentId: string
) {
  const existing =
    await prisma.teamMember.findUnique({
      where: { studentId },
    });

  if (existing) {
    throw new AppError(
      409,
      "You already belong to a team"
    );
  }
}

function withEligibility(team: {
  id: string;
  name: string;
  teamCode: string;
  isEligible: boolean;
  createdAt: Date;
  updatedAt: Date;
  members: Parameters<
    typeof serializeTeam
  >[0]["members"];
  guidanceAssignment?: Parameters<
    typeof serializeTeam
  >[0]["guidanceAssignment"];
}) {
  const eligibility =
    evaluateTeamEligibility(
      team.members.map((m) => ({
        gender:
          m.student.gender as
            | "MALE"
            | "FEMALE"
            | "OTHER"
            | "PREFER_NOT_TO_SAY",

        departmentId:
          m.student.departmentId,
      }))
    );

  return serializeTeam(
    team,
    eligibility
  );
}

export async function createTeam(
  userId: string,
  input: CreateTeamInput
) {
  const student =
    await getOwnStudentProfileOrThrow(
      userId
    );

  await assertStudentHasNoTeam(
    student.id
  );

  for (let attempt = 0; attempt < 5; attempt++) {
    const teamCode =
      generateTeamCode();

    try {
      const teamId =
        await prisma.$transaction(
          async (tx) => {
            const member =
              await tx.teamMember.create({
                data: {
                  isLeader: true,

                  student: {
                    connect: {
                      id: student.id,
                    },
                  },

                  team: {
                    create: {
                      name:
                        input.name.trim(),
                      teamCode,
                    },
                  },
                },
              });

            await tx.team.update({
              where: {
                id: member.teamId,
              },

              data: {
                leaderId:
                  member.id,
              },
            });

            await tx.user.update({
              where: {
                id: userId,
              },

              data: {
                role: "TEAM_LEADER",
              },
            });

            return member.teamId;
          }
        );

      return getTeamWithEligibility(
        teamId
      );
    } catch (err: unknown) {
      if (
        !isPrismaUniqueViolation(err)
      ) {
        throw err;
      }
    }
  }

  throw new AppError(
    500,
    "Could not generate a unique team code, please try again"
  );
}

export async function joinTeam(
  userId: string,
  teamCode: string
) {
  const student =
    await getOwnStudentProfileOrThrow(
      userId
    );

  await assertStudentHasNoTeam(
    student.id
  );

  const team =
    await prisma.team.findUnique({
      where: {
        teamCode:
          teamCode.trim().toUpperCase(),
      },

      include: {
        members: true,
      },
    });

  if (!team) {
    throw new AppError(
      404,
      "No team found with that code"
    );
  }

  if (
    team.members.length >=
    MAX_TEAM_SIZE
  ) {
    throw new AppError(
      409,
      `Team is already full (${MAX_TEAM_SIZE}/${MAX_TEAM_SIZE})`
    );
  }

  try {
    await prisma.teamMember.create({
      data: {
        student: {
          connect: {
            id: student.id,
          },
        },

        team: {
          connect: {
            id: team.id,
          },
        },
      },
    });
  } catch (err: unknown) {
    if (
      isPrismaUniqueViolation(err)
    ) {
      throw new AppError(
        409,
        "You already belong to a team"
      );
    }

    throw err;
  }

  return recalculateAndPersistEligibility(
    team.id
  );
}

export async function getTeamWithEligibility(
  teamId: string
) {
  return recalculateAndPersistEligibility(
    teamId
  );
}

export async function getMyTeam(
  userId: string
) {
  const student =
    await getOwnStudentProfileOrThrow(
      userId
    );

  if (!student.teamMembership) {
    return null;
  }

  return getTeamWithEligibility(
    student.teamMembership.teamId
  );
}

export async function getTeamById(
  teamId: string,
  actor: {
    userId: string;
    role: string;
  }
) {
  const team =
    await prisma.team.findUnique({
      where: {
        id: teamId,
      },

      include:
        teamDetailInclude,
    });

  if (!team) {
    throw new AppError(
      404,
      "Team not found"
    );
  }

  if (actor.role === "ADMIN") {
    return withEligibility(team);
  }

  if (actor.role === "MENTOR") {
    const mentor =
      await prisma.mentorProfile.findUnique({
        where: {
          userId: actor.userId,
        },
      });

    if (
      !mentor ||
      team.guidanceAssignment
        ?.mentorId !== mentor.id
    ) {
      throw new AppError(
        403,
        "You do not have access to this team"
      );
    }

    return withEligibility(team);
  }

  const student =
    await prisma.studentProfile.findUnique({
      where: {
        userId: actor.userId,
      },

      include: {
        teamMembership: true,
      },
    });

  if (
    !student?.teamMembership ||
    student.teamMembership.teamId !==
      teamId
  ) {
    throw new AppError(
      403,
      "You do not have access to this team"
    );
  }

  return withEligibility(team);
}

export async function listTeams(
  query: Record<string, unknown>
) {
  const {
    page,
    pageSize,
    skip,
    take,
  } = parsePagination(query);

  const where =
    buildTeamWhere(query);

  const sort = String(
    query.sort ?? "createdAt"
  );

  const dir =
    String(query.dir ?? "desc") ===
    "asc"
      ? "asc"
      : "desc";

  const orderBy:
    Prisma.TeamOrderByWithRelationInput =
      sort === "name"
        ? { name: dir }
        : sort === "updatedAt"
        ? { updatedAt: dir }
        : { createdAt: dir };

  const [rows, total] =
    await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take,
        orderBy,
        include:
          teamDetailInclude,
      }),

      prisma.team.count({
        where,
      }),
    ]);

  return paginated(
    rows.map((row) =>
      withEligibility(row)
    ),
    total,
    page,
    pageSize
  );
}

export function buildTeamWhere(
  query: Record<string, unknown>
): Prisma.TeamWhereInput {
  const where: Prisma.TeamWhereInput =
    {};

  const search =
    typeof query.search === "string"
      ? query.search.trim()
      : "";

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },

      {
        teamCode: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (
    query.eligible === "true" ||
    query.eligible === true
  ) {
    where.isEligible = true;
  }

  if (
    query.eligible === "false" ||
    query.eligible === false
  ) {
    where.isEligible = false;
  }

  const mentorAssigned =
    query.mentorAssigned ??
    query.assigned;

  if (
    mentorAssigned === "true" ||
    mentorAssigned === true
  ) {
    where.guidanceAssignment = {
      isNot: null,
    };
  }

  if (
    mentorAssigned === "false" ||
    mentorAssigned === false
  ) {
    where.guidanceAssignment = {
      is: null,
    };
  }

  const department =
    typeof query.department ===
    "string"
      ? query.department.trim()
      : "";

  if (department) {
    where.members = {
      some: {
        student: {
          department: {
            name: department,
          },
        },
      },
    };
  }

  const mentorId =
    typeof query.mentorId ===
    "string"
      ? query.mentorId.trim()
      : "";

  if (mentorId) {
    where.guidanceAssignment = {
      mentorId,
    };
  }

  return where;
}

export async function removeMember(
  actor: {
    userId: string;
    role: string;
  },
  teamId: string,
  studentId: string
) {
  const team =
    await prisma.team.findUnique({
      where: {
        id: teamId,
      },

      include: {
        members: true,
      },
    });

  if (!team) {
    throw new AppError(
      404,
      "Team not found"
    );
  }

  const target =
    team.members.find(
      (m) =>
        m.studentId === studentId
    );

  if (!target) {
    throw new AppError(
      404,
      "Student is not a member of this team"
    );
  }

  const actorStudent =
    await prisma.studentProfile.findUnique({
      where: {
        userId: actor.userId,
      },
    });

  const actorMembership =
    team.members.find(
      (m) =>
        m.studentId ===
        actorStudent?.id
    );

  const isAdmin =
    actor.role === "ADMIN";

  const isLeader =
    Boolean(
      actorMembership?.isLeader
    );

  const isSelf =
    actorStudent?.id ===
    studentId;

  if (
    !isAdmin &&
    !isLeader &&
    !isSelf
  ) {
    throw new AppError(
      403,
      "You cannot modify this team's membership"
    );
  }

  if (
    target.isLeader &&
    team.members.length > 1
  ) {
    throw new AppError(
      409,
      "Change the team leader before removing the current leader"
    );
  }

  const targetStudent =
    await prisma.studentProfile.findUnique({
      where: {
        id: studentId,
      },
    });

  await prisma.$transaction(
    async (tx) => {
      if (
        team.members.length === 1
      ) {
        await tx.mentorGuidanceAssignment.deleteMany(
          {
            where: {
              teamId,
            },
          }
        );

        await tx.team.delete({
          where: {
            id: teamId,
          },
        });
      } else {
        await tx.teamMember.delete({
          where: {
            id: target.id,
          },
        });
      }

      if (
        target.isLeader &&
        targetStudent
      ) {
        await tx.user.update({
          where: {
            id: targetStudent.userId,
          },

          data: {
            role: "TEAM_MEMBER",
          },
        });
      }
    }
  );

  if (
    team.members.length === 1
  ) {
    return {
      deleted: true,
    };
  }

  return recalculateAndPersistEligibility(
    teamId
  );
}

export async function updateTeam(
  teamId: string,
  input: {
    name?: unknown;
    leaderStudentId?: unknown;
  }
) {
  const team =
    await prisma.team.findUnique({
      where: {
        id: teamId,
      },

      include: {
        members: true,
      },
    });

  if (!team) {
    throw new AppError(
      404,
      "Team not found"
    );
  }

  const name =
    input.name === undefined
      ? undefined
      : String(input.name).trim();

  if (
    name !== undefined &&
    (name.length < 2 ||
      name.length > 80)
  ) {
    throw new AppError(
      400,
      "Team name must be between 2 and 80 characters"
    );
  }

  const leaderStudentId =
    input.leaderStudentId ===
      undefined ||
    input.leaderStudentId === null
      ? undefined
      : String(
          input.leaderStudentId
        );

  if (
    leaderStudentId !== undefined
  ) {
    const newLeader =
      team.members.find(
        (m) =>
          m.studentId ===
          leaderStudentId
      );

    if (!newLeader) {
      throw new AppError(
        400,
        "The selected leader must be a member of this team"
      );
    }
  }

  await prisma.$transaction(
    async (tx) => {
      if (name !== undefined) {
        await tx.team.update({
          where: {
            id: teamId,
          },

          data: {
            name,
          },
        });
      }

      if (
        leaderStudentId !==
        undefined
      ) {
        const currentLeader =
          team.members.find(
            (m) => m.isLeader
          );

        const newLeader =
          team.members.find(
            (m) =>
              m.studentId ===
              leaderStudentId
          )!;

        if (
          currentLeader?.id !==
          newLeader.id
        ) {
          await tx.teamMember.updateMany(
            {
              where: {
                teamId,
              },

              data: {
                isLeader: false,
              },
            }
          );

          await tx.teamMember.update({
            where: {
              id: newLeader.id,
            },

            data: {
              isLeader: true,
            },
          });

          await tx.team.update({
            where: {
              id: teamId,
            },

            data: {
              leaderId:
                newLeader.id,
            },
          });

          if (currentLeader) {
            const oldLeader =
              await tx.studentProfile.findUniqueOrThrow(
                {
                  where: {
                    id: currentLeader.studentId,
                  },
                }
              );

            await tx.user.update({
              where: {
                id: oldLeader.userId,
              },

              data: {
                role: "TEAM_MEMBER",
              },
            });
          }

          const newLeaderStudent =
            await tx.studentProfile.findUniqueOrThrow(
              {
                where: {
                  id: newLeader.studentId,
                },
              }
            );

          await tx.user.update({
            where: {
              id: newLeaderStudent.userId,
            },

            data: {
              role: "TEAM_LEADER",
            },
          });
        }
      }
    }
  );

  return recalculateAndPersistEligibility(
    teamId
  );
}

export async function addMember(
  teamId: string,
  input: {
    studentId?: unknown;
    registerNumber?: unknown;
  }
) {
  const team =
    await prisma.team.findUnique({
      where: {
        id: teamId,
      },

      include: {
        members: true,
      },
    });

  if (!team) {
    throw new AppError(
      404,
      "Team not found"
    );
  }

  if (
    team.members.length >=
    MAX_TEAM_SIZE
  ) {
    throw new AppError(
      409,
      `Team is already full (${MAX_TEAM_SIZE}/${MAX_TEAM_SIZE})`
    );
  }

  const studentId =
    typeof input.studentId ===
    "string"
      ? input.studentId.trim()
      : "";

  const registerNumber =
    typeof input.registerNumber ===
    "string"
      ? input.registerNumber.trim()
      : "";

  const student = studentId
    ? await prisma.studentProfile.findUnique(
        {
          where: {
            id: studentId,
          },
        }
      )
    : registerNumber
    ? await prisma.studentProfile.findUnique(
        {
          where: {
            registerNumber,
          },
        }
      )
    : null;

  if (!student) {
    throw new AppError(
      404,
      "Registered student not found"
    );
  }

  const existingMembership =
    await prisma.teamMember.findUnique(
      {
        where: {
          studentId:
            student.id,
        },
      }
    );

  if (existingMembership) {
    throw new AppError(
      409,
      "This student already belongs to a team"
    );
  }

  await prisma.teamMember.create({
    data: {
      studentId: student.id,
      teamId,
      isLeader: false,
    },
  });

  return recalculateAndPersistEligibility(
    teamId
  );
}

async function recalculateAndPersistEligibility(
  teamId: string
) {
  const team =
    await prisma.team.findUnique({
      where: {
        id: teamId,
      },

      include:
        teamDetailInclude,
    });

  if (!team) {
    throw new AppError(
      404,
      "Team not found"
    );
  }

  const eligibility =
    evaluateTeamEligibility(
      team.members.map((m) => ({
        gender: m.student.gender,
        departmentId:
          m.student.departmentId,
      }))
    );

  await prisma.team.update({
    where: {
      id: teamId,
    },

    data: {
      isEligible:
        eligibility.isEligible,

      eligibilityDetails:
        eligibility as unknown as object,
    },
  });

  return serializeTeam(
    team,
    eligibility
  );
}