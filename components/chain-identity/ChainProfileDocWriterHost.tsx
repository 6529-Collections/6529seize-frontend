"use client";

import { useContext, useEffect } from "react";
import { WagmiContext, type Config } from "wagmi";
import { useChainIdentityActive } from "@/hooks/useIdentityMovePhase";
import {
  getProfileDocWriter,
  registerProfileDocWriter,
  type ProfileDocWriter,
} from "@/lib/profile-cms/chain/profile-doc-writer";

const loadWriter = async (config: Config) =>
  (await import("@/lib/chain-identity/profileDocWriter")).chainProfileDocWriter(
    config
  );

/** Registers at once; the chain code loads on the first call. */
const lazyWriter = (config: Config): ProfileDocWriter => ({
  availableSigners: async () => (await loadWriter(config)).availableSigners(),
  replaceProfileDoc: async (edit, signer) =>
    (await loadWriter(config)).replaceProfileDoc(edit, signer),
});

/**
 * Lets the profile site builder change the profile document on the 6529
 * Network, on any page, once identities have moved there and this build
 * has the chain flows on. Renders nothing.
 */
export default function ChainProfileDocWriterHost() {
  const active = useChainIdentityActive();
  const config = useContext(WagmiContext);
  useEffect(() => {
    if (!active || !config) {
      return;
    }
    const writer = lazyWriter(config);
    registerProfileDocWriter(writer);
    return () => {
      // Clears only its own registration.
      if (getProfileDocWriter() === writer) {
        registerProfileDocWriter(null);
      }
    };
  }, [active, config]);
  return null;
}
