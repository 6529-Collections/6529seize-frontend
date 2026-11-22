"use client";

import { useContext, useEffect } from "react";
import { WagmiContext, type Config } from "wagmi";
import type { SupportedLocale } from "@/i18n/locales";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useChainIdentityActive } from "@/hooks/useIdentityMovePhase";
import {
  getProfileDocWriter,
  registerProfileDocWriter,
  type ProfileDocWriter,
} from "@/lib/profile-cms/chain/profile-doc-writer";

const loadWriter = async (config: Config, locale: SupportedLocale) => {
  const [{ chainProfileDocWriter }, { chainErrorMessage }] = await Promise.all([
    import("@/lib/chain-identity/profileDocWriter"),
    import("./chainErrorMessage"),
  ]);
  return chainProfileDocWriter(config, (refusal) =>
    chainErrorMessage(locale, refusal)
  );
};

/** Registers at once; the chain code loads on the first call. */
const lazyWriter = (
  config: Config,
  locale: SupportedLocale
): ProfileDocWriter => ({
  availableSigners: async () =>
    (await loadWriter(config, locale)).availableSigners(),
  replaceProfileDoc: async (edit, signer) =>
    (await loadWriter(config, locale)).replaceProfileDoc(edit, signer),
});

/**
 * Lets the profile site builder change the profile document on the 6529
 * Network, on any page, once identities have moved there and this build
 * has the chain flows on. Renders nothing.
 */
export default function ChainProfileDocWriterHost() {
  const active = useChainIdentityActive();
  const config = useContext(WagmiContext);
  const locale = useBrowserLocale();
  useEffect(() => {
    if (!active || !config) {
      return;
    }
    const writer = lazyWriter(config, locale);
    registerProfileDocWriter(writer);
    return () => {
      // Clears only its own registration.
      if (getProfileDocWriter() === writer) {
        registerProfileDocWriter(null);
      }
    };
  }, [active, config, locale]);
  return null;
}
