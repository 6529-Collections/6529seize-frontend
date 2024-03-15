import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

export default function UserPageHeaderStats({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  return (
    <div className="tw-mt-3">
      <div className="tw-flex tw-gap-x-6">
        <div className="tw-inline-flex tw-items-center tw-gap-x-1">
          <span className="tw-text-base tw-font-medium tw-text-iron-50">
            {formatNumberWithCommas(profile.consolidation.tdh)}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
            TDH
          </span>
        </div>
        <div className="tw-inline-flex tw-items-center tw-gap-x-1">
          <span className="tw-text-base tw-font-medium tw-text-iron-50">
            {formatNumberWithCommas(profile.rep)}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
            Rep
          </span>
        </div>
      </div>
    </div>
  );
}
