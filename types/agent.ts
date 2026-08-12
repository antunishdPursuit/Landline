export interface AgentConfig {
  name: string;
  address: string;
  lat: string;
  lng: string;
}

export const EMPTY_CONFIG: AgentConfig = {
  name: "",
  address: "",
  lat: "",
  lng: "",
};

export const RITZ_NOMAD_CONFIG: AgentConfig = {
  name: "The Ritz-Carlton New York, NoMad",
  address: "25 West 28th Street, New York, NY 10001",
  lat: "40.745556",
  lng: "-73.98942",
};
