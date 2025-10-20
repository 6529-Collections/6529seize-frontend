import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

export function useDropModal() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const dropId = searchParams?.get("drop") ?? undefined;

  const { data: drop, isLoading } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!dropId,
  });

  const onDropClose = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("drop");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || "/";
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  const isDropOpen = !!dropId && !!drop;

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
    drop,
    dropId,
    isDropOpen,
    isLoading,
    onDropClose,
  };
}