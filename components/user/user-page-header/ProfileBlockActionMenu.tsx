"use client";

import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import CompactMenuMobileBottomSheet from "@/components/compact-menu/CompactMenuMobileBottomSheet";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useProfileMute from "@/hooks/useProfileMute";
import { t } from "@/i18n/messages";
import { faBell, faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  MinusCircleIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";

const TRIGGER_CLASS_NAME =
  "tw-flex tw-size-9 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-p-0 tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-iron-100 md:tw-size-10";

export default function ProfileBlockActionMenu({
  handle,
  disabled,
  moderationAction,
  onBlock,
  showPersonalActions = true,
}: {
  readonly handle: string;
  readonly disabled: boolean;
  readonly moderationAction?:
    | {
        readonly kind: "suspend" | "reinstate";
        readonly label: string;
        readonly onSelect: () => void;
      }
    | undefined;
  readonly onBlock: () => void;
  readonly showPersonalActions?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  const isMobileLayoutViewport = useIsMobileLayoutViewport();
  const mute = useProfileMute(handle);
  const menuLabel = t(locale, "contentModeration.profile.actionsMenu");
  const items: readonly CompactMenuItem[] = [
    ...(showPersonalActions
      ? ([
          {
            id: "toggle-notifications",
            label: t(
              locale,
              mute.isMuted
                ? "profile.mute.action.unmute"
                : "profile.mute.action.mute"
            ),
            icon: (
              <FontAwesomeIcon
                aria-hidden="true"
                icon={mute.isMuted ? faBellSlash : faBell}
                className="tw-size-4"
              />
            ),
            onSelect: () => void mute.toggleMute(),
            disabled: mute.isPending,
          },
          {
            id: "block-profile",
            label: t(locale, "contentModeration.actions.blockProfile"),
            icon: <NoSymbolIcon aria-hidden="true" className="tw-size-4" />,
            onSelect: onBlock,
            className: "tw-text-red desktop-hover:hover:tw-text-red",
          },
        ] satisfies CompactMenuItem[])
      : []),
    ...(moderationAction
      ? ([
          {
            id: `moderator-${moderationAction.kind}`,
            label: moderationAction.label,
            icon:
              moderationAction.kind === "suspend" ? (
                <MinusCircleIcon aria-hidden="true" className="tw-size-4" />
              ) : (
                <ArrowPathIcon aria-hidden="true" className="tw-size-4" />
              ),
            onSelect: moderationAction.onSelect,
            className:
              moderationAction.kind === "suspend"
                ? "tw-text-amber-300 desktop-hover:hover:tw-text-amber-200"
                : undefined,
          },
        ] satisfies CompactMenuItem[])
      : []),
  ];
  const trigger = (
    <EllipsisHorizontalIcon aria-hidden="true" className="tw-size-5" />
  );

  if (isMobileLayoutViewport) {
    return (
      <CompactMenuMobileBottomSheet
        title={menuLabel}
        ariaLabel={menuLabel}
        items={items}
        trigger={trigger}
        triggerClassName={TRIGGER_CLASS_NAME}
        disabled={disabled}
      />
    );
  }

  return (
    <CompactMenu
      aria-label={menuLabel}
      items={items}
      disabled={disabled}
      trigger={trigger}
      triggerClassName={TRIGGER_CLASS_NAME}
      unstyledTrigger
      menuWidthClassName="tw-w-56"
    />
  );
}
