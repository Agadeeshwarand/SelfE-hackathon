import { EligibilityResult } from "./eligibility";

type MemberRow = {
  id: string;
  isLeader: boolean;
  joinedAt: Date;
    student: {
    id: string;
    fullName: string;
    registerNumber: string;
    phone: string;
    gender: string;
    departmentId: string;
    department: { name: string };
    user: { email: string };
  };
};

type AssignmentRow = {
  id: string;
  assignedAt: Date;
  mentor: {
    id: string;
    fullName: string;
    specialization: string | null;
    phone: string | null;
    user: { email: string; isActive: boolean };
  };
} | null;

export function serializeTeam(
  team: {
    id: string;
    name: string;
    teamCode: string;
    isEligible: boolean;
    createdAt: Date;
    updatedAt: Date;
    members: MemberRow[];
    guidanceAssignment?: AssignmentRow;
  },
  eligibility: EligibilityResult
) {
  const departments = [...new Set(team.members.map((m) => m.student.department.name))].sort();
  const femaleCount = team.members.filter((m) => m.student.gender === "FEMALE").length;
  const leader = team.members.find((m) => m.isLeader);
  const assignment = team.guidanceAssignment ?? null;

  return {
    id: team.id,
    name: team.name,
    teamCode: team.teamCode,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    status: eligibility.isEligible ? "ELIGIBLE" : team.members.length === 6 ? "INELIGIBLE" : "FORMING",
    isEligible: eligibility.isEligible,
    eligibility: {
      ...eligibility,
      departments,
    },
    memberCount: team.members.length,
    femaleCount,
    departmentCount: departments.length,
    departments,
    genderDistribution: {
      female: femaleCount,
      male: team.members.filter((m) => m.student.gender === "MALE").length,
      other: team.members.filter((m) => m.student.gender === "OTHER").length,
      undisclosed: team.members.filter((m) => m.student.gender === "PREFER_NOT_TO_SAY").length,
    },
    leader: leader
      ? {
          membershipId: leader.id,
          studentId: leader.student.id,
          fullName: leader.student.fullName,
          email: leader.student.user.email,
        }
      : null,
    mentor: assignment
      ? {
          assignmentId: assignment.id,
          id: assignment.mentor.id,
          fullName: assignment.mentor.fullName,
          email: assignment.mentor.user.email,
          specialization: assignment.mentor.specialization,
          phone: assignment.mentor.phone,
          assignedAt: assignment.assignedAt,
        }
      : null,
    members: team.members.map((m) => ({
      id: m.id,
      studentId: m.student.id,
      isLeader: m.isLeader,
      role: m.isLeader ? "TEAM_LEADER" : "TEAM_MEMBER",
      joinedAt: m.joinedAt,
      fullName: m.student.fullName,
      registerNumber: m.student.registerNumber,
      email: m.student.user.email,
      phone: m.student.phone,
      gender: m.student.gender,
      department: m.student.department.name,
    })),
  };
}

export const teamDetailInclude = {
  members: {
    include: { student: { include: { department: true, user: { select: { email: true } } } } },
    orderBy: { joinedAt: "asc" as const },
  },
  guidanceAssignment: {
    include: { mentor: { include: { user: { select: { email: true, isActive: true } } } } },
  },
};
