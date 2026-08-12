import type { Department } from "@/lib/types";

export type ClassifierResult = {
  requires_human: boolean;
  department: Department | null;
};

const HOUSEKEEPING_KEYWORDS = [
  "towel",
  "towels",
  "pillow",
  "pillows",
  "blanket",
  "blankets",
  "sheet",
  "sheets",
  "linen",
  "linens",
  "toiletry",
  "toiletries",
  "soap",
  "shampoo",
  "conditioner",
  "toilet paper",
  "tissue",
  "tissues",
  "cleaning",
  "clean my room",
  "housekeeping",
  "trash",
  "garbage",
  "robe",
  "robes",
  "slippers",
];
const MAINTENANCE_PRIORITY_KEYWORDS = ["air conditioning", "air conditioner"];
const MAINTENANCE_KEYWORDS = [
  "plumbing",
  "ac",
  "a c",
  "air conditioning",
  "air conditioner",
  "heating",
  "heater",
  "electrical",
  "outlet",
  "outlets",
  "sink",
  "toilet",
  "shower",
  "bathtub",
  "faucet",
  "light",
  "lights",
  "lamp",
  "television",
  "tv",
  "wifi",
  "wi fi",
  "internet",
  "thermostat",
  "elevator",
  "safe",
  "broken",
  "leak",
  "leaking",
  "clogged",
];
const ROOM_SERVICE_KEYWORDS = [
  "room service",
  "food",
  "drink",
  "drinks",
  "meal",
  "meals",
  "breakfast",
  "lunch",
  "dinner",
  "ice",
  "minibar",
  "tray",
  "trays",
  "coffee",
  "tea",
  "snack",
  "snacks",
];

function normalizeForMatching(value: string): string {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}

function containsKeyword(summary: string, keywords: string[]): boolean {
  const normalizedSummary = normalizeForMatching(summary);

  return keywords.some((keyword) =>
    normalizedSummary.includes(normalizeForMatching(keyword))
  );
}

function departmentFromSummary(summary: string): Department {
  if (containsKeyword(summary, MAINTENANCE_PRIORITY_KEYWORDS)) {
    return "maintenance";
  }
  if (containsKeyword(summary, HOUSEKEEPING_KEYWORDS)) {
    return "housekeeping";
  }
  if (containsKeyword(summary, MAINTENANCE_KEYWORDS)) {
    return "maintenance";
  }
  if (containsKeyword(summary, ROOM_SERVICE_KEYWORDS)) {
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
