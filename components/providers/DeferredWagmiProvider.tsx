"use client";

import { hydrate } from "@wagmi/core";
import { useEffect, useRef, type ReactNode } from "react";
import { WagmiContext, type Config } from "wagmi";

/** Keep descendants mounted while replacing the wallet-free hydration config. */
export default function DeferredWagmiProvider({
  config,
  reconnectOnMount,
  children,
}: {
  readonly config: Config;
  readonly reconnectOnMount: boolean;
  readonly children: ReactNode;
}) {
  const mountedConfig = useRef<Config | null>(null);
  useEffect(() => {
    if (mountedConfig.current === config) return;
    mountedConfig.current = config;
    // WagmiProvider runs onMount during render for non-SSR configs. Our real
    // adapter arrives after hydration, when descendants already subscribe to
    // it. Reconnect only after commit to avoid updating those stores in render.
    void hydrate(config, { reconnectOnMount }).onMount();
  }, [config, reconnectOnMount]);

  return (
    <WagmiContext.Provider value={config}>{children}</WagmiContext.Provider>
  );
}
