"use client";

import type { CompactMenuItem } from "@/components/compact-menu";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRef, useState, type Ref } from "react";
import { createPortal } from "react-dom";
import {
  WAVE_HEADER_ACTION_CLASSES,
  WAVE_HEADER_ACTION_SURFACE_CLASSES,
  WAVE_HEADER_COMPACT_ACTION_CLASSES,
  WAVE_HEADER_COMPACT_ACTION_SURFACE_CLASSES,
} from "@/components/brain/left-sidebar/waves/WaveHeaderActions";

const COMPACT_ACTION_CLASSES =
  "tw-flex tw-min-h-12 tw-w-full tw-select-none tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-text-base tw-font-semibold tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 active:tw-bg-iron-800 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

export default function CompactWaveActions({
  items,
  triggerRef,
  compactTrigger = false,
}: {
  readonly items: readonly CompactMenuItem[];
  readonly triggerRef?: Ref<HTMLButtonElement> | undefined;
  readonly compactTrigger?: boolean | undefined;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const handleAction = (
    item: Exclude<CompactMenuItem, { readonly kind: "section" }>
  ) => {
    if (item.disabled) {
      return;
    }

    setIsOpen(false);
    if (item.deferUntilClosed) {
      pendingActionRef.current = item.onSelect ?? null;
    } else {
      item.onSelect?.();
    }
  };

  const sheet =
    typeof document === "undefined"
      ? null
      : createPortal(
          <CommonDropdownItemsMobileWrapper
            isOpen={isOpen}
            setOpen={setIsOpen}
            label="More wave actions"
            hideOnDesktopHover={false}
            onAfterLeave={() => {
              const action = pendingActionRef.current;
              pendingActionRef.current = null;
              action?.();
            }}
          >
            {items.map((item) => {
              if (item.kind === "section") {
                return (
                  <li
                    key={item.id}
                    className={`tw-list-none tw-px-4 tw-pb-1 tw-pt-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wider tw-text-iron-500 ${item.className ?? ""}`}
                  >
                    {item.label}
                  </li>
                );
              }

              const stateClasses = item.active
                ? "tw-text-primary-300"
                : "tw-text-iron-300";
              const contents = (
                <>
                  {item.icon !== undefined &&
                    item.icon !== null &&
                    item.icon !== false && (
                      <span className="tw-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center">
                        {item.icon}
                      </span>
                    )}
                  <span className="tw-flex-1">{item.label}</span>
                </>
              );
              const className = `${COMPACT_ACTION_CLASSES} ${stateClasses} ${item.className ?? ""}`;

              return (
                <li key={item.id} className="tw-list-none">
                  {item.href !== undefined && !item.disabled ? (
                    <Link
                      href={item.href}
                      role={item.role}
                      aria-selected={item.ariaSelected}
                      aria-label={item.ariaLabel}
                      data-compact-menu-item="true"
                      data-menu-item-id={item.id}
                      data-active={item.active ? "true" : "false"}
                      data-disabled="false"
                      data-testid={item["data-testid"]}
                      onClick={() => handleAction(item)}
                      className={className}
                    >
                      {contents}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      role={item.role}
                      aria-selected={item.ariaSelected}
                      aria-label={item.ariaLabel}
                      disabled={item.disabled}
                      data-compact-menu-item="true"
                      data-menu-item-id={item.id}
                      data-active={item.active ? "true" : "false"}
                      data-disabled={item.disabled ? "true" : "false"}
                      data-testid={item["data-testid"]}
                      onClick={() => handleAction(item)}
                      className={className}
                    >
                      {contents}
                    </button>
                  )}
                </li>
              );
            })}
          </CommonDropdownItemsMobileWrapper>,
          document.body
        );

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        aria-label="More wave actions"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        data-compact-wave-actions-trigger="true"
        onClick={() => setIsOpen(true)}
        className={
          compactTrigger
            ? WAVE_HEADER_COMPACT_ACTION_CLASSES
            : WAVE_HEADER_ACTION_CLASSES
        }
      >
        <span
          className={
            compactTrigger
              ? WAVE_HEADER_COMPACT_ACTION_SURFACE_CLASSES
              : WAVE_HEADER_ACTION_SURFACE_CLASSES
          }
        >
          <EllipsisVerticalIcon className="tw-size-5 tw-flex-shrink-0" />
        </span>
      </button>
      {sheet}
    </>
  );
}
