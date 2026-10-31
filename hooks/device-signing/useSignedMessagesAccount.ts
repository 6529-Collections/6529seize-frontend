"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";
import { canUseDeviceSigning } from "@/lib/device-signing/login-grant";
import { useEffect, useState } from "react";

function useDeviceSigningAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!isSignedMessagesEnabled()) {
      return;
    }
    let active = true;
    const detect = async () => {
      const supported = await canUseDeviceSigning();
      if (active) {
        setAvailable(supported);
      }
    };
    void detect();
    return () => {
      active = false;
    };
  }, []);

  return available;
}

/**
 * The lowercase active wallet when signed messages apply to it: the flag is
 * on, this web browser supports Ed25519 and the user is signed in to their
 * own profile (not acting through a proxy). Otherwise null.
 */
export function useSignedMessagesAccount(): string | null {
  const { activeProfileProxy, isAuthenticated } = useAuth();
  const { address } = useSeizeConnectContext();
  const available = useDeviceSigningAvailable();

  if (!available || !address || !isAuthenticated || activeProfileProxy) {
    return null;
  }
  return address.toLowerCase();
}
