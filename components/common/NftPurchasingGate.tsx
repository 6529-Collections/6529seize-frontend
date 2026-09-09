"use client";

import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export default function NftPurchasingGate({
  children,
  redirectTo,
}: {
  readonly children: ReactNode;
  readonly redirectTo?: string;
}) {
  const { hideNftPurchasing, shouldRedirect } = useNftPurchasingVisibility();
  if (hideNftPurchasing) {
    return shouldRedirect && redirectTo ? (
      <PurchasingRedirect href={redirectTo} />
    ) : null;
  }
  return children;
}

function PurchasingRedirect({ href }: { readonly href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [href, router]);
  return null;
}
