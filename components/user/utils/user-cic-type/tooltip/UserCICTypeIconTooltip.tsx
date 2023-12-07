import { useEffect, useState } from "react";
import {
  CICType,
  CIC_TO_TEXT,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import UserCICTypeIconTooltipHeaders from "./UserCICTypeIconTooltipHeaders";
import UserCICTypeIconTooltipRate from "./UserCICTypeIconTooltipRate";
import { cicToType } from "../../../../../helpers/Helpers";

export default function UserCICTypeIconTooltip({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const [cicType, setCicType] = useState<CICType>(
    cicToType(profile.cic.cic_rating)
  );
  useEffect(() => {
    setCicType(cicToType(profile.cic.cic_rating));
  }, [profile]);

  const CIC_META: Record<CICType, { title: string; class: string }> = {
    [CICType.INACCURATE]: {
      title: CIC_TO_TEXT[CICType.INACCURATE],
      class: "tw-text-red",
    },
    [CICType.UNKNOWN]: {
      title: CIC_TO_TEXT[CICType.UNKNOWN],
      class: "tw-text-yellow",
    },
    [CICType.PROBABLY_ACCURATE]: {
      title: CIC_TO_TEXT[CICType.PROBABLY_ACCURATE],
      class: "tw-text-[#AAF0C4]",
    },
    [CICType.ACCURATE]: {
      title: CIC_TO_TEXT[CICType.ACCURATE],
      class: "tw-text-[#73E2A3]",
    },
    [CICType.HIGHLY_ACCURATE]: {
      title: CIC_TO_TEXT[CICType.HIGHLY_ACCURATE],
      class: "tw-text-[#3CCB7F]",
    },
  };

  return (
    <div className="tw-p-3">
      <UserCICTypeIconTooltipHeaders />
      <div className="tw-mt-4 tw-space-y-0.5">
        <span className="tw-block tw-text-iron-100 tw-font-semibold">
          <span>Rating:</span>
          <span className="tw-ml-1 tw-text-white tw-font-bold">
            {profile.cic.cic_rating}
          </span>
        </span>
        <span className="tw-block tw-text-iron-100 tw-font-semibold">
          <span>Status:</span>
          <span className={`${CIC_META[cicType].class} tw-ml-1 tw-font-bold`}>
            {CIC_META[cicType].title}
          </span>
        </span>
      </div>
      {cicType === CICType.INACCURATE && (
        <div className="mt-2">
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400 tw-font-medium">
            This profile will lose its handle on Jan 4, 2024 at midnight UTC if
            its rating does not turn positive before then.
          </p>
        </div>
      )}
      <UserCICTypeIconTooltipRate />
    </div>
  );
}
