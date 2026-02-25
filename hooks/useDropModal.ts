import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { markDropCloseNavigation } from "@/helpers/drop-close-navigation.helpers";
import { useClosingDropId } from "@/hooks/useClosingDropId";
import { commonApiFetch } from "@/services/api/common-api";

export function useDropModal() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const dropId = searchParams.get("drop") ?? undefined;
  const { effectiveDropId, beginClosingDrop } = useClosingDropId(dropId);

  const { data: drop, isLoading } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: effectiveDropId }],
    queryFn: async () => {
      if (!effectiveDropId) {
        throw new Error("Cannot fetch drop without a drop id");
      }

      return await commonApiFetch<ApiDrop>({
        endpoint: `drops/${effectiveDropId}`,
      });
    },
    placeholderData: keepPreviousData,
    enabled: !!effectiveDropId,
  });

  const onDropClose = useCallback(() => {
    if (dropId) {
      beginClosingDrop(dropId);
      markDropCloseNavigation();
    }
    const params = new URLSearchParams(searchParams.toString() || "");
    params.delete("drop");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || "/";
    router.replace(newUrl, { scroll: false });
  }, [dropId, beginClosingDrop, searchParams, pathname, router]);

  const isDropMatch = Boolean(
    effectiveDropId &&
      drop?.id.toLowerCase() === effectiveDropId.toLowerCase()
  );
  const activeDrop = isDropMatch ? drop : undefined;
  const isDropOpen = isDropMatch;

  // Handle escape key for drop modal
  useEffect(() => {
    if (!isDropOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDropClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isDropOpen, onDropClose]);

  return {
    activeDrop,
    drop,
    dropId,
    isDropOpen,
    isLoading,
    onDropClose,
  };
}
