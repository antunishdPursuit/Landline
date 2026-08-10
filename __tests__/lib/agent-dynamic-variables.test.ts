import { toAgentDynamicVariables } from "@/lib/agent-dynamic-variables";
import { EMPTY_CONFIG, RITZ_NOMAD_CONFIG } from "@/types/agent";

describe("toAgentDynamicVariables", () => {
  it("maps the selected property and demo room into voice context", () => {
    expect(toAgentDynamicVariables(RITZ_NOMAD_CONFIG)).toEqual({
      property_name: RITZ_NOMAD_CONFIG.name,
      property_address: RITZ_NOMAD_CONFIG.address,
      property_lat: RITZ_NOMAD_CONFIG.lat,
      property_lng: RITZ_NOMAD_CONFIG.lng,
      room_number: "1208",
    });
  });

  it("uses safe defaults for an empty property", () => {
    expect(toAgentDynamicVariables(EMPTY_CONFIG)).toEqual({
      property_name: "Unnamed property",
      property_address: "",
      property_lat: "0",
      property_lng: "0",
      room_number: "1208",
    });
  });
});
