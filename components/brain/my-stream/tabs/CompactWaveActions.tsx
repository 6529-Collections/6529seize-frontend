"use client";

import type { CompactMenuItem } from "@/components/compact-menu";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";

const COMPACT_ACTION_CLASSES =
  "tw-flex tw-min-h-12 tw-w-full tw-select-none tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-text-base tw-font-semibold tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 active:tw-bg-iron-800 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

export default function CompactWaveActions({
  items,
}: {
  readonly items: readonly CompactMenuItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (
    item: Exclude<CompactMenuItem, { readonly kind: "section" }>
  ) => {
    if (item.disabled) {
      return;
    }

    setIsOpen(false);
    item.onSelect?.();
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
        aria-label="More wave actions"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        data-compact-wave-actions-trigger="true"
        onClick={() => setIsOpen(true)}
        className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-white/[0.05] tw-text-iron-200 tw-transition-colors tw-duration-150 hover:tw-border-white/10 hover:tw-bg-white/[0.08] hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
      >
        <EllipsisVerticalIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
      </button>
      {sheet}
    </>
  );
}
