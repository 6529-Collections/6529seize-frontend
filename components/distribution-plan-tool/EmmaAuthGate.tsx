"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isAuthResolving } from "@/components/auth/authResolution";
import AuthLoadingPlaceholder from "@/components/auth/AuthLoadingPlaceholder";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { getEmmaReturnPath, getEmmaStepSlug } from "./emma-route";

export default function EmmaAuthGate({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { address, hasValidWalletAuth, connectionState } =
    useSeizeConnectContext();
  const pathname = usePathname();
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const resolving = isAuthResolving(connectionState);
  useEffect(() => {
    if (hasHydrated && !hasValidWalletAuth && !resolving) {
      const step = getEmmaStepSlug(
        new URLSearchParams(window.location.search).get("step")
      );
      const destination = getEmmaReturnPath(
        pathname && step ? `${pathname}?step=${step}` : pathname
      );
      router.replace(`/emma?returnTo=${encodeURIComponent(destination)}`);
    }
  }, [hasHydrated, hasValidWalletAuth, resolving, pathname, router]);

  if (!hasHydrated || !hasValidWalletAuth) return <AuthLoadingPlaceholder />;
  return <div key={address}>{children}</div>;
}
