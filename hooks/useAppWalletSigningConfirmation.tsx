"use client";

import { useEffect, useRef, useState } from "react";
import { AppWalletSigningConfirmationModal } from "@/components/app-wallets/AppWalletSigningConfirmationModal";
import {
  type AppWalletSigningRequest,
  setAppWalletSigningConfirmationDelegate,
} from "@/wagmiConfig/appWalletSigningConfirmation";

type PendingConfirmation = Readonly<{
  request: AppWalletSigningRequest;
  resolve: (approved: boolean) => void;
}>;

/**
 * Mounts the dialog that approves each app-wallet signature or transaction
 * and registers it with the app-wallet connector. Requests made while it is
 * not mounted are rejected.
 */
export function useAppWalletSigningConfirmation() {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const pendingRef = useRef<PendingConfirmation | null>(null);

  useEffect(() => {
    const unregister = setAppWalletSigningConfirmationDelegate(
      (request) =>
        new Promise<boolean>((resolve) => {
          // A request is never left unanswered behind a newer one.
          pendingRef.current?.resolve(false);
          const next = { request, resolve };
          pendingRef.current = next;
          setPending(next);
        })
    );
    return () => {
      unregister();
      pendingRef.current?.resolve(false);
      pendingRef.current = null;
    };
  }, []);

  const settle = (approved: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    current?.resolve(approved);
  };

  return (
    <AppWalletSigningConfirmationModal
      request={pending?.request ?? null}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );
}
