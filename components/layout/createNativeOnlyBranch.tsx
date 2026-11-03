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

  // Intentionally at module evaluation, once per branch: in the app this
  // starts the download before React renders the layout that needs it.
  if (
    typeof document !== "undefined" &&
    document.documentElement.dataset["nativeRuntime"] !== undefined
  ) {
    loader.preload();
  }

  return function NativeOnlyBranch(props: BranchProps) {
    const isReady = loader.useIsReady();
    return isReady ? <LoadedBranch {...props} /> : <Fallback />;
  };
}
