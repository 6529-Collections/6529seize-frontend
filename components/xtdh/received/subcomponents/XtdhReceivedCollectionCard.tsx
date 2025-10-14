'use client';

import { useCallback, useLayoutEffect, useRef } from "react";
import clsx from "clsx";
import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import { XtdhReceivedCollectionCardContent } from "./XtdhReceivedCollectionCardContent";
import { XtdhReceivedCollectionCardHeader } from "./XtdhReceivedCollectionCardHeader";

export interface XtdhReceivedCollectionCardProps {
  readonly collection: XtdhReceivedCollectionSummary;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}

export function XtdhReceivedCollectionCard({
  collection,
  expanded,
  onToggle,
}: XtdhReceivedCollectionCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const previousTopRef = useRef<number | null>(null);
  const previousExpandedRef = useRef(expanded);
  const toggleMetricsRef = useRef<{
    viewportOffset: number;
    documentHeight: number;
    wasAtBottom: boolean;
  } | null>(null);

  const handleToggle = useCallback(() => {
    const node = cardRef.current;
    if (typeof window !== "undefined" && node) {
      const rect = node.getBoundingClientRect();
      const documentElement = document.documentElement;
      const documentHeight =
        documentElement?.scrollHeight ?? document.body?.scrollHeight ?? 0;
      const windowHeight = window.innerHeight || 0;
      const scrollY = window.scrollY ?? window.pageYOffset ?? 0;
      const distanceFromBottom = documentHeight - (scrollY + windowHeight);
      const wasAtBottom = Math.abs(distanceFromBottom) <= 2;

      toggleMetricsRef.current = {
        viewportOffset: rect.top,
        documentHeight,
        wasAtBottom,
      };
      previousTopRef.current = rect.top;
    } else {
      toggleMetricsRef.current = null;
    }

    onToggle();
  }, [onToggle]);

  useLayoutEffect(() => {
    const node = cardRef.current;
    if (!node || typeof window === "undefined") {
      previousTopRef.current = null;
      previousExpandedRef.current = expanded;
      toggleMetricsRef.current = null;
      return;
    }

    const rect = node.getBoundingClientRect();
    const metrics = toggleMetricsRef.current;

    if (metrics) {
      const delta = rect.top - metrics.viewportOffset;
      if (Math.abs(delta) > 1) {
        if (typeof window.scrollBy === "function") {
          window.scrollBy({ top: delta, left: 0, behavior: "auto" });
        } else {
          window.scrollTo(window.scrollX, window.scrollY + delta);
        }
      }

      if (metrics.wasAtBottom) {
        const updatedDocumentHeight =
          document.documentElement?.scrollHeight ??
          document.body?.scrollHeight ??
          metrics.documentHeight;
        const target = Math.max(
          updatedDocumentHeight - (window.innerHeight || 0),
          0,
        );
        window.scrollTo({ top: target, behavior: "auto" });
      }

      toggleMetricsRef.current = null;
    } else if (
      previousExpandedRef.current !== expanded &&
      previousTopRef.current !== null
    ) {
      const delta = rect.top - previousTopRef.current;
      if (Math.abs(delta) > 1) {
        if (typeof window.scrollBy === "function") {
          window.scrollBy({ top: delta, left: 0, behavior: "auto" });
        } else {
          window.scrollTo(window.scrollX, window.scrollY + delta);
        }
      }
    }

    previousTopRef.current = rect.top;
    previousExpandedRef.current = expanded;
  }, [expanded]);

  return (
    <article
      ref={cardRef}
      className={clsx(
        "tw-flex tw-h-full tw-flex-col tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-shadow-sm tw-transition tw-duration-200 tw-ease-out",
        expanded && "tw-border-primary-400/70 tw-shadow-lg tw-shadow-primary-900/40",
      )}
      role="listitem"
    >
      <XtdhReceivedCollectionCardHeader
        collection={collection}
        expanded={expanded}
        onToggle={handleToggle}
      />
      {expanded && (
        <XtdhReceivedCollectionCardContent
          collection={collection}
          onClose={handleToggle}
        />
      )}
    </article>
  );
}
