import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Explicit cleanup keeps DOM state isolated without global test APIs.
afterEach(() => cleanup());
