"use client";

import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import useCapacitor from "@/hooks/useCapacitor";
import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./CollectDetailActionRow.module.css";

// Only the Meme detail page opts in; other inline trade surfaces keep their layout.
export const CollectDetailLayout = createContext<{
  readonly offerAction: ReactNode;
  readonly marketLink: ReactNode;
} | null>(null);

export default function CollectDetailActionRow({
  children,
  primaryAction,
  active = true,
}: {
  readonly children: ReactNode;
  readonly primaryAction?: ReactNode;
  readonly active?: boolean;
}) {
  const layout = useContext(CollectDetailLayout);
  if (!layout || !active) {
    return (
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        {primaryAction}
        {children}
      </div>
    );
  }
  return (
    <MobileActionRow
      primaryAction={primaryAction}
      offerAction={layout.offerAction}
    >
      {children}
    </MobileActionRow>
  );
}

function MobileActionRow({
  children,
  primaryAction,
  offerAction,
}: {
  readonly children: ReactNode;
  readonly primaryAction: ReactNode;
  readonly offerAction: ReactNode;
}) {
  const [offscreen, setOffscreen] = useState(false);
  const { isCapacitor } = useCapacitor();
  const { spaces } = useLayout();

  const observeRow = useCallback((row: HTMLDivElement | null) => {
    if (!row || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      setOffscreen(Boolean(entry && !entry.isIntersecting));
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        ref={observeRow}
        data-collect-inline-actions
        data-testid="collect-inline-actions"
        className={`tw-flex tw-flex-wrap tw-items-center tw-gap-2 ${styles["inlineActions"] ?? ""}`}
      >
        {primaryAction}
        {children}
      </div>
      {typeof document !== "undefined" &&
        createPortal(
          <div
            data-collect-sticky-actions
            data-testid="collect-sticky-actions"
            aria-hidden={!offscreen}
            inert={!offscreen}
            style={{ bottom: isCapacitor ? spaces.mobileNavSpace || 104 : 0 }}
            className={`tailwind-scope ${styles["stickyActions"] ?? ""} tw-fixed tw-inset-x-0 tw-z-40 tw-flex tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-[#0D0D0F] tw-px-4 tw-pb-[calc(10px+env(safe-area-inset-bottom))] tw-pt-2.5 tw-transition-[transform,opacity,visibility] tw-duration-150 motion-reduce:tw-transition-none sm:tw-hidden ${offscreen ? "tw-visible tw-translate-y-0 tw-opacity-100" : "tw-invisible tw-translate-y-2 tw-opacity-0"}`}
          >
            {primaryAction}
            {offerAction}
          </div>,
          document.body
        )}
    </>
  );
}
