import { CLASSIFICATIONS } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import ProfileNameWithAiMarker from "@/components/common/profile/ProfileNameWithAiMarker";
import UserCICTypeIconWrapper from "@/components/user/utils/user-cic-type/UserCICTypeIconWrapper";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import UserPageClassificationWrapper from "./classification/UserPageClassificationWrapper";
import ProfileCurationBadge from "./ProfileCurationBadge";
import UserPageHeaderNameWrapper from "./UserPageHeaderNameWrapper";
import {
  formatUserProfileHeaderMonthYear,
  getUserProfileHeaderDisplayName,
  getUserProfileHeaderMessage,
} from "../user-page-header.messages";

export default function UserPageHeaderName({
  profile,
  canEdit,
  mainAddress,
  level,
  profileEnabledAt,
  variant = "full",
}: {
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
  readonly mainAddress: string;
  readonly level: number;
  readonly profileEnabledAt: string | null;
  readonly variant?: "full" | "title" | "meta";
}) {
  const displayName = getUserProfileHeaderDisplayName(profile, mainAddress);
  const profileEnabledLabel = profileEnabledAt
    ? formatUserProfileHeaderMonthYear(profileEnabledAt)
    : null;

  const showTitle = variant !== "meta";
  const showMeta = variant !== "title";

  return (
    <div className={showTitle && showMeta ? "tw-space-y-2" : ""}>
      {showTitle && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <UserPageHeaderNameWrapper
            profile={profile}
            canEdit={canEdit}
            profileLabel={displayName}
          >
            <ProfileNameWithAiMarker
              classification={profile.classification}
              markerClassName="tw-text-base md:tw-text-lg"
            >
              <span className="tw-break-all tw-text-left tw-text-xl tw-font-semibold tw-leading-none tw-tracking-tight tw-text-iron-50 md:tw-text-2xl">
                {displayName}
              </span>
            </ProfileNameWithAiMarker>
          </UserPageHeaderNameWrapper>
          <div className="tw-flex tw-h-5 tw-flex-shrink-0 tw-items-center tw-gap-1.5">
            {profile.handle && (
              <div className="tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center [&_svg]:tw-block">
                <UserCICTypeIconWrapper profile={profile} />
              </div>
            )}
            <UserCICAndLevel level={level} size={UserCICAndLevelSize.SMALL} />
            <ProfileCurationBadge profile={profile} />
          </div>
        </div>
      )}

      {showMeta && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <UserPageClassificationWrapper profile={profile} canEdit={canEdit}>
            <div className="tw-block tw-text-[13px] tw-font-medium tw-leading-4 tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50">
              {CLASSIFICATIONS[profile.classification].title}
            </div>
          </UserPageClassificationWrapper>
          {profileEnabledLabel && (
            <span className="tw-text-iron-700">&bull;</span>
          )}
          {profileEnabledLabel && (
            <p
              className="tw-m-0 tw-text-[13px] tw-font-normal tw-leading-4 tw-text-white/50"
              suppressHydrationWarning
            >
              {getUserProfileHeaderMessage(
                "user.profileHeader.name.profileEnabled",
                { date: profileEnabledLabel }
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
