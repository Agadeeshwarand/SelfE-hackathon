export type Role = "ADMIN" | "MENTOR" | "TEAM_LEADER" | "TEAM_MEMBER";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  studentProfile?: {
    id: string;
    fullName: string;
    registerNumber: string;
    phone: string;
    gender: string;
    year: number;
    college: string;
    department: { name: string };
    teamMembership?: { teamId: string; isLeader: boolean } | null;
  } | null;
  mentorProfile?: {
    id: string;
    fullName: string;
    phone: string | null;
    specialization: string | null;
    maxTeams: number;
    minTeams: number;
  } | null;
}

export interface Eligibility {
  isEligible: boolean;
  memberCount: number;
  requiredMemberCount: number;
  femaleCount: number;
  distinctDepartmentCount: number;
  requiredDistinctDepartments: number;
  reasons: string[];
  departments?: string[];
}

export interface TeamMember {
  id: string;
  studentId: string;
  isLeader: boolean;
  role: string;
  joinedAt: string;
  fullName: string;
  registerNumber: string;
  email: string;
  phone: string;
  gender: string;
  department: string;
}

export interface Team {
  id: string;
  name: string;
  teamCode: string;
  createdAt: string;
  status: string;
  isEligible: boolean;
  eligibility: Eligibility;
  memberCount: number;
  femaleCount: number;
  departmentCount: number;
  departments: string[];
  genderDistribution: { female: number; male: number; other: number; undisclosed: number };
  leader: { membershipId: string; studentId: string; fullName: string; email: string } | null;
  mentor: {
    assignmentId: string;
    id: string;
    fullName: string;
    email: string;
    specialization: string | null;
    assignedAt: string;
  } | null;
  members: TeamMember[];
}

export interface Mentor {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  status: string;
  isActive: boolean;
  minTeams: number;
  maxTeams: number;
  assignedTeamCount: number;
  availableCapacity: number;
  belowRecommended: boolean;
  atCapacity: boolean;
  assignedTeams: { id: string; name: string }[];
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export function homeForRole(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "MENTOR") return "/mentor";
  return "/app";
}
