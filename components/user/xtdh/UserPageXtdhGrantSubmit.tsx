"use client";

import clsx from "clsx";
import { isAddress } from "viem";
import type { ContractOverview } from "@/components/nft-picker/NftPicker.types";

export interface UserPageXtdhGrantSubmitProps {
  readonly contract: ContractOverview | null;
  readonly amount: number | null;
  readonly validUntil: Date | null;
  readonly onSubmit: () => void;
  readonly isSubmitting?: boolean;
}

const isFutureDate = (value: Date): boolean => {
  const timestamp = value.getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
};

const isValidGrant = ({
  contract,
  amount,
  validUntil,
}: {
  readonly contract: ContractOverview | null;
  readonly amount: number | null;
  readonly validUntil: Date | null;
}): boolean => {
  if (!contract || !isAddress(contract.address)) {
    return false;
  }

  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    return false;
  }

  if (validUntil === null) {
    return true;
  }

  return isFutureDate(validUntil);
};

export default function UserPageXtdhGrantSubmit({
  contract,
  amount,
  validUntil,
  onSubmit,
  isSubmitting = false,
}: Readonly<UserPageXtdhGrantSubmitProps>) {
  const isValid = isValidGrant({ contract, amount, validUntil });
  const disabled = isSubmitting || !isValid;

  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={disabled}
      className={clsx(
        "tw-w-full tw-rounded-lg tw-py-3 tw-text-sm tw-font-semibold tw-transition tw-duration-200 tw-ease-out",
        disabled
          ? "tw-cursor-not-allowed tw-bg-iron-800 tw-text-iron-400"
          : "tw-bg-primary-500 tw-text-black hover:tw-bg-primary-400"
      )}>
      {isSubmitting ? "Submitting..." : "Submit grant"}
    </button>
  );
}
