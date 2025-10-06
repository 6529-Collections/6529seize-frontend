"use client";

import { useState } from "react";
import type {
  ContractOverview,
  NftPickerSelection,
} from "@/components/nft-picker/NftPicker.types";
import UserPageXtdhGrantSummary from "./UserPageXtdhGrantSummary";
import UserPageXtdhGrantAmount from "./UserPageXtdhGrantAmount";
import UserPageXtdhGrantValidity from "./UserPageXtdhGrantValidity";
import UserPageXtdhGrantSelection from "./UserPageXtdhGrantSelection";

export default function UserPageXtdhGrant() {
  const [contract, setContract] = useState<ContractOverview | null>(null);
  const [selection, setSelection] = useState<NftPickerSelection | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [validUntil, setValidUntil] = useState<Date | null>(null);

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <UserPageXtdhGrantSummary
        contract={contract}
        selection={selection}
        amount={amount}
        validUntil={validUntil}
      />

      <UserPageXtdhGrantValidity value={validUntil} onChange={setValidUntil} />

      <UserPageXtdhGrantAmount amount={amount} onAmountChange={setAmount} />

      <UserPageXtdhGrantSelection
        onSelectionChange={setSelection}
        onContractChange={setContract}
      />
    </div>
  );
}
