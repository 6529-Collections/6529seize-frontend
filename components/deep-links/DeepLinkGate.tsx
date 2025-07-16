"use client";
import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useRouter } from "next/navigation";
import useCapacitor from "@/hooks/useCapacitor";
import { resolveDeepLink } from "@/helpers/deep-link.helpers";

export const DeepLinkGate = ({ children }: { children: React.ReactNode }) => {
  const { isCapacitor } = useCapacitor();
  const router = useRouter();

  useEffect(() => {
    if (!isCapacitor) return;

    const handleDeepLink = (deepLinkUrl: string) => {
      const resolved = resolveDeepLink(deepLinkUrl);
      if (resolved) {
        const params = new URLSearchParams(
          Object.entries(resolved.queryParams).map(([k, v]) => [k, String(v)])
        );
        const url = `${resolved.pathname}${
          params.toString() ? `?${params.toString()}` : ""
        }`;
        router.replace(url);
      } else {
        console.warn("DeepLinkGate: unknown deep link:", deepLinkUrl);
      }
    };

    const listenerPromise = App.addListener("appUrlOpen", ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [isCapacitor, router]);

  return <>{children}</>;
};
