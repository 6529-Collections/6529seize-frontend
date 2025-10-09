'use client';

import Link from "next/link";
import type { XtdhGranter } from "@/types/xtdh";
import { formatXtdhRate } from "../utils";

export interface XtdhReceivedGranterRowProps {
  readonly granter: XtdhGranter;
  readonly hrefBuilder?: (profileId: string) => string;
}

/**
 * Renders a single granter entry complete with profile link and xTDH rate.
 * `hrefBuilder` allows scoping the profile URL for different page contexts.
 */
export function XtdhReceivedGranterRow({
  granter,
  hrefBuilder = (profileId) => `/${encodeURIComponent(profileId)}/xtdh`,
}: XtdhReceivedGranterRowProps) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
      <div className="tw-flex tw-items-center tw-gap-3">
        <img
          src={granter.profileImage}
          alt={`${granter.displayName} avatar`}
          className="tw-h-9 tw-w-9 tw-rounded-full tw-object-cover tw-border tw-border-iron-700"
          loading="lazy"
        />
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <Link
            href={hrefBuilder(granter.profileId)}
            className="tw-text-sm tw-font-semibold tw-text-primary-400 hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
          >
            {granter.displayName}
          </Link>
          <span className="tw-text-xs tw-text-iron-300">
            @{granter.profileId}
          </span>
        </div>
      </div>
      <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
        {formatXtdhRate(granter.xtdhRateGranted)}
      </span>
    </div>
  );
}
