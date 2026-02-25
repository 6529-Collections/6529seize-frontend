"use client";

import { useState } from "react";
import type { RatingStats } from "@/entities/IProfile";
import UserPageRepModifyModal from "@/components/user/rep/modify-rep/UserPageRepModifyModal";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserPageRepRepsTableItem({
  rep,
  profile,
  canEditRep,
  maxRep,
}: {
  readonly rep: RatingStats;
  readonly profile: ApiIdentity;
  readonly canEditRep: boolean;
  readonly maxRep: number;
}) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const progressPercent =
    maxRep > 0 ? (Math.abs(rep.rating) / maxRep) * 100 : 0;

  const cellBase =
    "tw-py-2.5 sm:tw-py-3 tw-px-4 tw-bg-gradient-to-r tw-from-[#0f1014]/40 tw-to-[#0A0A0C]/40 tw-border-y tw-border-solid tw-border-white/[0.08] sm:tw-border-white/[0.04] tw-border-x-0 tw-transition-all tw-duration-200 tw-ease-out";
  const hoverClass =
    "group-hover:tw-from-[#12141a]/60 group-hover:tw-to-[#0d0f13]/60 group-hover:tw-border-white/[0.16]";

  return (
    <>
      <tr
        className="tw-cursor-pointer tw-group"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Category + progress bar */}
        <td
          className={`${cellBase} ${hoverClass} tw-rounded-l-lg tw-border-l tw-border-l-white/[0.08] sm:tw-border-l-white/[0.04]`}
        >
          <div className="tw-max-w-[12rem] lg:tw-max-w-[20rem] tw-truncate tw-text-sm lg:tw-text-base tw-font-semibold tw-text-iron-100 group-hover:tw-text-white tw-transition-colors tw-mb-2">
            {rep.category}
          </div>
          <div className="tw-h-1 tw-w-full tw-max-w-[16rem] tw-bg-white/[0.04] tw-rounded-full tw-overflow-hidden">
            <div
              className="tw-h-full tw-bg-gradient-to-r tw-from-blue-500/50 tw-to-blue-400/30 tw-rounded-full tw-shadow-[0_0_6px_rgba(59,130,246,0.25)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </td>

        {/* Community (Rep) */}
        <td className={`${cellBase} ${hoverClass} tw-text-right`}>
          <span className="tw-text-sm lg:tw-text-base tw-font-semibold tw-text-iron-300 group-hover:tw-text-iron-200 tw-transition-colors">
            {formatNumberWithCommas(rep.rating)}
          </span>
        </td>

        {/* People (Raters) */}
        <td
          className={`${cellBase} ${hoverClass} tw-text-right ${
            canEditRep ? "" : "tw-rounded-r-lg tw-border-r tw-border-r-white/[0.08] sm:tw-border-r-white/[0.04]"
          }`}
        >
          <span className="tw-text-xs lg:tw-text-sm tw-font-normal tw-text-iron-400 group-hover:tw-text-iron-300 tw-transition-colors">
            {formatNumberWithCommas(rep.contributor_count)}
          </span>
        </td>

        {/* From You (My Rates) */}
        {canEditRep && (
          <td
            className={`${cellBase} ${hoverClass} tw-rounded-r-lg tw-border-r tw-border-r-white/[0.08] sm:tw-border-r-white/[0.04] tw-text-right`}
          >
            {rep.rater_contribution ? (
              <span
                className={`tw-text-sm tw-font-semibold tw-transition-colors ${
                  rep.rater_contribution > 0
                    ? "tw-text-primary-400/90 group-hover:tw-text-primary-400"
                    : "tw-text-rose-400"
                }`}
              >
                {formatNumberWithCommas(rep.rater_contribution)}
              </span>
            ) : (
              <span className="tw-text-sm tw-font-semibold tw-text-white/15 group-hover:tw-text-white/25 tw-transition-colors">-</span>
            )}
          </td>
        )}
      </tr>

      {isModalOpen && (
        <UserPageRepModifyModal
          profile={profile}
          category={rep.category}
          canEditRep={canEditRep}
          categoryRep={rep.rating}
          contributorCount={rep.contributor_count}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
