import type { AgentConfig } from "@/types/agent";

export function toAgentDynamicVariables(
  config: AgentConfig
): Record<string, string | number | boolean> {
  return {
    property_name: config.name || "Unnamed property",
    property_address: config.address || "",
    property_lat: config.lat || "0",
    property_lng: config.lng || "0",
    room_number: "1208",
  };
}
