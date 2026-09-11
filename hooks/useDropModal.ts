import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useClosingDropId } from "@/hooks/useClosingDropId";
import {
  DROP_DETAIL_STALE_TIME_MS,
  fetchDropByIdBatched,
  getDropQueryKey,
} from "@/services/api/drop-api";

export function useDropModal() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const dropId = searchParams.get("drop") ?? undefined;
  const { effectiveDropId, beginClosingDrop } = useClosingDropId(dropId);

  const { data: drop, isLoading } = useQuery<ApiDrop>({
    queryKey: getDropQueryKey(effectiveDropId),
    queryFn: () => {
      if (!effectiveDropId) {
        throw new Error("Cannot fetch drop without a drop id");
      }

      return fetchDropByIdBatched(effectiveDropId);
    },
    placeholderData: keepPreviousData,
    enabled: !!effectiveDropId,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
  });

  const onDropClose = useCallback(() => {
    if (dropId) {
      beginClosingDrop(dropId);
    }
    const params = new URLSearchParams(searchParams.toString() || "");
    params.delete("drop");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || "/";
    router.replace(newUrl, { scroll: false });
  }, [dropId, beginClosingDrop, searchParams, pathname, router]);

  const isDropMatch = Boolean(
    effectiveDropId && drop?.id.toLowerCase() === effectiveDropId.toLowerCase()
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
