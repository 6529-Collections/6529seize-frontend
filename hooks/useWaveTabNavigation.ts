"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function useWaveTabNavigation() {
  const router = useRouter();

  return useCallback(
    (href: string, mode: "push" | "replace" = "push") => {
      const current = new URL(globalThis.location.href);
      const target = new URL(href, current);
      if (current.href === target.href) return;

      // Only client-owned tab state can bypass the server. Preserve real
      // navigation when the page, competition, or any command parameter changes.
      current.searchParams.delete("tab");
      target.searchParams.delete("tab");
      current.searchParams.sort();
      target.searchParams.sort();
      if (current.href === target.href) {
        if (mode === "replace") globalThis.history.replaceState(null, "", href);
        else globalThis.history.pushState(null, "", href);
        return;
      }

      router[mode](href, { scroll: false });
    },
    [router]
  );
}
