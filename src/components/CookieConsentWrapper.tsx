"use client";

import dynamic from "next/dynamic";

export const CookieConsent = dynamic(
  () => import("@/components/CookieConsent").then((mod) => ({ default: mod.CookieConsent })),
  { ssr: false }
);
