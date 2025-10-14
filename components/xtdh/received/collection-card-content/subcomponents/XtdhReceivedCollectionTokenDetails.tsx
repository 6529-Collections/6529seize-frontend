'use client';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import type { XtdhReceivedNft } from "@/types/xtdh";

import { formatXtdhRate } from "../../utils";
import { XtdhReceivedGranterRow } from "../../subcomponents/XtdhReceivedGranterRow";

export interface XtdhReceivedCollectionTokenDetailsProps {
  readonly token: XtdhReceivedNft;
  readonly detailsRegionId: string;
  readonly onClose: () => void;
}

export function XtdhReceivedCollectionTokenDetails({
  token,
  detailsRegionId,
  onClose,
}: XtdhReceivedCollectionTokenDetailsProps) {
  return (
    <aside
      id={detailsRegionId}
      role="region"
      aria-label={`Grantors for ${token.tokenName}`}
      className="tw-flex tw-h-full tw-flex-col tw-rounded-xl tw-border tw-border-iron-850 tw-bg-iron-950/80 tw-shadow-inner"
    >
      <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-900/60 tw-px-4 tw-py-3">
        <div className="tw-flex tw-items-center tw-gap-3">
          <img
            src={token.tokenImage}
            alt=""
            className="tw-h-10 tw-w-10 tw-flex-shrink-0 tw-rounded-lg tw-border tw-border-iron-800 tw-object-cover"
            loading="lazy"
          />
          <div className="tw-flex tw-flex-col">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
              {token.tokenName}
            </span>
            <span className="tw-text-xxs tw-uppercase tw-text-iron-400">
              {formatXtdhRate(token.xtdhRate)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-800 tw-text-iron-300 tw-transition tw-duration-150 tw-ease-out hover:tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
          aria-label="Close token details"
        >
          <FontAwesomeIcon icon={faXmark} className="tw-h-3 tw-w-3" />
        </button>
      </div>
      <div className="tw-flex-1 tw-space-y-2 tw-overflow-y-auto tw-p-4 tw-pr-3 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700">
        {token.granters.length === 0 ? (
          <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-900/70 tw-bg-iron-900/50 tw-p-6">
            <span className="tw-text-sm tw-text-iron-300">
              No grantors for this token yet.
            </span>
          </div>
        ) : (
          token.granters.map((granter) => (
            <XtdhReceivedGranterRow
              key={`${token.tokenId}-${granter.profileId}`}
              granter={granter}
            />
          ))
        )}
      </div>
    </aside>
  );
}
