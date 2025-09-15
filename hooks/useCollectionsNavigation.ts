"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { COLLECTIONS_ROUTES } from "@/constants/sidebar";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";

export function useCollectionsNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const handleCollectionsClick = useCallback(
    (onCollectionsClick?: () => void) => {
      // Check if already on a collections page
      const isOnCollectionsPage = COLLECTIONS_ROUTES.some((base) =>
        pathname?.startsWith(base)
      );

      if (isOnCollectionsPage) {
        // Already on a collections page: just toggle/open the submenu
        onCollectionsClick?.();
        return;
      }

      // Not on collections: navigate to the last stored base (or default)
      const lastBase = safeLocalStorage.getItem("lastCollectionBase");
      const target =
        lastBase && COLLECTIONS_ROUTES.includes(lastBase)
          ? lastBase
          : "/the-memes";

      if (!pathname?.startsWith(target)) {
        router.push(target);
      }
    },
    [router, pathname]
  );

  return { handleCollectionsClick };
}