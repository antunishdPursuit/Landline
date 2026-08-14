"use client";

import { useState, useSyncExternalStore } from "react";
import { SignIn } from "@clerk/nextjs";
import { getSafeDashboardRedirect } from "@/lib/sign-in-redirect";

export function isEmbeddedBrowser(userAgent: string): boolean {
  const knownEmbeddedBrowser =
    /(Slack|FBAN|FBAV|Instagram|Line\/|LinkedInApp|Twitter|GSA\/|\bwv\b)/i;
  const iosWebView =
    /(iPhone|iPad|iPod)/i.test(userAgent) &&
    /AppleWebKit/i.test(userAgent) &&
    !/Safari/i.test(userAgent);

  return knownEmbeddedBrowser.test(userAgent) || iosWebView;
}

function subscribeToBrowserStatus(): () => void {
  return () => undefined;
}

function getBrowserStatus(): "embedded" | "supported" {
  return isEmbeddedBrowser(window.navigator.userAgent)
    ? "embedded"
    : "supported";
}

function getServerBrowserStatus(): "checking" {
  return "checking";
}

function getBrowserRedirect(): string {
  return getSafeDashboardRedirect(
    new URLSearchParams(window.location.search).get("next")
  );
}

function getServerRedirect(): "/dashboard" {
  return "/dashboard";
}

export function SignInExperience() {
  const browserStatus = useSyncExternalStore(
    subscribeToBrowserStatus,
    getBrowserStatus,
    getServerBrowserStatus
  );
  const redirectUrl = useSyncExternalStore(
    subscribeToBrowserStatus,
    getBrowserRedirect,
    getServerRedirect
  );
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );

  async function copyLink() {
    try {
      await window.navigator.clipboard.writeText(window.location.href);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  if (browserStatus === "checking") {
    return (
      <div
        className="w-full max-w-sm rounded-xl border border-base-border bg-white p-5 text-center text-sm text-slate-600 shadow-sm"
        role="status"
      >
        Preparing secure sign-in…
      </div>
    );
  }

  if (browserStatus === "embedded") {
    return (
      <section className="w-full max-w-sm rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
          Browser required
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          Open Landline in Safari or Chrome
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Slack and other in-app browsers can block the cookies Clerk needs to
          finish signing in.
        </p>
        <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
          <li>Open the app menu, usually marked •••.</li>
          <li>Select Open in Browser or Open in Safari.</li>
          <li>Use the demo username and password there.</li>
        </ol>
        <button
          type="button"
          onClick={copyLink}
          className="mt-5 min-h-11 w-full rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
        >
          {copyStatus === "copied" ? "Link copied" : "Copy Landline link"}
        </button>
        {copyStatus === "failed" && (
          <p className="mt-2 text-xs text-amber-900" role="alert">
            Copy the address from the browser menu, then paste it into Safari or
            Chrome.
          </p>
        )}
      </section>
    );
  }

  return (
    <SignIn
      path="/sign-in"
      routing="path"
      forceRedirectUrl={redirectUrl}
    />
  );
}
