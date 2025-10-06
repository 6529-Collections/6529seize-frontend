import type {
  ContractOverview,
  NftPickerSelection,
} from "@/components/nft-picker/NftPicker.types";

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

const getSelectionSummary = ({
  contract,
  selection,
  amount,
}: {
  readonly contract: ContractOverview | null;
  readonly selection: NftPickerSelection | null;
  readonly amount: number | null;
}): string => {
  if (!contract && !selection) {
    return "Search for a collection to begin granting xTDH.";
  }

  const collectionLabel = contract?.name ?? contract?.symbol ?? contract?.address;

  if (!selection) {
    return collectionLabel
      ? `Collection selected: ${collectionLabel}. Choose token IDs to grant.`
      : "Choose token IDs to grant.";
  }

  let selectionText: string;
  let tokenCount: number | null = null;

  if (selection.allSelected) {
    selectionText = collectionLabel
      ? `All tokens from ${collectionLabel} will receive a grant.`
      : "All tokens from the selected collection will receive a grant.";
  } else {
    tokenCount = selection.tokenIdsRaw.length;
    selectionText = collectionLabel
      ? `${tokenCount} token${tokenCount === 1 ? "" : "s"} selected from ${collectionLabel}.`
      : `${tokenCount} token${tokenCount === 1 ? "" : "s"} selected.`;
  }

  if (amount === null) {
    return selectionText;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return selectionText;
  }

  const formattedTotal = amount.toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });

  const perTokenText =
    tokenCount && tokenCount > 0
      ? (() => {
          const perToken = amount / tokenCount;
          return Number.isFinite(perToken)
            ? ` (~${perToken.toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })} xTDH per token)`
            : "";
        })()
      : "";

  return `${selectionText} Total grant: ${formattedTotal} xTDH${perTokenText}.`;
};

const getValiditySummary = (validUntil: Date | null): string =>
  validUntil ? `Grant valid until ${formatDateTime(validUntil)}.` : "Grant never expires.";

export interface UserPageXtdhGrantSummaryProps {
  readonly contract: ContractOverview | null;
  readonly selection: NftPickerSelection | null;
  readonly amount: number | null;
  readonly validUntil: Date | null;
}

export default function UserPageXtdhGrantSummary({
  contract,
  selection,
  amount,
  validUntil,
}: Readonly<UserPageXtdhGrantSummaryProps>) {
  return (
    <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-2xl tw-p-4 tw-space-y-2">
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">
        {getSelectionSummary({ contract, selection, amount })}
      </p>
      <p className="tw-text-xs tw-text-iron-400 tw-m-0">{getValiditySummary(validUntil)}</p>
    </div>
  );
}
