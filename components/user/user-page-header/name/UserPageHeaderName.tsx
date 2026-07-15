import { CICType, CLASSIFICATIONS } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import ProfileNameWithAiMarker from "@/components/common/profile/ProfileNameWithAiMarker";
import UserCICTypeIconWrapper from "@/components/user/utils/user-cic-type/UserCICTypeIconWrapper";
import { cicToType } from "@/helpers/Helpers";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import UserPageClassificationWrapper from "./classification/UserPageClassificationWrapper";
import ProfileCurationBadge from "./ProfileCurationBadge";
import UserPageHeaderNameWrapper from "./UserPageHeaderNameWrapper";
import {
  formatUserProfileHeaderMonthYear,
  getUserProfileHeaderDisplayName,
  getUserProfileHeaderMessage,
} from "../user-page-header.messages";

const NIC_STATUS_MESSAGE_KEY_BY_TYPE = {
  [CICType.INACCURATE]: "user.profileHeader.badges.nicStatus.inaccurate",
  [CICType.UNKNOWN]: "user.profileHeader.badges.nicStatus.unknown",
  [CICType.PROBABLY_ACCURATE]:
    "user.profileHeader.badges.nicStatus.probablyAccurate",
  [CICType.ACCURATE]: "user.profileHeader.badges.nicStatus.accurate",
  [CICType.HIGHLY_ACCURATE]:
    "user.profileHeader.badges.nicStatus.highlyAccurate",
} as const satisfies Record<
  CICType,
  Parameters<typeof getUserProfileHeaderMessage>[0]
>;

export default function UserPageHeaderName({
  profile,
  canEdit,
  mainAddress,
  level,
  profileEnabledAt,
}: {
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
  readonly mainAddress: string;
  readonly level: number;
  readonly profileEnabledAt: string | null;
}) {
  const displayName = getUserProfileHeaderDisplayName(profile, mainAddress);
  const profileEnabledLabel = profileEnabledAt
    ? formatUserProfileHeaderMonthYear(profileEnabledAt)
    : null;
  const nicStatus = getUserProfileHeaderMessage(
    NIC_STATUS_MESSAGE_KEY_BY_TYPE[cicToType(profile.cic)]
  );
  const nicStatusLabel = getUserProfileHeaderMessage(
    "user.profileHeader.badges.nicStatus",
    { status: nicStatus }
  );

  return (
    <div className="tw-min-w-0">
      <UserPageHeaderNameWrapper
        profile={profile}
        canEdit={canEdit}
        profileLabel={displayName}
      >
        <h1
          id="profile-heading"
          className="tw-mb-0 tw-min-w-0 tw-break-words tw-text-left tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-white [overflow-wrap:anywhere] sm:tw-text-3xl"
        >
          <ProfileNameWithAiMarker
            classification={profile.classification}
            className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2"
            markerClassName="tw-text-lg sm:tw-text-xl"
          >
            <span className="tw-min-w-0">{displayName}</span>
          </ProfileNameWithAiMarker>
        </h1>
      </UserPageHeaderNameWrapper>

      <div
        role="group"
        aria-label={getUserProfileHeaderMessage(
          "user.profileHeader.badges.label"
        )}
        className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1.5"
      >
        {profile.handle ? (
          <div className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-normal tw-text-iron-400">
            <UserCICTypeIconWrapper
              profile={profile}
              ariaHidden={true}
              className="tw-inline-flex tw-size-6 tw-shrink-0 tw-items-center tw-justify-center [&>div]:tw-size-4 [&_svg]:tw-size-full"
            />
            <span>{nicStatusLabel}</span>
          </div>
        ) : null}
        <span className="tw-text-sm tw-font-normal tw-text-iron-500">
          {getUserProfileHeaderMessage("user.profileHeader.badges.level", {
            level: formatInteger(DEFAULT_LOCALE, level),
          })}
        </span>
        <ProfileCurationBadge profile={profile} />
      </div>

      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
        <UserPageClassificationWrapper
          profile={profile}
          canEdit={canEdit}
          profileLabel={displayName}
        >
          <span className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400">
            {CLASSIFICATIONS[profile.classification].title}
          </span>
        </UserPageClassificationWrapper>
        {profileEnabledLabel ? (
          <p
            className="tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-500"
            suppressHydrationWarning
          >
            {getUserProfileHeaderMessage(
              "user.profileHeader.name.profileEnabled",
              { date: profileEnabledLabel }
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}
