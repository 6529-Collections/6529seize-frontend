"use client";

import { useId, useRef, type ReactNode } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { UserMinusIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "react-tooltip";
import clsx from "clsx";
import Button from "@/components/utils/button/Button";
import type { ButtonSize } from "@/components/utils/button/buttonStyles";
import { DEFAULT_MENU_CLASSES } from "@/components/compact-menu/constants";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useAndroidBackLayer } from "@/hooks/useAndroidBackLayer";

export default function UserFollowingMenu({
  children,
  size,
  className,
  busy,
  status,
  unfollowLabel,
  insideHoverCard,
  onUnfollow,
}: {
  readonly children: ReactNode;
  readonly size: ButtonSize;
  readonly className?: string | undefined;
  readonly busy: boolean;
  readonly status?: string | undefined;
  readonly unfollowLabel: string;
  readonly insideHoverCard: boolean;
  readonly onUnfollow: () => void;
}) {
  const tooltipId = useId();
  const statusDescriptionId = `${tooltipId}-description`;

  return (
    <Menu as="div" className="tw-relative tw-shrink-0">
      {({ open, close }) => (
        <>
          <MenuButton
            as={Button}
            variant="secondary"
            size={size}
            className={className}
            disabled={busy}
            aria-busy={busy || undefined}
            aria-describedby={status ? statusDescriptionId : undefined}
            data-tooltip-id={tooltipId}
          >
            {children}
          </MenuButton>
          {status && (
            <span id={statusDescriptionId} className="tw-sr-only">
              {status}
            </span>
          )}
          {status && (
            <Tooltip
              id={tooltipId}
              hidden={open}
              place={insideHoverCard ? "bottom" : "top"}
              positionStrategy="fixed"
              openEvents={{ mouseenter: true, focus: true }}
              closeEvents={{ mouseleave: true, blur: true }}
              globalCloseEvents={{ escape: true, clickOutsideAnchor: true }}
              clickable
              delayShow={250}
              delayHide={150}
              opacity={1}
              style={TOOLTIP_STYLES}
            >
              <span className="tw-text-xs">{status}</span>
            </Tooltip>
          )}
          <FollowMenuPanel
            open={open}
            insideHoverCard={insideHoverCard}
            status={status}
            unfollowLabel={unfollowLabel}
            close={close}
            onUnfollow={onUnfollow}
          />
        </>
      )}
    </Menu>
  );
}

function FollowMenuPanel({
  open,
  insideHoverCard,
  status,
  unfollowLabel,
  close,
  onUnfollow,
}: {
  readonly open: boolean;
  readonly insideHoverCard: boolean;
  readonly status?: string | undefined;
  readonly unfollowLabel: string;
  readonly close: () => void;
  readonly onUnfollow: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const statusId = useId();
  useAndroidBackLayer(open, panelRef, close);

  return (
    <MenuItems
      ref={panelRef}
      modal={false}
      anchor={insideHoverCard ? false : { to: "bottom end", padding: 8 }}
      aria-describedby={status ? statusId : undefined}
      className={clsx(
        "tailwind-scope tw-w-max tw-min-w-36 tw-max-w-[calc(100vw-2rem)]",
        DEFAULT_MENU_CLASSES,
        insideHoverCard && "tw-absolute tw-right-0 tw-top-full tw-max-w-56"
      )}
    >
      {status && (
        <div
          id={statusId}
          className="tw-mb-1 tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-px-3 tw-py-2 tw-text-xs tw-text-iron-400"
        >
          {status}
        </div>
      )}
      <MenuItem
        as="button"
        type="button"
        className="tw-flex tw-min-h-10 tw-w-full tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-text-iron-100 data-[focus]:tw-bg-iron-800 data-[focus]:tw-outline data-[focus]:tw-outline-2 data-[focus]:-tw-outline-offset-2 data-[focus]:tw-outline-primary-400"
        onClick={onUnfollow}
      >
        <UserMinusIcon aria-hidden="true" className="tw-size-4 tw-shrink-0" />
        {unfollowLabel}
      </MenuItem>
    </MenuItems>
  );
}
