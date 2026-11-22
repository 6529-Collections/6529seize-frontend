"use client";

import type { ReactNode } from "react";
import ContinueInBrowserNotice from "@/components/desktop/ContinueInBrowserNotice";
import { useIsDesktopBrowserWallet } from "@/hooks/desktop/useIsDesktopBrowserWallet";
import { desktopWalletSendsTransactions } from "@/services/desktop/desktopBrowserWallet";

/**
 * Wraps the control that sends a transaction. With 6529 Desktop's browser
 * forwarding it renders the control only for a `forwardable` transaction
 * (one on the transaction allow-list) and a 6529 Desktop that sends
 * transactions; otherwise it shows "Continue in your browser" in its place
 * (with "Update 6529 Desktop" when only the app is missing it), so the
 * user finishes on the website instead of meeting a wallet error.
 * Elsewhere (the web, a phone wallet in 6529 Desktop) it renders the
 * control unchanged.
 */
export default function DesktopWalletTransactionGate({
  children,
  className,
  forwardable = false,
}: {
  readonly children: ReactNode;
  /** When set, the control or notice is wrapped in a div with this class. */
  readonly className?: string;
  /** Whether this transaction is on the forwarding allow-list. */
  readonly forwardable?: boolean;
}) {
  const forwarding = useIsDesktopBrowserWallet();
  const sends = forwarding && desktopWalletSendsTransactions();
  let content: ReactNode = children;
  if (forwarding && !(forwardable && sends)) {
    content = (
      <ContinueInBrowserNotice
        kind={forwardable ? "transactionUpdate" : "transaction"}
      />
    );
  }
  return className === undefined ? (
    content
  ) : (
    <div className={className}>{content}</div>
  );
}
