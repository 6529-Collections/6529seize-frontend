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

export const CollectDetailHasPrimaryAction = createContext(false);

// Only the Meme detail page opts in; other inline trade surfaces keep their layout.
export const CollectDetailLayout = createContext<{
  readonly offerAction: ReactNode;
  readonly marketLink: ReactNode;
} | null>(null);

/** Keeps the existing listing status above its actions. */
export function CollectDetailHeader({
  children,
}: {
  readonly children?: ReactNode;
}) {
  const layout = useContext(CollectDetailLayout);
  if (!layout) return children;
  return (
    <div data-collect-detail-header className="empty:tw-hidden">
      {children}
    </div>
  );
}

/** Allows supporting controls to occupy slots in the shared action grid. */
function CollectDetailFooter({ children }: { readonly children?: ReactNode }) {
  const layout = useContext(CollectDetailLayout);
  if (!layout) return children;
  return (
    <div data-collect-detail-utilities className="tw-contents">
      {Boolean(children) && (
        <div data-collect-detail-other-actions className="tw-contents">
          {children}
        </div>
      )}
      {layout.marketLink}
    </div>
  );
}

export default function CollectDetailActionRow({
  children,
  primaryAction,
  supportingActions,
  details,
  active = true,
}: {
  readonly children: ReactNode;
  readonly primaryAction?: ReactNode;
  readonly supportingActions?: ReactNode;
  readonly details?: ReactNode;
  readonly active?: boolean;
}) {
  const layout = useContext(CollectDetailLayout);
  if (!layout || !active) {
    return (
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        {primaryAction}
        {children}
        {supportingActions}
      </div>
    );
  }
  return (
    <MobileActionRow
      primaryAction={primaryAction}
      offerAction={layout.offerAction}
      supportingActions={supportingActions}
      details={details}
    >
      {children}
    </MobileActionRow>
  );
}

function MobileActionRow({
  children,
  primaryAction,
  offerAction,
  supportingActions,
  details,
}: {
  readonly children: ReactNode;
  readonly primaryAction: ReactNode;
  readonly offerAction: ReactNode;
  readonly supportingActions?: ReactNode;
  readonly details?: ReactNode;
}) {
  const [offscreen, setOffscreen] = useState(false);
  const { isCapacitor } = useCapacitor();
  const { spaces } = useLayout();

  const observeRow = useCallback((row: HTMLDivElement | null) => {
    if (!row || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1);
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
        className={styles["inlineActions"]}
      >
        <CollectDetailHasPrimaryAction.Provider value={Boolean(primaryAction)}>
          <div data-collect-action-group className={styles["actionGroup"]}>
            <div data-collect-main-actions className={styles["mainActions"]}>
              {primaryAction}
              {children}
            </div>
            <CollectDetailFooter>{supportingActions}</CollectDetailFooter>
          </div>
        </CollectDetailHasPrimaryAction.Provider>
        {details}
      </div>
      {typeof document !== "undefined" &&
        createPortal(
          <div
            data-collect-sticky-actions
            data-testid="collect-sticky-actions"
            aria-hidden={!offscreen}
            inert={!offscreen}
            style={{ bottom: isCapacitor ? spaces.mobileNavSpace || 104 : 0 }}
            className={`tailwind-scope ${styles["stickyActions"] ?? ""} tw-fixed tw-inset-x-0 tw-z-40 tw-grid tw-auto-cols-fr tw-grid-flow-col tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-[#0D0D0F] tw-px-4 tw-pb-[calc(10px+env(safe-area-inset-bottom))] tw-pt-2.5 tw-transition-[transform,opacity,visibility] tw-duration-150 motion-reduce:tw-transition-none lg:tw-hidden [&>button[type=button]:enabled:active]:tw-bg-iron-950 [&>button[type=button]:enabled:hover:not(:active)]:desktop-hover:tw-bg-iron-900 [&>button[type=button]:enabled:hover]:desktop-hover:tw-border-iron-650 [&>button[type=button]:enabled:hover]:desktop-hover:tw-text-white [&>button[type=button]]:tw-border-iron-700 [&>button[type=button]]:tw-bg-transparent [&>button[type=button]]:tw-text-iron-100 [&>button[type=button]]:tw-shadow-none [&>button]:tw-min-w-0 ${offscreen ? "tw-visible tw-translate-y-0 tw-opacity-100" : "tw-invisible tw-translate-y-2 tw-opacity-0"}`}
          >
            {primaryAction}
            {offerAction}
          </div>,
          document.body
        )}
    </>
  );
}
