import Link from "next/link";
import { IdentityAndSubscriptionActions } from "../../../generated/models/IdentityAndSubscriptionActions";
import { cicToType } from "../../../helpers/Helpers";
import UserCICAndLevel, { UserCICAndLevelSize } from "../../user/utils/UserCICAndLevel";

export default function Follower({
  follower,
}: {
  readonly follower: IdentityAndSubscriptionActions;
}) {
  const cicType = cicToType(follower.identity.cic);
  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <div className="tw-h-10 tw-w-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-lg">
        <div className="tw-rounded-lg tw-h-full tw-w-full">
          <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-800">
            <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
              {follower.identity.pfp ? (
                <img
                  src={follower.identity.pfp}
                  alt=""
                  className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                />
              ) : (
                <div className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain" />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="tw-flex tw-flex-col">
        <div className="tw-flex tw-items-center tw-gap-x-1">
          <div className="tw-items-center tw-flex tw-gap-x-2">
          <UserCICAndLevel
            level={follower.identity.level}
            cicType={cicType}
            size={UserCICAndLevelSize.SMALL}
          />
            <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold tw-text-iron-50">
              <Link
                href={`/${follower.identity.handle}`}
                className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
              >
                {follower.identity.handle}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
