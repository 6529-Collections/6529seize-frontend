"use client";

import { useMemo, useState } from "react";
import { NftPicker } from "@/components/nft-picker/NftPicker";
import type {
  ContractOverview,
  NftPickerSelection,
} from "@/components/nft-picker/NftPicker.types";

export default function UserPageXtdhGrant() {
  const [contract, setContract] = useState<ContractOverview | null>(null);
  const [selection, setSelection] = useState<NftPickerSelection | null>(null);

  const summary = useMemo(() => {
    if (!contract && !selection) {
      return "Search for a collection to begin granting xTDH.";
    }

    const collectionLabel =
      contract?.name ?? contract?.symbol ?? contract?.address;

    if (!selection) {
      return collectionLabel
        ? `Collection selected: ${collectionLabel}. Choose token IDs to grant.`
        : "Choose token IDs to grant.";
    }

    if (selection.allSelected) {
      return collectionLabel
        ? `All tokens from ${collectionLabel} will receive a grant.`
        : "All tokens from the selected collection will receive a grant.";
    }

    const tokenCount = selection.tokenIdsRaw.length;
    return collectionLabel
      ? `${tokenCount} token${tokenCount === 1 ? "" : "s"} selected from ${collectionLabel}.`
      : `${tokenCount} token${tokenCount === 1 ? "" : "s"} selected.`;
  }, [contract, selection]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <div className="tw-text-sm tw-text-iron-300">{summary}</div>
      <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-2xl tw-p-4">
        <NftPicker
          onChange={setSelection}
          onContractChange={setContract}
          allowRanges
          allowAll
          hideSpam
          outputMode="number"
        />
      </div>
    </div>
  );
}
