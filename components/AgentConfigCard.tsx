"use client";

import React, { useRef } from "react";
import Image from "next/image";
import type { AgentConfig } from "@/types/agent";

// Convert decimal degrees to DMS notation — the signature typographic element
function toDMS(value: string, isLat: boolean): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  const abs = Math.abs(num);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat - min) * 60);
  const dir = isLat
    ? num >= 0
      ? "N"
      : "S"
    : num >= 0
      ? "E"
      : "W";
  return `${deg}°${String(min).padStart(2, "0")}'${String(sec).padStart(2, "0")}"${dir}`;
}

// ── View mode ────────────────────────────────────────────────────────────────

interface CardViewProps {
  config: AgentConfig;
  onEdit: () => void;
}

function CardView({ config, onEdit }: CardViewProps) {
  const hasCoords = Boolean(config.lat && config.lng);
  const hasThumbnail = Boolean(config.thumbnailUrl);

  return (
    <div className="w-full max-w-sm bg-dark-card rounded-2xl overflow-hidden border border-base-border shadow-2xl shadow-slate-900/10">
      {/* Thumbnail */}
      <div className="relative h-48 bg-espresso overflow-hidden flex items-center justify-center">
        {hasThumbnail ? (
          <>
            <Image
              src={config.thumbnailUrl}
              alt={config.name}
              fill
              sizes="384px"
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-card/70 via-transparent to-transparent" />
          </>
        ) : (
          <svg
            className="w-16 h-16 text-taupe/35"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={0.75}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4 relative">
        <button
          onClick={onEdit}
          className="absolute top-4 right-5 font-body text-xs text-taupe tracking-widest uppercase hover:text-gold transition-colors focus:outline-none focus-visible:text-gold"
          aria-label="Edit property details"
        >
          Edit
        </button>

        <h2 className="font-display text-2xl italic font-semibold text-ivory leading-tight pr-10">
          {config.name || (
            <span className="text-taupe/80 not-italic font-normal">
              Property name
            </span>
          )}
        </h2>

        {config.address && (
          <p className="font-body text-sm text-taupe mt-1 leading-snug">
            {config.address}
          </p>
        )}

        {hasCoords && (
          <p className="font-mono text-xs text-gold/70 tracking-wider mt-3">
            {toDMS(config.lat, true)}&ensp;/&ensp;{toDMS(config.lng, false)}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Edit mode ────────────────────────────────────────────────────────────────

interface CardEditProps {
  draft: AgentConfig;
  onUpdate: (field: keyof AgentConfig, value: string) => void;
  onSave: (config: AgentConfig) => void;
  onCancel: () => void;
  hasExistingConfig: boolean;
}

function CardEdit({
  draft,
  onUpdate,
  onSave,
  onCancel,
  hasExistingConfig,
}: CardEditProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result;
      if (typeof result === "string") {
        onUpdate("thumbnailUrl", result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(draft);
  }

  const hasPreview = Boolean(draft.thumbnailUrl);
  const showCoordPreview = Boolean(draft.lat || draft.lng);

  return (
    <div className="w-full max-w-sm bg-dark-card rounded-2xl overflow-hidden border border-gold/20 shadow-2xl">
      {/* Thumbnail upload zone */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="relative w-full h-48 bg-espresso flex items-center justify-center group focus:outline-none"
        aria-label="Upload property thumbnail"
      >
        {hasPreview ? (
          <>
            <Image
              src={draft.thumbnailUrl}
              alt="Property preview"
              fill
              sizes="384px"
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="font-body text-xs text-white tracking-widest uppercase">
                Change image
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-taupe/40 group-hover:text-taupe/70 group-focus-visible:text-taupe/70 transition-colors">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <span className="font-body text-xs tracking-widest uppercase">
              Add thumbnail
            </span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
      </button>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-5">
        {/* Property name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="agent-name"
            className="font-body text-xs text-taupe/70 tracking-widest uppercase"
          >
            Property name
          </label>
          <input
            id="agent-name"
            type="text"
            value={draft.name}
            onChange={(e) => onUpdate("name", e.target.value)}
            placeholder="The Grand Meridian"
            className="bg-transparent border-0 border-b border-taupe/30 pb-1.5 font-display text-xl italic font-semibold text-ivory placeholder:text-taupe/25 focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        {/* Address */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="agent-address"
            className="font-body text-xs text-taupe/70 tracking-widest uppercase"
          >
            Address
          </label>
          <input
            id="agent-address"
            type="text"
            value={draft.address}
            onChange={(e) => onUpdate("address", e.target.value)}
            placeholder="123 Park Avenue, New York, NY"
            className="bg-transparent border-0 border-b border-taupe/30 pb-1.5 font-body text-sm text-ivory placeholder:text-taupe/25 focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        {/* Coordinates */}
        <div className="flex flex-col gap-2">
          <span className="font-body text-xs text-taupe/70 tracking-widest uppercase">
            Coordinates
          </span>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-taupe/50">Latitude</span>
              <input
                type="text"
                value={draft.lat}
                onChange={(e) => onUpdate("lat", e.target.value)}
                placeholder="40.7484"
                inputMode="decimal"
                aria-label="Latitude"
                className="bg-transparent border-0 border-b border-taupe/30 pb-1.5 font-mono text-sm text-ivory placeholder:text-taupe/25 focus:outline-none focus:border-gold transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-taupe/50">Longitude</span>
              <input
                type="text"
                value={draft.lng}
                onChange={(e) => onUpdate("lng", e.target.value)}
                placeholder="-73.9856"
                inputMode="decimal"
                aria-label="Longitude"
                className="bg-transparent border-0 border-b border-taupe/30 pb-1.5 font-mono text-sm text-ivory placeholder:text-taupe/25 focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>
          {/* Live DMS preview */}
          {showCoordPreview && (
            <p className="font-mono text-xs text-gold/60 tracking-wider">
              {toDMS(draft.lat, true)}&ensp;/&ensp;{toDMS(draft.lng, false)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className="flex-1 bg-gold text-espresso font-body text-sm font-semibold tracking-widest uppercase py-3 rounded-xl hover:bg-gold/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dark-card"
          >
            Save property
          </button>
          {hasExistingConfig && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 font-body text-sm text-taupe tracking-widest uppercase hover:text-ivory transition-colors focus:outline-none focus-visible:text-ivory"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Public component ─────────────────────────────────────────────────────────

export interface AgentConfigCardProps {
  config: AgentConfig;
  draft: AgentConfig;
  isEditing: boolean;
  startEditing: () => void;
  cancelEditing: () => void;
  save: (config: AgentConfig) => void;
  updateDraft: (field: keyof AgentConfig, value: string) => void;
}

export function AgentConfigCard({
  config,
  draft,
  isEditing,
  startEditing,
  cancelEditing,
  save,
  updateDraft,
}: AgentConfigCardProps) {
  const hasExistingConfig = Boolean(config.name || config.address);

  if (isEditing) {
    return (
      <CardEdit
        draft={draft}
        onUpdate={updateDraft}
        onSave={save}
        onCancel={cancelEditing}
        hasExistingConfig={hasExistingConfig}
      />
    );
  }

  return <CardView config={config} onEdit={startEditing} />;
}
