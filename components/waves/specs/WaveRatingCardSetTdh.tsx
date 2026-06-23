"use client";

import type { ApiWaveCreditNft } from "@/generated/models/ApiWaveCreditNft";
import { useMemo, useState } from "react";
import WaveRatingCardSetTdhDialog from "./WaveRatingCardSetTdhDialog";
import {
  getMemeCardCountLabel,
  normalizeCardSetTdhTokenIds,
} from "./wave-card-set-tdh.helpers";

interface WaveRatingCardSetTdhProps {
  readonly creditNfts: readonly ApiWaveCreditNft[] | null | undefined;
}

export default function WaveRatingCardSetTdh({
  creditNfts,
}: WaveRatingCardSetTdhProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const tokenIds = useMemo(
    () => normalizeCardSetTdhTokenIds(creditNfts),
    [creditNfts]
  );
  const countLabel = getMemeCardCountLabel(tokenIds.length);

  return (
    <>
      <div className="tw-flex tw-w-full tw-flex-col tw-items-end tw-gap-1 tw-text-right tw-text-sm">
        <span className="tw-font-medium tw-text-iron-50">Card Set TDH</span>
        <span className="tw-flex tw-flex-nowrap tw-items-center tw-justify-end tw-gap-x-1.5 tw-whitespace-nowrap">
          <span className="tw-font-medium tw-text-iron-50">{countLabel}</span>
          <span className="tw-text-iron-500" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            className="hover:tw-text-primary-200 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-font-medium tw-text-primary-300 tw-transition-colors focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/40"
            onClick={() => setIsDialogOpen(true)}
          >
            View set
          </button>
        </span>
      </div>

      <WaveRatingCardSetTdhDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        tokenIds={tokenIds}
      />
    </>
  );
}
