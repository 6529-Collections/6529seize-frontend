import { CLASSIFICATIONS } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserCICTypeIconWrapper from "@/components/user/utils/user-cic-type/UserCICTypeIconWrapper";
import UserPageClassificationWrapper from "./classification/UserPageClassificationWrapper";
import UserPageHeaderNameWrapper from "./UserPageHeaderNameWrapper";

export default function UserPageHeaderName({
  profile,
  canEdit,
  mainAddress,
}: {
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
  readonly mainAddress: string;
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
  return (
    <div className="tw-mt-2 sm:tw-mt-3">
      <div className="tw-flex tw-items-center">
        <UserPageHeaderNameWrapper profile={profile} canEdit={canEdit}>
          <p className="tw-break-all tw-text-left tw-mb-0 tw-text-2xl sm:tw-text-3xl tw-font-semibold">
            {displayName}
          </p>
        </UserPageHeaderNameWrapper>
        {profile?.handle && (
          <div className="tw-ml-2 tw-flex tw-items-center tw-justify-center tw-self-center tw-h-6 tw-w-6">
            <UserCICTypeIconWrapper profile={profile} />
          </div>
        )}
      </div>

      {profile?.classification && (
        <UserPageClassificationWrapper profile={profile} canEdit={canEdit}>
          <div className="tw-block tw-text-iron-400 hover:tw-text-iron-300 tw-font-medium tw-text-sm tw-leading-3 tw-transition tw-duration-300 tw-ease-out">
            {CLASSIFICATIONS[profile.classification].title}
          </div>
        </UserPageClassificationWrapper>
      )}
    </div>
  );
}
