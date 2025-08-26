"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";

export function useShallowRedirect(name: string) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const next = pathname.replace(
      /^(\/nextgen\/collection\/)([^/]+)(\/?)/,
      (_, prefix: string, slug: string, tailSlash: string) => {
        if (/^\d+$/.test(slug)) {
          return `${prefix}${formatNameForUrl(name)}${tailSlash}`;
        }
        return `${prefix}${slug}${tailSlash}`;
      }
    );

    if (next !== pathname) {
      router.replace(next, { scroll: false });
    }
  }, [pathname, name, router]);
}
