import React from "react";
import { HotelRoomOverview } from "@/components/HotelRoomOverview";

export default function GuestPage() {
  return (
    <main className="relative h-[100dvh] min-h-[560px] overflow-hidden bg-[#f3f0e9] text-ivory">
      <h1 className="absolute left-5 top-4 z-10 font-display text-3xl font-semibold tracking-tight text-[#2b2926] sm:left-8 sm:top-6 sm:text-4xl">
        Landline
      </h1>

      <section aria-label="Hotel room overview" className="h-full w-full">
        <HotelRoomOverview />
      </section>
    </main>
  );
}
