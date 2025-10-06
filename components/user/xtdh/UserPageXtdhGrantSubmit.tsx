"use client";

import clsx from "clsx";
import { isAddress } from "viem";
import type {
  ContractOverview,
  NftPickerSelection,
} from "@/components/nft-picker/NftPicker.types";

export interface UserPageXtdhGrantSubmitProps {
  readonly contract: ContractOverview | null;
  readonly selection: NftPickerSelection | null;
  readonly amount: number | null;
  readonly validUntil: Date | null;
  readonly onSubmit: () => void | Promise<void>;
  readonly isSubmitting?: boolean;
  readonly errorMessage?: string | null;
  readonly successMessage?: string | null;
}

const hasFutureExpiry = (value: Date): boolean => {
  const timestamp = value.getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
};

const canSubmit = ({
  contract,
  selection,
  amount,
  validUntil,
}: {
  readonly contract: ContractOverview | null;
  readonly selection: NftPickerSelection | null;
  readonly amount: number | null;
  readonly validUntil: Date | null;
}): boolean => {
  if (!contract || !isAddress(contract.address)) {
    return false;
  }

  if (!selection) {
    return false;
  }

  if (selection.contractAddress !== contract.address) {
    return false;
  }

  if (!selection.allSelected && selection.tokenIdsRaw.length === 0) {
    return false;
  }

  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    return false;
  }

  if (validUntil === null) {
    return true;
  }

  return hasFutureExpiry(validUntil);
};

export default function UserPageXtdhGrantSubmit({
  contract,
  selection,
  amount,
  validUntil,
  onSubmit,
  isSubmitting = false,
  errorMessage,
  successMessage,
}: Readonly<UserPageXtdhGrantSubmitProps>) {
  const isValid = canSubmit({ contract, selection, amount, validUntil });
  const disabled = isSubmitting || !isValid;

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            void onSubmit();
          }
        }}
        disabled={disabled}
        className={clsx(
          "tw-w-full tw-rounded-lg tw-py-3 tw-text-sm tw-font-semibold tw-transition tw-duration-200 tw-ease-out",
          disabled
            ? "tw-cursor-not-allowed tw-bg-iron-800 tw-text-iron-400"
            : "tw-bg-primary-500 tw-text-black hover:tw-bg-primary-400"
        )}>
        {isSubmitting ? "Submitting..." : "Submit grant"}
      </button>

      {errorMessage && (
        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-red-400" role="alert">
          {errorMessage}
        </p>
      )}

      {!errorMessage && successMessage && (
        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-emerald-400" role="status">
          {successMessage}
        </p>
      )}
    </div>
  );
}
