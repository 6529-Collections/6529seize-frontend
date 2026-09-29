"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

export function useCompetitionDropNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  return (drop: ExtendedDrop) => {
    const params = new URLSearchParams(search.toString());
    params.set("drop", drop.id);
    router.push(`${pathname}?${params}`, { scroll: false });
  };
}
