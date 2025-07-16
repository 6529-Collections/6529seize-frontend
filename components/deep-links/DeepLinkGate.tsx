"use client";
import { useState, useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useRouter } from "next/navigation";
import useCapacitor from "@/hooks/useCapacitor";
import { resolveDeepLink } from "@/helpers/deep-link.helpers";
import { initDeepLink } from "@/helpers/deep-link.helpers";

export const DeepLinkGate = ({ children }: { children: React.ReactNode }) => {
  const { isCapacitor } = useCapacitor();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isCapacitor) {
      setReady(true);
      return;
    }

    // Cold-start handling
    async function startup() {
      const targetUrl = await initDeepLink();
      if (targetUrl) {
        router.replace(targetUrl);
      } else {
        setReady(true);
      }
    }
    startup();

    // Runtime deep-link listener
    const listenerPromise = CapacitorApp.addListener(
      "appUrlOpen",
      ({ url }) => {
        const resolved = resolveDeepLink(url);
        if (resolved) {
          router.replace(resolved);
        } else {
          console.warn("DeepLinkGate: unknown deep link", url);
        }
      }
    );

    return () => {
      listenerPromise.then((l) => l.remove());
    };
  }, [isCapacitor, router]);

  if (!ready) {
    return null;
  }
  return <>{children}</>;
};
