"use client";

import IconButton from "@/components/utils/button/IconButton";

import type { CompactMenuItem } from "@/components/compact-menu";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { CheckIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Fragment, useState, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";

export const COMPACT_WAVE_ACTION_CLASSES =
  "tw-flex tw-min-h-12 tw-w-full tw-select-none tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-text-base tw-font-semibold tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 active:tw-bg-iron-800 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

const PRIMARY_ACTIONS = ["wave-details", "search-messages", "wave-link"];
const ADMIN_ACTIONS = ["create-subwave"];
const HELP_ACTIONS = ["submission-help", "submit-work", "display-time-zone"];

function getPhoneActionGroups(items: readonly CompactMenuItem[]) {
  const ordered = (ids: readonly string[]) =>
    ids.flatMap((id) => items.filter((item) => item.id === id));
  const knownIds = new Set([
    ...PRIMARY_ACTIONS,
    ...HELP_ACTIONS,
    ...ADMIN_ACTIONS,
  ]);
  return [
    { id: "primary", items: ordered(PRIMARY_ACTIONS) },
    {
      id: "help",
      items: [
        ...ordered(HELP_ACTIONS),
        ...items.filter((item) => !knownIds.has(item.id)),
      ],
    },
    { id: "admin", items: ordered(ADMIN_ACTIONS) },
  ];
}

export default function CompactWaveActions({
  items,
  triggerRef,
  compactTrigger = false,
  phone = false,
  renderAdditionalControls,
}: {
  readonly items: readonly CompactMenuItem[];
  readonly triggerRef?: Ref<HTMLButtonElement> | undefined;
  readonly compactTrigger?: boolean | undefined;
  readonly phone?: boolean | undefined;
  readonly renderAdditionalControls?:
    | ((select: (action: () => void) => void) => ReactNode)
    | undefined;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const toolbarLayout = compactTrigger ? "toolbar-compact" : "toolbar";

  const selectAfterClose = (action: () => void) => {
    setPendingAction(() => action);
    setIsOpen(false);
  };
  const additionalControls = renderAdditionalControls?.(selectAfterClose);

  const groups = (
    phone ? getPhoneActionGroups(items) : [{ id: "help", items }]
  ).filter(
    (group) =>
      group.items.length > 0 ||
      (group.id === "help" && Boolean(additionalControls))
  );

  const handleAction = (
    item: Exclude<CompactMenuItem, { readonly kind: "section" }>
  ) => {
    if (item.disabled) {
      return;
    }

    setIsOpen(false);
    if (item.deferUntilClosed) {
      setPendingAction(() => item.onSelect ?? null);
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
              setPendingAction(null);
              pendingAction?.();
            }}
          >
            {groups.map((group, index) => (
              <Fragment key={group.id}>
                {index > 0 && (
                  <li
                    role="separator"
                    className="tw-mx-4 tw-my-1 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-800"
                  />
                )}
                {group.id === "help" && Boolean(additionalControls) && (
                  <li className="empty:tw-hidden">{additionalControls}</li>
                )}
                {group.items.map((item) => {
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
                      {item.checked && (
                        <CheckIcon
                          aria-hidden="true"
                          className="tw-size-5 tw-shrink-0 tw-text-primary-300"
                        />
                      )}
                    </>
                  );
                  const className = `${COMPACT_WAVE_ACTION_CLASSES} ${stateClasses} ${item.className ?? ""}`;

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
                          aria-pressed={item.checked}
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
              </Fragment>
            ))}
          </CommonDropdownItemsMobileWrapper>,
          document.body
        );

  return (
    <>
      <IconButton
        type="button"
        ref={triggerRef}
        aria-label="More wave actions"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        data-compact-wave-actions-trigger="true"
        onClick={() => setIsOpen(true)}
        size={phone ? 44 : undefined}
        layout={phone ? undefined : toolbarLayout}
      >
        <EllipsisVerticalIcon className="tw-size-5 tw-flex-shrink-0" />
      </IconButton>
      {sheet}
    </>
  );
}
