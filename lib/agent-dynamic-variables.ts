import type { AgentConfig } from "@/types/agent";

export function toAgentDynamicVariables(
  config: AgentConfig
): Record<string, string | number | boolean> {
  const propertyName = config.name || "Unnamed property";
  const roomNumber = "1208";

  return {
    property_name: propertyName,
    property_address: config.address || "",
    property_lat: config.lat || "0",
    property_lng: config.lng || "0",
    room_number: roomNumber,
    opening_greeting: `Welcome to ${propertyName}, room ${roomNumber}. How can I help you?`,
  };
}
