"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SLICE_HEIGHT_PX = 140;
const TOP_HEIGHT_PX = SLICE_HEIGHT_PX;
const BOTTOM_HEIGHT_PX = SLICE_HEIGHT_PX;

const EXPAND_FADE_PX = 30;
const EXPAND_SOLID_PX = 40;
const EXPAND_SECTION_HEIGHT_PX =
  EXPAND_FADE_PX + EXPAND_SOLID_PX + EXPAND_FADE_PX;

const EXPAND_ANIMATION_MS = 250;

const COLLAPSED_TOTAL_PX =
  TOP_HEIGHT_PX + EXPAND_SECTION_HEIGHT_PX + BOTTOM_HEIGHT_PX;

interface CollapsibleDropPreviewProps {
  readonly children: React.ReactElement;
}

export default function CollapsibleDropPreview({
  children,
}: CollapsibleDropPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  const [hostWidth, setHostWidth] = useState<number>(0);
  const [hasMeasured, setHasMeasured] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  const [isExpanded, setIsExpanded] = useState(false);
  const [animateMaxHeight, setAnimateMaxHeight] = useState<number | null>(null);

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
    setAnimateMaxHeight(COLLAPSED_TOTAL_PX);
    setIsExpanded(true);
  }, []);

  useEffect(() => {
    if (!isExpanded) return;
    if (measuredHeight <= 0) return;

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateMaxHeight(measuredHeight));
    });

    const t = setTimeout(() => {
      expandedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, EXPAND_ANIMATION_MS);

    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [isExpanded, measuredHeight]);

  // When it fits: render normally
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
        {/* Fixed measurer (still needed for dynamic content changes) */}
        {hostWidth > 0 && (
          <div
            className="tw-pointer-events-none tw-fixed tw-left-[-100000px] tw-top-0 tw-opacity-0"
            style={{ width: hostWidth }}
            aria-hidden
          >
            <div ref={measureRef} className="tw-w-full tw-min-w-0">
              {children}
            </div>
          </div>
        )}

        <div
          ref={expandedRef}
          className="tw-w-full tw-min-w-0 tw-overflow-y-hidden tw-overflow-x-visible"
          style={{
            maxHeight: maxH,
            transition: `max-height ${EXPAND_ANIMATION_MS}ms ease-out`,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  // Collapsed preview
  const bottomOffset = Math.max(measuredHeight - BOTTOM_HEIGHT_PX, 0);

  return (
    <div ref={hostRef} className="tw-relative tw-w-full tw-min-w-0">
      {/* Fixed-position measurer with exact width to match wrapping */}
      {hostWidth > 0 && (
        <div
          className="tw-pointer-events-none tw-fixed tw-left-[-100000px] tw-top-0 tw-opacity-0"
          style={{ width: hostWidth }}
          aria-hidden
        >
          <div ref={measureRef} className="tw-w-full tw-min-w-0">
            {children}
          </div>
        </div>
      )}

      {!hasMeasured ? (
        <div
          className="tw-w-full tw-min-w-0"
          style={{ minHeight: COLLAPSED_TOTAL_PX }}
        />
      ) : (
        <div className="tw-w-full tw-min-w-0 tw-flex tw-flex-col">
          {/* TOP SLICE */}
          <div
            className="tw-w-full tw-overflow-hidden"
            style={{ height: TOP_HEIGHT_PX }}
          >
            {React.cloneElement(children, { key: "drop-top" })}
          </div>

          {/* EXPAND SECTION (underlay + fade/solid/fade) */}
          <div
            className="tw-relative tw-w-full tw-overflow-hidden"
            style={{ height: EXPAND_SECTION_HEIGHT_PX }}
          >
            {/* Underlay continuation after top slice */}
            <div
              className="tw-absolute tw-inset-0 tw-w-full"
              aria-hidden
              style={{ transform: `translateY(-${TOP_HEIGHT_PX}px)` }}
            >
              {React.cloneElement(children, { key: "drop-expand-underlay" })}
            </div>

            {/* Top fade */}
            <div
              className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0 tw-top-0"
              style={{
                height: EXPAND_FADE_PX,
                background:
                  "linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgb(10 10 10) 100%)",
              }}
              aria-hidden
            />

            {/* Middle solid */}
            <div
              className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0"
              style={{
                top: EXPAND_FADE_PX,
                height: EXPAND_SOLID_PX,
                background: "rgb(10 10 10)",
              }}
              aria-hidden
            />

            {/* Bottom fade */}
            <div
              className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0 tw-bottom-0"
              style={{
                height: EXPAND_FADE_PX,
                background:
                  "linear-gradient(to top, rgba(10,10,10,0) 0%, rgb(10 10 10) 100%)",
              }}
              aria-hidden
            />

            {/* Button */}
            <button
              type="button"
              onClick={onExpand}
              className="tw-group tw-relative tw-z-10 tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-flex-row tw-items-center tw-justify-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-text-center tw-outline-none focus:tw-outline-none tw-transition-colors tw-duration-200"
              style={{ minHeight: EXPAND_SECTION_HEIGHT_PX }}
              aria-label="Expand drop"
            >
              <span className="tw-flex tw-flex-shrink-0 tw-flex-col tw-items-center tw-justify-center tw-gap-0">
                <span className="tw-flex tw-transition-transform tw-duration-200 group-hover:tw-translate-y-[-2px]">
                  <ChevronUpIcon className="tw-h-4 tw-w-4 tw-text-iron-400 group-hover:tw-text-white tw-transition-colors tw-duration-200" />
                </span>
                <span className="tw-flex tw-transition-transform tw-duration-200 group-hover:tw-translate-y-[2px]">
                  <ChevronDownIcon className="tw-h-4 tw-w-4 tw-text-iron-400 group-hover:tw-text-white tw-transition-colors tw-duration-200" />
                </span>
              </span>

              <span className="tw-flex tw-flex-shrink-0 tw-items-center tw-text-sm tw-font-medium tw-leading-none tw-text-iron-300 group-hover:tw-text-white tw-transition-colors tw-duration-200">
                expand
              </span>

              <span className="tw-flex tw-flex-shrink-0 tw-flex-col tw-items-center tw-justify-center tw-gap-0">
                <span className="tw-flex tw-transition-transform tw-duration-200 group-hover:tw-translate-y-[-2px]">
                  <ChevronUpIcon className="tw-h-4 tw-w-4 tw-text-iron-400 group-hover:tw-text-white tw-transition-colors tw-duration-200" />
                </span>
                <span className="tw-flex tw-transition-transform tw-duration-200 group-hover:tw-translate-y-[2px]">
                  <ChevronDownIcon className="tw-h-4 tw-w-4 tw-text-iron-400 group-hover:tw-text-white tw-transition-colors tw-duration-200" />
                </span>
              </span>
            </button>
          </div>

          {/* BOTTOM SLICE */}
          <div
            className="tw-relative tw-w-full tw-overflow-hidden"
            style={{ height: BOTTOM_HEIGHT_PX }}
          >
            <div
              style={{ transform: `translateY(-${bottomOffset}px)` }}
              className="tw-w-full"
            >
              {React.cloneElement(children, { key: "drop-bottom" })}
            </div>

            <div
              className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-h-4 tw-w-full"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(10,10,10,0.35) 0%, transparent 100%)",
              }}
              aria-hidden
            />
          </div>
        </div>
      )}
    </div>
  );
}