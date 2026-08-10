import React from "react";
import { GuestRoomExperience } from "@/components/GuestRoomExperience";

export default function GuestPage() {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        minHeight: 560,
        overflow: "hidden",
        backgroundColor: "#f3f0e9",
        color: "#1f2a37",
      }}
    >
      <h1
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Landline
      </h1>

      <section
        aria-label="Hotel room overview"
        style={{ width: "100%", height: "100%" }}
      >
        <GuestRoomExperience />
      </section>
    </main>
  );
}
