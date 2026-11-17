"use client";

import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export default function NftPurchasingGate({
  children,
  redirectTo,
  placeholder = null,
}: {
  readonly children: ReactNode;
  // App-internal path only.
  readonly redirectTo?: `/${string}`;
  // Blank, aria-hidden space with the content's first-render size, never
  // purchasing UI. It holds the slot during server rendering and hydration.
  readonly placeholder?: ReactNode;
}) {
  const { hideNftPurchasing, shouldRedirect, reservesNftPurchasingSpace } =
    useNftPurchasingVisibility();
  if (hideNftPurchasing) {
    if (shouldRedirect && redirectTo) {
      return <PurchasingRedirect href={redirectTo} />;
    }
    return reservesNftPurchasingSpace ? placeholder : null;
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
