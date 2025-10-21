import { headers } from "next/headers";
import type { ReactNode } from "react";
import LayoutWrapperClient from "./LayoutWrapperClient";

const MOBILE_USER_AGENT_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

interface LayoutWrapperProps {
  readonly children: ReactNode;
}

const detectInitialLayout = (userAgent: string | null) => {
  if (!userAgent) {
    return {
      initialLayout: "web" as const,
      hasTouch: false,
      isSmallViewport: false,
    };
  }

  const isMobileUa = MOBILE_USER_AGENT_REGEX.test(userAgent);

  return {
    initialLayout: isMobileUa ? ("small" as const) : ("web" as const),
    hasTouch: isMobileUa,
    isSmallViewport: isMobileUa,
  };
};

export default async function LayoutWrapper({ children }: LayoutWrapperProps) {
  const headerList = await headers();
  const userAgent = headerList.get("user-agent");
  const { initialLayout, hasTouch, isSmallViewport } =
    detectInitialLayout(userAgent);

  return (
    <LayoutWrapperClient
      initialLayout={initialLayout}
      hasTouchHint={hasTouch}
      isSmallViewportHint={isSmallViewport}
    >
      {children}
    </LayoutWrapperClient>
  );
}
