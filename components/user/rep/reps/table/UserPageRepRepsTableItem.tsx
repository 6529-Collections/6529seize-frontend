"use client";

import { useState } from "react";
import type { RatingStats } from "@/entities/IProfile";
import UserPageRepModifyModal from "@/components/user/rep/modify-rep/UserPageRepModifyModal";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

function formatCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return sign + (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + "M";
  }
  if (abs >= 1_000) {
    const k = abs / 1_000;
    if (k >= 1000) {
      const m = k / 1_000;
      return sign + (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + "M";
    }
    return sign + (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + "K";
  }
  return formatNumberWithCommas(n);
}

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
  const [isEditRepModalOpen, setIsEditRepModalOpen] = useState<boolean>(false);

  const onTableClick = () => {
    if (canEditRep) {
      setIsEditRepModalOpen(true);
    }
  };

  const progressPercent =
    maxRep > 0 ? (Math.abs(rep.rating) / maxRep) * 100 : 0;

  const cellBase =
    "tw-py-3.5 tw-px-4 sm:tw-px-6 tw-bg-gradient-to-r tw-from-[#0f1014]/40 tw-to-[#0A0A0C]/40 tw-border-y tw-border-solid tw-border-white/[0.04] tw-border-x-0 tw-transition-all tw-duration-200 tw-ease-out";
  const hoverClass = canEditRep
    ? "group-hover:tw-from-[#12141a]/60 group-hover:tw-to-[#0d0f13]/60 group-hover:tw-border-white/[0.16]"
    : "";

  return (
    <>
      <tr
        className={
          canEditRep ? "tw-cursor-pointer tw-group" : "tw-group"
        }
        onClick={onTableClick}
      >
        {/* Category + progress bar */}
        <td
          className={`${cellBase} ${hoverClass} tw-rounded-l-lg tw-border-l`}
        >
          <div className="tw-max-w-[12rem] lg:tw-max-w-[20rem] tw-truncate tw-text-sm tw-font-semibold tw-text-iron-200 group-hover:tw-text-white tw-transition-colors tw-mb-2">
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
          <span className="tw-text-base tw-font-bold tw-text-iron-300 group-hover:tw-text-iron-200 tw-transition-colors">
            {formatCompact(rep.rating)}
          </span>
        </td>

        {/* People (Raters) */}
        <td
          className={`${cellBase} ${hoverClass} tw-text-right ${
            canEditRep ? "" : "tw-rounded-r-lg tw-border-r"
          }`}
        >
          <span className="tw-text-sm tw-font-bold tw-text-iron-400 group-hover:tw-text-iron-300 tw-transition-colors">
            {formatNumberWithCommas(rep.contributor_count)}
          </span>
        </td>

        {/* From You (My Rates) */}
        {canEditRep && (
          <td
            className={`${cellBase} ${hoverClass} tw-rounded-r-lg tw-border-r tw-text-right`}
          >
            {rep.rater_contribution ? (
              <span
                className={`tw-text-sm tw-font-bold tw-transition-colors ${
                  rep.rater_contribution > 0
                    ? "tw-text-primary-400/90 group-hover:tw-text-primary-400"
                    : "tw-text-rose-400"
                }`}
              >
                {formatNumberWithCommas(rep.rater_contribution)}
              </span>
            ) : (
              <span className="tw-text-sm tw-font-bold tw-text-white/15 group-hover:tw-text-white/25 tw-transition-colors">-</span>
            )}
          </td>
        )}
      </tr>

      {canEditRep && isEditRepModalOpen && (
        <UserPageRepModifyModal
          profile={profile}
          category={rep.category}
          onClose={() => setIsEditRepModalOpen(false)}
        />
      )}
    </>
  );
}
