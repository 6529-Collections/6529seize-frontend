"use client";

import { NftPicker } from "@/components/nft-picker/NftPicker";
import type {
  ContractOverview,
  NftPickerSelection,
} from "@/components/nft-picker/NftPicker.types";

export default function UserPageXtdhGrantSelection({
  onContractChange,
  onSelectionChange,
}: {
  readonly onContractChange: (contract: ContractOverview | null) => void;
  readonly onSelectionChange: (selection: NftPickerSelection | null) => void;
}) {
  return (
    <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-2xl tw-p-4">
      <NftPicker
        onChange={onSelectionChange}
        onContractChange={onContractChange}
        allowRanges
        allowAll
        hideSpam
        outputMode="number"
      />
    </div>
  );
}
