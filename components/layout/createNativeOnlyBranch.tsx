"use client";

import type { ComponentType, ReactElement, ReactNode } from "react";

import { createLazyComponentLoader } from "@/components/utils/lazy-load/createLazyComponentLoader";

interface BranchProps {
  readonly children: ReactNode;
}

// For a layout branch that only the Capacitor app renders. Web visitors never
// download it. In the app, the inline native startup script has already
// marked the document by the time this module runs, so the chunk starts
// downloading with hydration; until it arrives the branch shows `fallback`.
export function createNativeOnlyBranch(
  importComponent: () => Promise<{
    readonly default: ComponentType<BranchProps>;
  }>,
  fallback: () => ReactElement
) {
  const loader = createLazyComponentLoader<BranchProps>(importComponent);
  const LoadedBranch = loader.Loaded;
  const Fallback = fallback;

  if (
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute("data-native-runtime")
  ) {
    loader.preload();
  }

  return function NativeOnlyBranch(props: BranchProps) {
    const isReady = loader.useIsReady();
    return isReady ? <LoadedBranch {...props} /> : <Fallback />;
  };
}
