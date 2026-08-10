import React from "react";
import { HotelRoomOverview } from "@/components/HotelRoomOverview";

export default function GuestPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f3f0e9] px-4 py-5 text-ivory sm:px-8 sm:py-7 lg:px-12">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between border-b border-[#d8cdbd] pb-4">
        <div>
          <p className="font-body text-[10px] font-medium uppercase tracking-[0.3em] text-taupe sm:text-xs">
            In-room concierge
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ivory sm:text-5xl">
            Landline
          </h1>
        </div>

        <div className="text-right">
          <p className="font-body text-[10px] uppercase tracking-[0.25em] text-taupe sm:text-xs">
            Welcome
          </p>
          <p className="font-display text-xl font-semibold text-ivory sm:text-2xl">
            Room 1208
          </p>
        </div>
      </header>

      <section
        aria-labelledby="room-overview-heading"
        className="mx-auto flex w-full max-w-[1440px] flex-col items-center pt-5 sm:pt-7"
      >
        <div className="mb-4 text-center sm:mb-6">
          <p className="font-body text-[10px] font-medium uppercase tracking-[0.32em] text-gold sm:text-xs">
            Your stay begins here
          </p>
          <h2
            id="room-overview-heading"
            className="mt-1 font-display text-3xl font-semibold text-ivory sm:text-4xl"
          >
            Make yourself at home
          </h2>
        </div>

        <HotelRoomOverview />

        <p className="mt-4 max-w-xl text-center font-body text-xs leading-relaxed text-taupe sm:mt-5 sm:text-sm">
          Your bedside phone and room panel are ready whenever you need us.
        </p>
      </section>
    </main>
  );
}
