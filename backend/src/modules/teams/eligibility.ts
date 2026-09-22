// Pure function implementing the team eligibility rules from the spec
// (section 7). Kept separate from the service layer so it's easy to
// unit-test and impossible to bypass by calling the DB directly.

export interface MemberForEligibility {
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  departmentId: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  memberCount: number;
  requiredMemberCount: number;
  femaleCount: number;
  distinctDepartmentCount: number;
  requiredDistinctDepartments: number;
  reasons: string[];
}

const REQUIRED_MEMBERS = 6;
const REQUIRED_DISTINCT_DEPARTMENTS = 3;

export function evaluateTeamEligibility(members: MemberForEligibility[]): EligibilityResult {
  const memberCount = members.length;
  const femaleCount = members.filter((m) => m.gender === "FEMALE").length;
  const distinctDepartmentCount = new Set(members.map((m) => m.departmentId)).size;

  const reasons: string[] = [];
  if (memberCount !== REQUIRED_MEMBERS) {
    reasons.push(
      `Team must have exactly ${REQUIRED_MEMBERS} members (currently ${memberCount}).`
    );
  }
  if (femaleCount < 1) {
    reasons.push("Team must include at least 1 female member.");
  }
  if (distinctDepartmentCount < REQUIRED_DISTINCT_DEPARTMENTS) {
    reasons.push(
      `Team must span at least ${REQUIRED_DISTINCT_DEPARTMENTS} different departments (currently ${distinctDepartmentCount}).`
    );
  }

  return {
    isEligible: reasons.length === 0,
    memberCount,
    requiredMemberCount: REQUIRED_MEMBERS,
    femaleCount,
    distinctDepartmentCount,
    requiredDistinctDepartments: REQUIRED_DISTINCT_DEPARTMENTS,
    reasons,
  };
}
