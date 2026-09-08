"use client";

import type { ReactElement } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const COMPACT_PX = 256;
const COMPACT_THRESHOLD_PX = COMPACT_PX * 1.5;

interface CompactDropPreviewProps {
  readonly children: ReactElement;
}

export default function CompactDropPreview({
  children,
}: CompactDropPreviewProps) {
  const locale = useBrowserLocale();
  const [isExpanded, setIsExpanded] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (measuredHeight !== null) return;
    const el = measureRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.height > 0) {
      setMeasuredHeight(rect.height);
    }
  }, [measuredHeight]);

  const shouldCompact =
    measuredHeight === null || measuredHeight > COMPACT_THRESHOLD_PX;
  const showMeasure = measuredHeight === null;
  const heightClassName = !shouldCompact || isExpanded ? "" : "tw-h-64";
  const overflowClassName =
    isExpanded || !shouldCompact ? "tw-overflow-visible" : "tw-overflow-hidden";
  const rootClassName = `tw-relative tw-w-full tw-min-w-0 tw-max-w-full ${heightClassName} ${overflowClassName}`;

  return (
    <div className={rootClassName}>
      {showMeasure ? (
        <div
          ref={measureRef}
          className="tw-pointer-events-none tw-absolute tw-left-0 tw-top-0 tw-w-full tw-opacity-0"
          aria-hidden
          inert
        >
          {children}
        </div>
      ) : null}

      {children}

      {!isExpanded && shouldCompact ? (
        <>
          <div
            className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-14 tw-bg-gradient-to-b tw-from-transparent tw-to-iron-950"
            aria-hidden="true"
          />
          <Button
            variant="tertiary"
            size="xs"
            className="tw-absolute tw-bottom-2 tw-right-2 tw-z-10"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded(true)}
          >
            {t(locale, "notifications.preview.expand")}
          </Button>
        </>
      ) : null}
    </div>
  );
}
