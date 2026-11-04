"use client";

import { useEffect, useState } from "react";

import {
  detectFromClientHints,
  detectFromUserAgent,
  type VisitorPlatform,
} from "@/lib/validator-page/detectSystem";

type HighEntropyValues = {
  readonly architecture?: string;
  readonly bitness?: string;
};

type UserAgentData = {
  readonly platform: string;
  readonly getHighEntropyValues?: (
    hints: string[]
  ) => Promise<HighEntropyValues>;
};

/**
 * The server's guess from the User-Agent header, refined in Chromium by its
 * client hints, which tell an ARM64 Linux computer from an x86-64 one.
 */
export function useVisitorPlatform(initial: VisitorPlatform): VisitorPlatform {
  const [platform, setPlatform] = useState(initial);

  useEffect(() => {
    const data = (navigator as Navigator & { userAgentData?: UserAgentData })
      .userAgentData;
    if (!data?.getHighEntropyValues) {
      return undefined;
    }
    let cancelled = false;
    const fallback = detectFromUserAgent(navigator.userAgent);
    data
      .getHighEntropyValues(["architecture", "bitness"])
      .then((values) => {
        if (cancelled) {
          return;
        }
        const next = detectFromClientHints(
          data.platform,
          values.architecture,
          values.bitness,
          fallback
        );
        setPlatform((current) =>
          current.system === next.system && current.cpu === next.cpu
            ? current
            : next
        );
      })
      .catch(() => {
        // Without the hints the server's guess stands.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return platform;
}
