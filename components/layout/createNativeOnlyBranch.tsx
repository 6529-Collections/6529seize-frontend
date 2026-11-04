"use client";

import {
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";

import { createLazyComponentLoader } from "@/components/utils/lazy-load/createLazyComponentLoader";

interface BranchProps {
  readonly children: ReactNode;
}

interface NativeOnlyBranchOptions {
  /** Names the branch in the load-failure log, e.g. "messages shell". */
  readonly name: string;
  /** Shown while the chunk is loading. */
  readonly loading: () => ReactElement;
  /** Rendered instead if the chunk cannot load, so the page stays usable. */
  readonly webBranch: ComponentType<BranchProps>;
}

// For a layout branch that only the Capacitor app renders. Web visitors never
// download it. In the app, the inline native startup script has already
// marked the document by the time this module runs, so the chunk starts
// downloading with hydration; until it arrives the branch shows `loading`.
// If it fails to load, the page renders in the web branch instead of staying
// on the loading state.
export function createNativeOnlyBranch(
  importComponent: () => Promise<{
    readonly default: ComponentType<BranchProps>;
  }>,
  { name, loading, webBranch }: NativeOnlyBranchOptions
) {
  const loader = createLazyComponentLoader<BranchProps>(importComponent);
  const LoadedBranch = loader.Loaded;
  const Loading = loading;
  const WebBranch = webBranch;

  // Intentionally at module evaluation, once per branch: in the app this
  // starts the download before React renders the layout that needs it.
  if (
    typeof document !== "undefined" &&
    document.documentElement.dataset["nativeRuntime"] !== undefined
  ) {
    loader.preload();
  }

  return function NativeOnlyBranch(props: BranchProps) {
    const [failed, setFailed] = useState(false);
    const isReady = loader.useIsReady({
      enabled: !failed,
      onError: () => {
        // The loader logs the error itself; this names the failed branch.
        console.error(`Failed to load the native ${name}`);
        setFailed(true);
      },
    });

    if (failed) {
      return <WebBranch {...props} />;
    }
    return isReady ? <LoadedBranch {...props} /> : <Loading />;
  };
}
