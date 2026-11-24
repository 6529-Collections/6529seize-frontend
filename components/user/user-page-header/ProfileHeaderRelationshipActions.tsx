import { useAuth } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  getSubmissionCount,
  getTrophyArtworkCount,
} from "@/helpers/artist-activity.helpers";
import { useProfileDirectMessage } from "@/hooks/useProfileDirectMessage";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import UserFollowBtn from "../utils/UserFollowBtn";
import ProfileBlockActionMenu from "./ProfileBlockActionMenu";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { PROFILE_MOBILE_ACTION_CLASS } from "./user-page-header-surface";

export type ProfileAction = "block" | "unblock" | "suspend" | "reinstate";

export type ProfileModerationControls = Readonly<{
  canManageBlock: boolean;
  canModerate: boolean;
  isActionPending: boolean;
  isBlocked: boolean;
  isBlocking: boolean;
  isLoading: boolean;
  isSuspended: boolean;
  isUnblocking: boolean;
  onSelectAction: (action: ProfileAction) => void;
}>;

export function ProfileHeaderActionMenu({
  moderationControls,
  profile,
  placement,
}: Readonly<{
  moderationControls: ProfileModerationControls;
  profile: ApiIdentity;
  placement?: "inline" | "mobile" | "native-header" | undefined;
}>) {
  const { connectedProfile } = useAuth();
  if (!profile.handle) {
    return null;
  }

  const moderationKind = moderationControls.isSuspended
    ? ("reinstate" as const)
    : ("suspend" as const);
  const moderationLabel = t(
    DEFAULT_LOCALE,
    moderationControls.isSuspended
      ? "contentModeration.moderator.reinstate"
      : "contentModeration.moderator.suspend"
  );
  const moderationAction = moderationControls.canModerate
    ? {
        kind: moderationKind,
        label: moderationLabel,
        onSelect: () => moderationControls.onSelectAction(moderationKind),
      }
    : undefined;

  return (
    <ProfileBlockActionMenu
      placement={placement}
      handle={profile.handle}
      hasArtistActivity={
        getSubmissionCount(profile) > 0 || getTrophyArtworkCount(profile) > 0
      }
      blocked={moderationControls.isBlocked}
      disabled={
        moderationControls.isLoading || moderationControls.isActionPending
      }
      showPersonalActions={
        !!connectedProfile?.handle &&
        moderationControls.canManageBlock &&
        !moderationControls.isBlocked
      }
      moderationAction={moderationAction}
      onBlock={() => moderationControls.onSelectAction("block")}
    />
  );
}

export default function ProfileHeaderRelationshipActions({
  moderationControls,
  profile,
}: Readonly<{
  moderationControls: ProfileModerationControls;
  profile: ApiIdentity;
}>) {
  const { connectedProfile } = useAuth();
  const onDirectMessage = useProfileDirectMessage(profile);
  const { isApp } = useDeviceInfo();
  const isMobileViewport = useIsMobileLayoutViewport();
  const isCompact = isApp || isMobileViewport;
  const actionMenu = isApp ? null : (
    <ProfileHeaderActionMenu
      moderationControls={moderationControls}
      profile={profile}
      placement={isCompact ? "mobile" : "inline"}
    />
  );
  if (!profile.handle) return null;
  if (!connectedProfile?.handle) return actionMenu;

  return (
    <UserFollowBtn
      handle={profile.handle}
      blocked={moderationControls.isBlocked}
      blockStateLoading={
        moderationControls.isLoading || moderationControls.isBlocking
      }
      showFollowButton
      showMuteButton={false}
      unblockPending={moderationControls.isUnblocking}
      onUnblock={() => moderationControls.onSelectAction("unblock")}
      onDirectMessage={onDirectMessage}
      beforeFollowAction={actionMenu}
      buttonClassName={isCompact ? PROFILE_MOBILE_ACTION_CLASS : undefined}
      directMessageButtonClassName={
        isCompact
          ? `${PROFILE_MOBILE_ACTION_CLASS} !tw-size-9 !tw-min-w-9`
          : undefined
      }
    />
  );
}
