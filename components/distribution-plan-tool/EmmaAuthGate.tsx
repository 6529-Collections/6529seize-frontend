"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isAuthResolving } from "@/components/auth/authResolution";
import AuthLoadingPlaceholder from "@/components/auth/AuthLoadingPlaceholder";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { getEmmaReturnPath } from "./emma-route";

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
  const destination = getEmmaReturnPath(pathname);

  useEffect(() => {
    if (hasHydrated && !hasValidWalletAuth && !resolving) {
      router.replace(`/emma?returnTo=${encodeURIComponent(destination)}`);
    }
  }, [hasHydrated, hasValidWalletAuth, resolving, destination, router]);

  if (!hasHydrated || !hasValidWalletAuth) return <AuthLoadingPlaceholder />;
  return <div key={address}>{children}</div>;
}
