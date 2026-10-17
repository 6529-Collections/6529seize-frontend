"use client";

import type { ReactNode } from "react";
import EnvironmentOriginProvider from "@/components/common/EnvironmentOriginContext";
import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import AwsRumProvider from "@/components/monitoring/AwsRumProvider";
import MobileLaunchTimingReporter from "@/components/monitoring/MobileLaunchTimingReporter";
import LayoutWrapper from "@/components/providers/LayoutWrapper";
import Providers from "@/components/providers/Providers";
import RuntimeFavicon from "@/components/providers/RuntimeFavicon";

// The root layout renders this single client boundary instead of each client
// component directly. Every client reference a Server Component renders repeats
// the root layout's full chunk list in the inline RSC data of every HTML page.
export default function RootClientShell({
  origin,
  initialIsIos,
  initialEulaConsentVersion,
  children,
}: {
  readonly origin: string;
  readonly initialIsIos: boolean;
  readonly initialEulaConsentVersion: string | undefined;
  readonly children: ReactNode;
}) {
  return (
    <>
      <RuntimeFavicon />
      <MobileLaunchTimingReporter />
      <AwsRumProvider>
        <EnvironmentOriginProvider origin={origin}>
          <Providers
            initialIsIos={initialIsIos}
            initialEulaConsentVersion={initialEulaConsentVersion}
          >
            <DynamicHeadTitle />
            <LayoutWrapper>{children}</LayoutWrapper>
          </Providers>
        </EnvironmentOriginProvider>
      </AwsRumProvider>
    </>
  );
}
