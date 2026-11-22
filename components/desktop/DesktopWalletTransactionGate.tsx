"use client";

import type { ReactNode } from "react";
import ContinueInBrowserNotice from "@/components/desktop/ContinueInBrowserNotice";
import { useIsDesktopBrowserWallet } from "@/hooks/desktop/useIsDesktopBrowserWallet";

/**
 * Wraps the control that sends a transaction. With 6529 Desktop's browser
 * forwarding, which does not send transactions, it shows "Continue in your
 * browser" in its place, so the user finishes on the website with the
 * browser wallet instead of meeting a wallet error. Elsewhere (the web, a
 * phone wallet in 6529 Desktop) it renders the control unchanged.
 */
export default function DesktopWalletTransactionGate({
  children,
}: {
  readonly children: ReactNode;
}) {
  const forwarding = useIsDesktopBrowserWallet();
  if (forwarding) return <ContinueInBrowserNotice kind="transaction" />;
  return children;
}
