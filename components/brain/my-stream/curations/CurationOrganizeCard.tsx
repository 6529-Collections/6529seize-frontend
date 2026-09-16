"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useCallback, useId, type ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import { useCurationOrganize } from "./CurationOrganize";

export default function CurationOrganizeCard({
  id,
  position,
  children,
}: {
  readonly id: string;
  readonly position: number;
  readonly children: ReactNode;
}) {
  const locale = useBrowserLocale();
  const contentId = useId();
  const {
    enabled,
    busy,
    selectedId,
    target,
    instructionsId,
    axis,
    select,
    keyDown,
  } = useCurationOrganize();
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    setActivatorNodeRef,
    isDragging,
  } = useDraggable({ id, disabled: !enabled || busy });
  const { setNodeRef: setDropRef } = useDroppable({
    id,
    disabled: !enabled || busy,
  });
  const setNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );
  const number = formatInteger(locale, position);
  const name = t(locale, "profileCuration.order.postNumber", { number });
  const selected = selectedId === id;
  const marker = target?.id === id ? target.placement : null;
  const horizontalSide = marker === "before" ? "-tw-left-2" : "-tw-right-2";
  const verticalSide = marker === "before" ? "-tw-top-2" : "-tw-bottom-2";
  const markerSide =
    axis === "horizontal"
      ? `${horizontalSide} tw-inset-y-0 tw-w-1`
      : `${verticalSide} tw-inset-x-0 tw-h-1`;

  return (
    <div
      ref={setNodeRef}
      className={`tailwind-scope tw-relative tw-min-w-0 tw-rounded-xl ${selected ? "tw-ring-1 tw-ring-iron-500" : ""} ${isDragging ? "tw-opacity-40" : ""}`}
    >
      {enabled && (
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          data-curation-order-handle={id}
          aria-label={t(locale, "profileCuration.order.handle", {
            postName: name,
          })}
          aria-describedby={`${contentId} ${instructionsId} ${instructionsId}-keyboard`}
          aria-pressed={selected}
          disabled={busy}
          onClick={() => select(id)}
          onKeyDown={(event) => keyDown(id, event)}
          className={`tw-absolute tw-right-2 tw-top-2 tw-z-[1001] tw-flex tw-size-11 tw-touch-none tw-select-none tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-p-0 tw-text-iron-100 tw-shadow-sm tw-outline-none tw-ring-1 tw-ring-inset tw-ring-white/10 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 disabled:tw-cursor-wait ${selected ? "tw-bg-iron-700" : "tw-bg-iron-800/90 desktop-hover:hover:tw-bg-iron-700"} ${isDragging ? "tw-cursor-grabbing" : "tw-cursor-grab"}`}
        >
          <svg
            aria-hidden="true"
            width="24"
            height="16"
            viewBox="0 0 24 16"
            fill="currentColor"
          >
            <circle cx="6" cy="5" r="1.5" />
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="18" cy="5" r="1.5" />
            <circle cx="6" cy="11" r="1.5" />
            <circle cx="12" cy="11" r="1.5" />
            <circle cx="18" cy="11" r="1.5" />
          </svg>
        </button>
      )}
      <div id={contentId} inert={enabled}>
        {children}
      </div>
      {marker && (
        <div
          aria-hidden="true"
          className={`tw-pointer-events-none tw-absolute tw-z-[1002] tw-rounded-full tw-bg-primary-300 ${markerSide}`}
        />
      )}
    </div>
  );
}
