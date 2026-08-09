export interface AgentConfig {
  name: string;
  address: string;
  lat: string;
  lng: string;
  thumbnailUrl: string;
}

export const EMPTY_CONFIG: AgentConfig = {
  name: "",
  address: "",
  lat: "",
  lng: "",
  thumbnailUrl: "",
};
