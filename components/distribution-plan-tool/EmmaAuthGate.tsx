"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isAuthResolving } from "@/components/auth/authResolution";
import AuthLoadingPlaceholder from "@/components/auth/AuthLoadingPlaceholder";
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
  const resolving = isAuthResolving(connectionState);
  const destination = getEmmaReturnPath(pathname);

  useEffect(() => {
    if (!hasValidWalletAuth && !resolving) {
      router.replace(`/emma?returnTo=${encodeURIComponent(destination)}`);
    }
  }, [hasValidWalletAuth, resolving, destination, router]);

  if (!hasValidWalletAuth) return <AuthLoadingPlaceholder />;
  return <div key={address}>{children}</div>;
}
