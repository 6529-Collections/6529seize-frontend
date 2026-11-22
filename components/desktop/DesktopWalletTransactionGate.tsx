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
  className,
}: {
  readonly children: ReactNode;
  /** When set, the control or notice is wrapped in a div with this class. */
  readonly className?: string;
}) {
  const forwarding = useIsDesktopBrowserWallet();
  const content = forwarding ? (
    <ContinueInBrowserNotice kind="transaction" />
  ) : (
    children
  );
  return className === undefined ? (
    content
  ) : (
    <div className={className}>{content}</div>
  );
}
