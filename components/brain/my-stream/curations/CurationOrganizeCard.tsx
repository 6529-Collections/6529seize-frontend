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
      className={`tailwind-scope tw-relative tw-min-w-0 tw-rounded-xl ${selected ? "tw-ring-1 tw-ring-white/20" : ""} ${isDragging ? "tw-opacity-40" : ""}`}
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
          className={`tw-group tw-absolute tw-right-0.5 tw-top-0.5 tw-z-[1001] tw-flex tw-size-11 tw-touch-none tw-select-none tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-outline-none tw-transition-colors tw-duration-150 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 disabled:tw-cursor-wait ${selected ? "tw-text-white" : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-100"} ${isDragging ? "tw-cursor-grabbing" : "tw-cursor-grab"}`}
        >
          <span className="tw-flex tw-h-7 tw-w-8 tw-items-center tw-justify-center tw-rounded-[7px] tw-bg-black/20 tw-bg-gradient-to-b tw-from-white/[0.11] tw-to-white/[0.035] tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_2px_10px_rgba(0,0,0,0.24)] tw-ring-1 tw-ring-inset tw-ring-white/[0.12] tw-backdrop-blur-md tw-transition tw-duration-150 group-active:tw-scale-95 desktop-hover:group-hover:tw-from-white/[0.15] desktop-hover:group-hover:tw-to-white/[0.06] desktop-hover:group-hover:tw-ring-white/20 motion-reduce:tw-transform-none motion-reduce:tw-transition-none">
            <svg
              aria-hidden="true"
              width="22"
              height="16"
              viewBox="0 0 22 16"
              fill="none"
            >
              <path
                d="M3 5h16M3 11h16"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </span>
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
