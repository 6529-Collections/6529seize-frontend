import {
  CLASSIFICATIONS,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import UserCICTypeIconWrapper from "../../utils/user-cic-type/UserCICTypeIconWrapper";
import UserPageHeaderNameWrapper from "./UserPageHeaderNameWrapper";
import UserPageClassificationWrapper from "./classification/UserPageClassificationWrapper";

export default function UserPageHeaderName({
  profile,
  canEdit,
  mainAddress,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly canEdit: boolean;
  readonly mainAddress: string;
}) {
  const getDisplayName = (): string => {
    if (profile.profile?.handle) {
      return profile.profile.handle;
    }

    if (profile.consolidation.consolidation_display) {
      return profile.consolidation.consolidation_display;
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
        {profile.profile?.handle && (
          <div className="tw-ml-2 tw-flex tw-items-center tw-justify-center tw-self-center tw-h-6 tw-w-6">
            <UserCICTypeIconWrapper profile={profile} />
          </div>
        )}
      </div>
      {profile.profile?.classification && (
        <UserPageClassificationWrapper profile={profile} canEdit={canEdit}>
          <div className="tw-block tw-text-iron-400 hover:tw-text-iron-300 tw-font-medium tw-text-sm tw-leading-3 tw-transition tw-duration-300 tw-ease-out">
            {CLASSIFICATIONS[profile.profile.classification].title}
          </div>
        </UserPageClassificationWrapper>
      )}
    </div>
  );
}
