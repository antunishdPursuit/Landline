import React from "react";
import { HotelRoomOverview } from "@/components/HotelRoomOverview";

export default function GuestPage() {
  return (
    <main className="relative h-[100dvh] min-h-[560px] overflow-hidden bg-[#f3f0e9] text-ivory">
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

      <section aria-label="Hotel room overview" className="h-full w-full">
        <HotelRoomOverview />
      </section>
    </main>
  );
}
