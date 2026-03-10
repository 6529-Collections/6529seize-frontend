import { CLASSIFICATIONS } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatTimestampToMonthYear } from "@/helpers/Helpers";
import UserCICTypeIconWrapper from "@/components/user/utils/user-cic-type/UserCICTypeIconWrapper";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import UserPageClassificationWrapper from "./classification/UserPageClassificationWrapper";
import UserPageHeaderNameWrapper from "./UserPageHeaderNameWrapper";

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
  const getDisplayName = (): string => {
    if (profile.handle) {
      return profile.handle;
    }

    if (profile.display) {
      return profile.display;
    }

    if (mainAddress.endsWith(".eth")) {
      return mainAddress;
    }

    return mainAddress;
  };

  const displayName = getDisplayName();
  const profileEnabledLabel = profileEnabledAt
    ? formatTimestampToMonthYear(new Date(profileEnabledAt).getTime())
    : null;

  const showTitle = variant !== "meta";
  const showMeta = variant !== "title";

  return (
    <div className={showTitle && showMeta ? "tw-space-y-2" : ""}>
      {showTitle && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <UserPageHeaderNameWrapper profile={profile} canEdit={canEdit}>
            <p className="tw-mb-0 tw-break-all tw-text-left tw-text-xl tw-font-semibold tw-leading-none tw-tracking-tight tw-text-white md:tw-text-2xl">
              {displayName}
            </p>
          </UserPageHeaderNameWrapper>
          {profile.handle && (
            <div className="tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center xl:tw-mt-1">
              <UserCICTypeIconWrapper profile={profile} />
            </div>
          )}
          <UserCICAndLevel level={level} size={UserCICAndLevelSize.SMALL} />
          <DropAuthorBadges
            profile={profile}
            tooltipIdPrefix="profile-author-badges"
          />
        </div>
      )}

      {showMeta && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <UserPageClassificationWrapper profile={profile} canEdit={canEdit}>
            <div className="tw-block tw-text-sm tw-font-medium tw-leading-4 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-white">
              {CLASSIFICATIONS[profile.classification].title}
            </div>
          </UserPageClassificationWrapper>
          {profileEnabledLabel && (
            <span className="tw-text-iron-600 sm:tw-text-iron-700">&bull;</span>
          )}
          {profileEnabledLabel && (
            <p
              className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-500"
              suppressHydrationWarning
            >
              Profile enabled: {profileEnabledLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
