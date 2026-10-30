import { useAuth } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import UserFollowBtn from "../utils/UserFollowBtn";
import ProfileBlockActionMenu from "./ProfileBlockActionMenu";

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

export default function ProfileHeaderRelationshipActions({
  directMessageLoading,
  moderationControls,
  onCreateDirectMessage,
  profile,
}: Readonly<{
  directMessageLoading: boolean;
  moderationControls: ProfileModerationControls;
  onCreateDirectMessage: (primaryWallet: string | undefined) => void;
  profile: ApiIdentity;
}>) {
  const { connectedProfile } = useAuth();
  if (!profile.handle) {
    return null;
  }

  const directMessageAction = profile.primary_wallet
    ? () => onCreateDirectMessage(profile.primary_wallet)
    : undefined;
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

  const actionMenu = (
    <ProfileBlockActionMenu
      handle={profile.handle}
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
      onDirectMessage={directMessageAction}
      directMessageLoading={directMessageLoading}
      beforeFollowAction={actionMenu}
    />
  );
}
