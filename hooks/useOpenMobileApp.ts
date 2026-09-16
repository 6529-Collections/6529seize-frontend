"use client";

import { publicEnv } from "@/config/env";
import { getMobileAppLink } from "@/helpers/mobileAppLinks";
import { useState } from "react";

export function useOpenMobileApp() {
  const [attempted, setAttempted] = useState(false);

  const openApp = (destination?: string, useIntent = true) => {
    // Capture the live URL on the gesture, including client-side route/query/hash changes.
    const path =
      destination ??
      `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const link = getMobileAppLink({
      destination: path,
      origin: window.location.origin,
      scheme: publicEnv.MOBILE_APP_SCHEME ?? "mobile6529",
      userAgent: navigator.userAgent,
      useIntent,
    });
    if (!link) return;

    setAttempted(true);
    try {
      window.open(link, "_self");
    } catch {
      // A blocked launch and an absent app cannot be reliably distinguished on the web.
    }
  };

  return { attempted, openApp };
}
