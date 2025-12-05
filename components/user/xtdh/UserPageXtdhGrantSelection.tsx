"use client";

import { NftPicker } from "@/components/nft-picker/NftPicker";
import type {
  ContractOverview,
  NftPickerChange,
} from "@/components/nft-picker/NftPicker.types";

export default function UserPageXtdhGrantSelection({
  onContractChange,
  onSelectionChange,
}: {
  readonly onContractChange: (contract: ContractOverview | null) => void;
  readonly onSelectionChange: (selection: NftPickerChange) => void;
}) {
  return (
    <NftPicker
      variant="flat"
      onChange={onSelectionChange}
      onContractChange={onContractChange}
      allowRanges
      allowAll
      hideSpam
      outputMode="number"
    />
  );
}
