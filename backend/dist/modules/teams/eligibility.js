"use strict";
// Pure function implementing the team eligibility rules from the spec
// (section 7). Kept separate from the service layer so it's easy to
// unit-test and impossible to bypass by calling the DB directly.
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateTeamEligibility = evaluateTeamEligibility;
const REQUIRED_MEMBERS = 6;
const REQUIRED_DISTINCT_DEPARTMENTS = 3;
function evaluateTeamEligibility(members) {
    const memberCount = members.length;
    const femaleCount = members.filter((m) => m.gender === "FEMALE").length;
    const distinctDepartmentCount = new Set(members.map((m) => m.departmentId)).size;
    const reasons = [];
    if (memberCount !== REQUIRED_MEMBERS) {
        reasons.push(`Team must have exactly ${REQUIRED_MEMBERS} members (currently ${memberCount}).`);
    }
    if (femaleCount < 1) {
        reasons.push("Team must include at least 1 female member.");
    }
    if (distinctDepartmentCount < REQUIRED_DISTINCT_DEPARTMENTS) {
        reasons.push(`Team must span at least ${REQUIRED_DISTINCT_DEPARTMENTS} different departments (currently ${distinctDepartmentCount}).`);
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
