"use client";

import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { useRouter } from "next/navigation";
import useCapacitor from "@/hooks/useCapacitor";
import { resolveDeepLink } from "@/helpers/deep-link.helpers";

const hasBooted = () => {
  return sessionStorage.getItem("hasBooted") === "true";
};

export const DeepLinkGate = ({ children }: { children: React.ReactNode }) => {
  const { isCapacitor } = useCapacitor();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isCapacitor) {
      setReady(true);
      return;
    }

    const handleDeepLink = (deepLinkUrl: string) => {
      const resolved = resolveDeepLink(deepLinkUrl);
      if (resolved) {
        const searchParams = new URLSearchParams(
          Object.entries(resolved.queryParams).map(([k, v]) => [k, String(v)])
        );
        const url = `${resolved.pathname}?${searchParams.toString()}`;
        console.log("Deep Link Navigation", url);
        router.replace(url);
      } else {
        console.log("Unknown or invalid deep link:", deepLinkUrl);
      }
    };

    const listener = App.addListener("appUrlOpen", (data) => {
      console.log("Deep link opened while app running:", data.url);
      handleDeepLink(data.url);
    });

    if (hasBooted()) {
      setReady(true);
    } else {
      console.log("Not booted, checking for cold start deep link");
      const checkColdStart = async () => {
        const launchUrlResult = await App.getLaunchUrl();

        sessionStorage.setItem("hasBooted", "true");

        if (launchUrlResult?.url) {
          console.log("Cold start deep link detected:", launchUrlResult.url);
          handleDeepLink(launchUrlResult.url);
        }

        setReady(true);
      };

      checkColdStart();
    }

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, []);

  if (!ready) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-screen tw-w-screen tw-bg-black tw-text-white tw-text-2xl tw-font-bold">
        Splash screen…
      </div>
    );
  }

  return <>{children}</>;
};
