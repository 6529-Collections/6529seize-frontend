"use client";

import { NftPicker } from "@/components/nft-picker";
import type {
  ContractOverview,
  NftPickerChange,
} from "@/components/nft-picker/types";

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
      className="[&_input]:tw-text-[16px] [&_input]:tw-font-normal [&_input]:tw-text-iron-100 [&_textarea]:tw-text-[16px] [&_textarea]:tw-font-normal md:desktop-hover:[&_input]:tw-text-[14px] md:desktop-hover:[&_textarea]:tw-text-[14px]"
      onChange={onSelectionChange}
      onContractChange={onContractChange}
      allowRanges
      allowAll
      outputMode="number"
    />
  );
}
