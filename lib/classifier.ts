type Department =
  | "front_desk"
  | "housekeeping"
  | "maintenance"
  | "food_beverage"
  | "concierge";

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
const FOOD_BEVERAGE_KEYWORDS = [
  "room service",
  "food",
  "drink",
  "meal",
  "breakfast",
];
const CONCIERGE_KEYWORDS = [
  "directions",
  "recommendation",
  "booking",
  "concierge",
];

function departmentFromSummary(summary: string): Department {
  const lower = summary.toLowerCase();

  if (HOUSEKEEPING_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "housekeeping";
  }
  if (MAINTENANCE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "maintenance";
  }
  if (FOOD_BEVERAGE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "food_beverage";
  }
  if (CONCIERGE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "concierge";
  }
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
