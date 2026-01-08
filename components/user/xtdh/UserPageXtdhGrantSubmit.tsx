import clsx from "clsx";
import { isAddress } from "viem";
import type {
  ContractOverview,
  NftPickerChange,
  NftPickerSelectionError,
} from "@/components/nft-picker/NftPicker.types";
import { formatNumberWithCommas } from "@/helpers/Helpers";

export interface UserPageXtdhGrantSubmitProps {
  readonly contract: ContractOverview | null;
  readonly selection: NftPickerChange;
  readonly amount: number | null;
  readonly validUntil: Date | null;
  readonly onSubmit: () => void | Promise<void>;
  readonly isSubmitting?: boolean | undefined;
  readonly errorMessage?: string | null | undefined;
  readonly successMessage?: string | null | undefined;
  readonly maxGrantRate?: number | null | undefined;
}

const hasFutureExpiry = (value: Date): boolean => {
  const timestamp = value.getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
};

const isSelectionError = (
  selection: NftPickerChange
): selection is NftPickerSelectionError =>
  Boolean(selection && "type" in selection);

const canSubmit = ({
  contract,
  selection,
  amount,
  validUntil,
  maxGrantRate,
}: {
  readonly contract: ContractOverview | null;
  readonly selection: NftPickerChange;
  readonly amount: number | null;
  readonly validUntil: Date | null;
  readonly maxGrantRate?: number | null | undefined;
}): boolean => {
  if (!contract || !isAddress(contract.address)) {
    return false;
  }

  if (!selection || isSelectionError(selection)) {
    return false;
  }

  if (selection.contractAddress !== contract.address) {
    return false;
  }

  if (!selection.allSelected && selection.tokenIds.length === 0) {
    return false;
  }

  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    return false;
  }

  if (
    maxGrantRate !== null &&
    maxGrantRate !== undefined &&
    Number.isFinite(maxGrantRate) &&
    amount > maxGrantRate
  ) {
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
  maxGrantRate,
}: Readonly<UserPageXtdhGrantSubmitProps>) {
  const isValid = canSubmit({
    contract,
    selection,
    amount,
    validUntil,
    maxGrantRate,
  });
  const disabled = isSubmitting || !isValid;

  const isAmountExceeded =
    amount !== null &&
    maxGrantRate !== null &&
    maxGrantRate !== undefined &&
    Number.isFinite(maxGrantRate) &&
    amount > maxGrantRate;

  const onSubmitClick = async (): Promise<void> => await onSubmit();

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <button
        type="button"
        onClick={onSubmitClick}
        disabled={disabled}
        className={clsx(
          "tw-w-full tw-rounded-lg tw-border tw-border-transparent tw-py-3 tw-text-sm tw-font-semibold tw-shadow-sm tw-transition tw-duration-200 tw-ease-out",
          disabled
            ? "tw-cursor-not-allowed tw-border-iron-600 tw-bg-iron-700 tw-text-iron-200 tw-shadow-none"
            : "tw-bg-primary-500 tw-text-black hover:tw-border-primary-300 hover:tw-bg-primary-400"
        )}
      >
        {isSubmitting ? "Submitting..." : "Submit grant"}
      </button>

      {isAmountExceeded && (
        <p
          className="tw-text-red-400 tw-m-0 tw-text-sm tw-font-medium"
          role="alert"
        >
          Amount exceeds your available grant rate (
          {formatNumberWithCommas(Math.floor(maxGrantRate * 10) / 10)}).
        </p>
      )}

      {errorMessage && (
        <p
          className="tw-text-red-400 tw-m-0 tw-text-sm tw-font-medium"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      {!errorMessage && successMessage && (
        <output className="tw-m-0 tw-block tw-text-sm tw-font-medium tw-text-emerald-400">
          {successMessage}
        </output>
      )}
    </div>
  );
}
