"use client";

import Button from "@/components/utils/button/Button";
import { MOBILE_BOTTOM_NAV_DOCK_MEASUREMENT_WINDOW_MS } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useMeasuredMobileBottomNavDockBottom } from "@/hooks/useMeasuredMobileBottomNavDockBottom";
import { t } from "@/i18n/messages";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { marketAmount } from "./market.adapters";
import { MARKET_ZERO } from "./market-validation";
import {
  collectSelectionTotal,
  type CollectSelectedListing,
} from "./collect-selection.helpers";

export default function CollectSelectionBar({
  items,
  onReview,
  onClear,
  onPlanOffers,
  planOffersRef,
  active = true,
}: {
  readonly items: readonly CollectSelectedListing[];
  readonly onReview: () => void;
  readonly onClear: () => void;
  readonly onPlanOffers?: (() => void) | undefined;
  readonly planOffersRef?: Ref<HTMLButtonElement> | undefined;
  readonly active?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  const visible = active && items.length > 0;
  // Stay inside the app's modal inert boundary, but outside its scrolling and
  // transformed content. A sibling portal directly under body escapes that boundary.
  const setAnchor = useCallback((node: HTMLDivElement | null) => {
    anchorRef.current = node;
    setPortalTarget(node?.closest("body > *") ?? null);
  }, []);
  const frameRef = useMeasuredMobileBottomNavDockBottom({
    enabled: visible && Boolean(portalTarget),
    fallbackBottom:
      "calc(max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px)) + 1rem)",
    measurementWindowMs: MOBILE_BOTTOM_NAV_DOCK_MEASUREMENT_WINDOW_MS,
    dockGapPx: 12,
    watchForDockRoot: true,
  });

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const frame = frameRef.current;
    if (!anchor || !frame || !portalTarget) return;
    const measure = () => {
      const rect = anchor.getBoundingClientRect();
      const left = Math.max(12, rect.left);
      frame.style.left = `${left}px`;
      frame.style.width = `${Math.max(0, Math.min(rect.width, globalThis.innerWidth - left - 12))}px`;
      // Reserve the actual wrapped height so the final listing remains reachable.
      anchor.style.height = `${frame.getBoundingClientRect().height + 16}px`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(anchor);
    observer.observe(frame);
    globalThis.addEventListener("resize", measure);
    globalThis.addEventListener("scroll", measure, true);
    return () => {
      observer.disconnect();
      globalThis.removeEventListener("resize", measure);
      globalThis.removeEventListener("scroll", measure, true);
      anchor.style.height = "";
    };
  }, [frameRef, portalTarget, visible]);

  if (!visible) return null;
  const total = collectSelectionTotal(items);
  return (
    <>
      <div aria-hidden="true" ref={setAnchor} />
      {portalTarget &&
        createPortal(
          <div
            ref={frameRef}
            className="tailwind-scope tw-pointer-events-none tw-fixed tw-z-20"
          >
            <section
              aria-label={t(locale, "collect.selection.title")}
              className="tw-pointer-events-auto tw-mx-auto tw-flex tw-max-w-3xl tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/15 tw-bg-iron-950 tw-p-4 tw-shadow-xl"
            >
              <div aria-live="polite">
                <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
                  {t(locale, "collect.selection.count", {
                    count: items.length,
                  })}
                </p>
                {total !== null && (
                  <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
                    {t(locale, "collect.selection.estimate", {
                      price: marketAmount(total, MARKET_ZERO),
                    })}
                  </p>
                )}
              </div>
              <div className="tw-flex tw-flex-wrap tw-gap-2">
                <Button variant="secondary" size="sm" onClick={onClear}>
                  {t(locale, "collect.selection.clear")}
                </Button>
                {onPlanOffers && (
                  <Button
                    ref={planOffersRef}
                    variant="secondary"
                    size="sm"
                    onClick={onPlanOffers}
                  >
                    {t(locale, "collect.offerWorkspace.plan")}
                  </Button>
                )}
                <Button
                  variant="action"
                  size="sm"
                  disabled={total === null}
                  onClick={onReview}
                >
                  {t(locale, "collect.selection.review")}
                </Button>
              </div>
            </section>
          </div>,
          portalTarget
        )}
    </>
  );
}
