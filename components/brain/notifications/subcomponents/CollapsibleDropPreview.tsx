"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const TOP_HEIGHT_PX = 180;
const BOTTOM_HEIGHT_PX = 160;

const EXPAND_FADE_PX = 40;
const EXPAND_SOLID_PX = 40;
const EXPAND_SECTION_HEIGHT_PX =
  EXPAND_FADE_PX + EXPAND_SOLID_PX + EXPAND_FADE_PX;

const EXPAND_ANIMATION_MS = 250;

const COLLAPSED_TOTAL_PX = TOP_HEIGHT_PX + BOTTOM_HEIGHT_PX;

interface CollapsibleDropPreviewProps {
  readonly children: React.ReactElement;
}

export default function CollapsibleDropPreview({
  children,
}: CollapsibleDropPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const bottomSliceContentRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  const [hostWidth, setHostWidth] = useState<number>(0);
  const [hasMeasured, setHasMeasured] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const [bottomSliceHeight, setBottomSliceHeight] = useState(0);

  const [isExpanded, setIsExpanded] = useState(false);
  const [animateMaxHeight, setAnimateMaxHeight] = useState<number | null>(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const isOverflowing = useMemo(() => {
    if (!hasMeasured) return false;
    return measuredHeight > COLLAPSED_TOTAL_PX;
  }, [hasMeasured, measuredHeight]);

  // 1) Track the actual rendered width of the host container
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const apply = () => {
      const w = Math.max(el.getBoundingClientRect().width, 0);
      if (w > 0) setHostWidth(w);
    };

    apply();

    const ro = new ResizeObserver(() => apply());
    ro.observe(el);

    const raf = requestAnimationFrame(apply);
    const t = setTimeout(apply, 150);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  // 2) Measure full height in a fixed-position, invisible box with exact width
  const measureNow = useCallback(() => {
    const el = measureRef.current;
    if (!el) return;

    // Use max of scroll/offset/rect — different layouts behave differently
    const rectH = el.getBoundingClientRect().height;
    const h = Math.max(el.scrollHeight, el.offsetHeight, rectH, 0);

    if (h > 0) {
      setMeasuredHeight(h);
      setHasMeasured(true);
    }
  }, []);

  useLayoutEffect(() => {
    if (hasMeasured) return;
    measureNow();
  }, [hasMeasured, measureNow]);

  useEffect(() => {
    if (hostWidth <= 0) return;

    measureNow();

    const el = measureRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => measureNow());
    ro.observe(el);

    const raf = requestAnimationFrame(measureNow);
    const t = setTimeout(measureNow, 150);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [hostWidth, measureNow]);

  const onExpand = useCallback(() => {
    if (!prefersReducedMotion) {
      setAnimateMaxHeight(COLLAPSED_TOTAL_PX);
    }
    setIsExpanded(true);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!isExpanded) return;
    if (measuredHeight <= 0) return;

    if (prefersReducedMotion) {
      setAnimateMaxHeight(measuredHeight);
      expandedRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateMaxHeight(measuredHeight));
    });

    const t = setTimeout(() => {
      expandedRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, EXPAND_ANIMATION_MS);

    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [isExpanded, measuredHeight, prefersReducedMotion]);

  const measureBottomSlice = useCallback(() => {
    const el = bottomSliceContentRef.current;
    if (!el) return;
    const h = Math.max(
      el.scrollHeight,
      el.offsetHeight,
      el.getBoundingClientRect().height,
      0
    );
    if (h > 0) setBottomSliceHeight(h);
  }, []);

  useLayoutEffect(() => {
    if (!hasMeasured || !isOverflowing) return;
    measureBottomSlice();
    const el = bottomSliceContentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measureBottomSlice);
    ro.observe(el);
    const raf = requestAnimationFrame(measureBottomSlice);
    const t = setTimeout(measureBottomSlice, 150);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [hasMeasured, isOverflowing, measureBottomSlice]);

  if (hasMeasured && !isOverflowing) {
    return (
      <div ref={hostRef} className="tw-w-full tw-min-w-0">
        {children}
      </div>
    );
  }

  // Expanded render
  if (hasMeasured && isOverflowing && isExpanded) {
    const maxH = animateMaxHeight ?? measuredHeight;

    return (
      <div ref={hostRef} className="tw-relative tw-w-full tw-min-w-0">
        {hostWidth > 0 && (
          <div
            className="tw-pointer-events-none tw-fixed tw-left-[-100000px] tw-top-0 tw-opacity-0"
            style={{ width: hostWidth }}
            aria-hidden
            inert
          >
            <div ref={measureRef} className="tw-w-full tw-min-w-0" inert>
              {children}
            </div>
          </div>
        )}

        <div
          ref={expandedRef}
          className="tw-w-full tw-min-w-0 tw-overflow-y-hidden tw-overflow-x-visible"
          style={{
            maxHeight: maxH,
            transition: prefersReducedMotion
              ? "none"
              : `max-height ${EXPAND_ANIMATION_MS}ms ease-out`,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  const bottomContentHeight =
    bottomSliceHeight > 0 ? bottomSliceHeight : measuredHeight;
  const minBottomOffset = TOP_HEIGHT_PX + EXPAND_SECTION_HEIGHT_PX;
  const bottomOffset = Math.max(
    bottomContentHeight - BOTTOM_HEIGHT_PX,
    minBottomOffset
  );

  return (
    <div ref={hostRef} className="tw-relative tw-w-full tw-min-w-0">
      {hostWidth > 0 && hasMeasured && (
        <div
          className="tw-pointer-events-none tw-fixed tw-left-[-100000px] tw-top-0 tw-opacity-0"
          style={{ width: hostWidth }}
          aria-hidden
          inert
        >
          <div ref={measureRef} className="tw-w-full tw-min-w-0" inert>
            {children}
          </div>
        </div>
      )}

      {hasMeasured ? (
        <div className="tw-relative tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-flex-nowrap">
          <div
            className="tw-relative tw-z-0 tw-flex-shrink-0 tw-overflow-hidden"
            style={{
              height: TOP_HEIGHT_PX,
              minHeight: TOP_HEIGHT_PX,
              maxHeight: TOP_HEIGHT_PX,
            }}
          >
            <div className="tw-h-full tw-w-full tw-overflow-hidden">
              {React.cloneElement(children, { key: "drop-top" })}
            </div>
          </div>

          <div
            className="tw-relative tw-z-0 tw-flex-shrink-0 tw-overflow-hidden"
            style={{
              height: BOTTOM_HEIGHT_PX,
              minHeight: BOTTOM_HEIGHT_PX,
              maxHeight: BOTTOM_HEIGHT_PX,
            }}
          >
            <div
              ref={bottomSliceContentRef}
              style={{ transform: `translateY(-${bottomOffset}px)` }}
              className="tw-w-full"
            >
              {React.cloneElement(children, { key: "drop-bottom" })}
            </div>

            <div
              className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-h-4 tw-w-full"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(19, 19, 22,0.35) 0%, transparent 100%)",
              }}
              aria-hidden
            />
          </div>

          <div
            className="tw-absolute tw-z-10 tw-overflow-hidden"
            style={{
              top: TOP_HEIGHT_PX - EXPAND_FADE_PX,
              left: "calc(50% - 50vw)",
              width: "100vw",
              height: EXPAND_SECTION_HEIGHT_PX,
            }}
          >
            <div
              className="tw-absolute tw-inset-0 tw-z-0 tw-w-full tw-overflow-hidden"
              aria-hidden
              style={{ transform: `translateY(-${TOP_HEIGHT_PX}px)` }}
            >
              {React.cloneElement(children, { key: "drop-expand-underlay" })}
            </div>
            <div
              className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-z-[1]"
              style={{
                height: EXPAND_FADE_PX,
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(19, 19, 22,0.3) 30%, rgb(19 19 22) 100%)",
              }}
              aria-hidden
            />
            <div
              className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0 tw-z-[1]"
              style={{
                top: EXPAND_FADE_PX,
                height: EXPAND_SOLID_PX,
                background: "rgb(19 19 22)",
              }}
              aria-hidden
            />
            <div
              className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-z-[1]"
              style={{
                height: EXPAND_FADE_PX,
                background:
                  "linear-gradient(to top, transparent 0%, rgba(19, 19, 22,0.3) 30%, rgb(19 19 22) 100%)",
              }}
              aria-hidden
            />
            <button
              type="button"
              onClick={onExpand}
              className="tw-group tw-relative tw-z-[2] tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-flex-row tw-items-center tw-justify-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-text-center tw-outline-none tw-transition-colors tw-duration-200 focus:tw-outline-none"
              style={{ minHeight: EXPAND_SECTION_HEIGHT_PX }}
              aria-label="Expand drop"
            >
              <span className="tw-flex tw-flex-shrink-0 tw-flex-col tw-items-center tw-justify-center tw-gap-0">
                <span className="tw-flex tw-transition-transform tw-duration-200 group-hover:tw-translate-y-[-2px]">
                  <ChevronUpIcon className="tw-h-4 tw-w-4 tw-text-iron-400 tw-transition-colors tw-duration-200 group-hover:tw-text-white" />
                </span>
                <span className="tw-flex tw-transition-transform tw-duration-200 group-hover:tw-translate-y-[2px]">
                  <ChevronDownIcon className="tw-h-4 tw-w-4 tw-text-iron-400 tw-transition-colors tw-duration-200 group-hover:tw-text-white" />
                </span>
              </span>
              <span className="tw-flex tw-flex-shrink-0 tw-items-center tw-text-sm tw-font-medium tw-leading-none tw-text-iron-300 tw-transition-colors tw-duration-200 group-hover:tw-text-white">
                expand
              </span>
              <span className="tw-flex tw-flex-shrink-0 tw-flex-col tw-items-center tw-justify-center tw-gap-0">
                <span className="tw-flex tw-transition-transform tw-duration-200 group-hover:tw-translate-y-[-2px]">
                  <ChevronUpIcon className="tw-h-4 tw-w-4 tw-text-iron-400 tw-transition-colors tw-duration-200 group-hover:tw-text-white" />
                </span>
                <span className="tw-flex tw-transition-transform tw-duration-200 group-hover:tw-translate-y-[2px]">
                  <ChevronDownIcon className="tw-h-4 tw-w-4 tw-text-iron-400 tw-transition-colors tw-duration-200 group-hover:tw-text-white" />
                </span>
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={measureRef}
          className="tw-pointer-events-none tw-w-full tw-min-w-0 tw-opacity-0"
          style={{ minHeight: COLLAPSED_TOTAL_PX }}
          aria-hidden
          inert
        >
          {children}
        </div>
      )}
    </div>
  );
}
