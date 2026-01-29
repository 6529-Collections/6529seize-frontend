import { CLASSIFICATIONS } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatTimestampToMonthYear } from "@/helpers/Helpers";
import UserCICTypeIconWrapper from "@/components/user/utils/user-cic-type/UserCICTypeIconWrapper";
import UserLevel from "@/components/user/utils/level/UserLevel";
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
    if (profile?.handle) {
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
        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
          <UserPageHeaderNameWrapper profile={profile} canEdit={canEdit}>
            <p className="tw-break-all tw-text-left tw-mb-0 tw-text-[1.75rem] md:tw-text-[2rem] tw-font-semibold tw-text-white tw-tracking-tight tw-leading-none">
              {displayName}
            </p>
          </UserPageHeaderNameWrapper>
          {profile?.handle && (
            <div className="tw-flex tw-items-center tw-justify-center tw-self-center tw-h-5 tw-w-5 md:tw-h-6 md:tw-w-6">
              <UserCICTypeIconWrapper profile={profile} />
            </div>
          )}
        </div>
      )}

      {showMeta && (
        <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-x-2 tw-gap-y-1 sm:tw-gap-x-3">
          {profile?.classification && (
            <UserPageClassificationWrapper profile={profile} canEdit={canEdit}>
              <div className="tw-block tw-text-zinc-400 hover:tw-text-white tw-font-medium tw-text-sm tw-leading-4 tw-transition tw-duration-300 tw-ease-out">
                {CLASSIFICATIONS[profile.classification].title}
              </div>
            </UserPageClassificationWrapper>
          )}
          {profile?.classification && (
            <span className="tw-text-zinc-600 sm:tw-text-zinc-700">&bull;</span>
          )}
          <UserLevel level={level} size="xs" />
          {profileEnabledLabel && (
            <>
              <span className="tw-text-zinc-600 sm:tw-text-zinc-700">&bull;</span>
              <p
                className="tw-mb-0 tw-text-zinc-500 tw-text-sm tw-font-medium"
                suppressHydrationWarning
              >
                Profile enabled: {profileEnabledLabel}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
