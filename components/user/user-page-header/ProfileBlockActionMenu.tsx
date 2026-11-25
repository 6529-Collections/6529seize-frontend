"use client";

import { useState } from "react";
import IconButton from "@/components/utils/button/IconButton";
import { useAuth } from "@/components/auth/Auth";
import useArtistArtworkAlert from "@/hooks/useArtistArtworkAlert";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import CompactMenuMobileBottomSheet from "@/components/compact-menu/CompactMenuMobileBottomSheet";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useProfileMute from "@/hooks/useProfileMute";
import { t } from "@/i18n/messages";
import {
  ArrowPathIcon,
  BellIcon,
  BellSlashIcon,
  EllipsisVerticalIcon,
  EllipsisHorizontalIcon,
  MinusCircleIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";

type Props = Readonly<{
  handle: string;
  hasArtistActivity: boolean;
  disabled: boolean;
  blocked?: boolean;
  moderationAction?:
    | {
        readonly kind: "suspend" | "reinstate";
        readonly label: string;
        readonly onSelect: () => void;
      }
    | undefined;
  onBlock: () => void;
  showPersonalActions?: boolean | undefined;
  placement?: "inline" | "mobile" | "native-header" | undefined;
}>;

export default function ProfileBlockActionMenu(props: Props) {
  const auth = useAuth();
  const scope = `${auth.connectedProfile?.id ?? "guest"}:${auth.activeProfileProxy?.id ?? "direct"}:${auth.isAuthenticated === true}:${auth.isDirectProfileSession === true}`;
  return (
    <ProfileActionsMenu
      key={`${scope}:${props.handle}`}
      {...props}
      scope={scope}
    />
  );
}

function ProfileActionsMenu({
  handle,
  hasArtistActivity,
  disabled,
  blocked = false,
  moderationAction,
  onBlock,
  showPersonalActions = true,
  scope,
  placement = "inline",
}: Props & { readonly scope: string }) {
  const locale = useBrowserLocale();
  const isMobileLayoutViewport = useIsMobileLayoutViewport();
  const [menuOpen, setMenuOpen] = useState(false);
  const mute = useProfileMute(showPersonalActions ? handle : "");
  const artworkAlert = useArtistArtworkAlert(
    handle,
    scope,
    blocked,
    hasArtistActivity,
    // With no other actions, discover a saved opt-in so its off switch stays
    // reachable even after the artist loses their badge or is blocked.
    !disabled &&
      (menuOpen ||
        (!hasArtistActivity && !showPersonalActions && !moderationAction))
  );
  const menuLabel = t(locale, "contentModeration.profile.actionsMenu");
  const MuteIcon = mute.isMuted ? BellSlashIcon : BellIcon;
  const items: readonly CompactMenuItem[] = [
    ...(artworkAlert ? [artworkAlert] : []),
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
            icon: <MuteIcon aria-hidden="true" className="tw-size-4" />,
            onSelect: () => void mute.toggleMute(),
            disabled: mute.isPending,
          },
          {
            id: "block-profile",
            label: t(locale, "contentModeration.actions.blockProfile"),
            icon: <NoSymbolIcon aria-hidden="true" className="tw-size-4" />,
            iconClassName: isMobileLayoutViewport
              ? "tw-size-5 tw-flex-none tw-text-current"
              : undefined,
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
            iconClassName: isMobileLayoutViewport
              ? "tw-size-5 tw-flex-none tw-text-current"
              : undefined,
            className:
              moderationAction.kind === "suspend"
                ? "tw-text-amber-300 desktop-hover:hover:tw-text-amber-200"
                : undefined,
          },
        ] satisfies CompactMenuItem[])
      : []),
  ];
  if (items.length === 0) return null;

  const Icon =
    placement === "native-header"
      ? EllipsisHorizontalIcon
      : EllipsisVerticalIcon;
  const trigger = <Icon aria-hidden="true" className="tw-size-5" />;

  if (isMobileLayoutViewport) {
    return (
      <CompactMenuMobileBottomSheet
        title={menuLabel}
        ariaLabel={menuLabel}
        items={items}
        trigger={trigger}
        renderTriggerButton={({
          ariaLabel,
          ariaExpanded,
          disabled: triggerDisabled,
          onClick,
        }) => (
          <IconButton
            layout="profile-menu"
            aria-label={ariaLabel}
            aria-haspopup="dialog"
            aria-expanded={ariaExpanded}
            disabled={triggerDisabled}
            onClick={onClick}
          >
            {trigger}
          </IconButton>
        )}
        disabled={disabled}
        onOpenChange={setMenuOpen}
      />
    );
  }

  return (
    <CompactMenu
      aria-label={menuLabel}
      items={items}
      disabled={disabled}
      onOpenChange={setMenuOpen}
      trigger={
        <IconButton layout="profile-menu" aria-label={menuLabel}>
          {trigger}
        </IconButton>
      }
      triggerAsChild
      unstyledTrigger
      autoFocusItem={false}
      menuWidthClassName="tw-w-72"
    />
  );
}
