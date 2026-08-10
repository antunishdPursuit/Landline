import type { Department } from "@/lib/types";

export type ClassifierResult = {
  requires_human: boolean;
  department: Department | null;
};

const HOUSEKEEPING_KEYWORDS = ["towels", "sheets", "cleaning", "linen"];
const MAINTENANCE_KEYWORDS = [
  "plumbing",
  "ac",
  "electrical",
  "broken",
  "leak",
];
const ROOM_SERVICE_KEYWORDS = [
  "room service",
  "food",
  "drink",
  "meal",
  "breakfast",
];
function departmentFromSummary(summary: string): Department {
  const lower = summary.toLowerCase();

  if (HOUSEKEEPING_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "housekeeping";
  }
  if (MAINTENANCE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "maintenance";
  }
  if (ROOM_SERVICE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "room_service";
  }

  // Current-information concierge questions use the Tavily adapter.
  // Any physical or unsupported work falls back to the staffed front desk.
  return "front_desk";
}

export function classifyRequest(
  intent: string,
  summary: string
): ClassifierResult {
  switch (intent) {
    case "answerable_qa":
      return { requires_human: false, department: null };

    case "defer_to_operator":
      return { requires_human: true, department: "front_desk" };

    case "physical_request":
      return {
        requires_human: false,
        department: departmentFromSummary(summary),
      };

    default:
      throw new Error("Unknown intent");
  }
}
