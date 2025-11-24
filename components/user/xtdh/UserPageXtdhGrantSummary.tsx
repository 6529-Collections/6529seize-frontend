import type {
  ContractOverview,
  NftPickerChange,
  NftPickerSelection,
  NftPickerSelectionError,
} from "@/components/nft-picker/NftPicker.types";
import {
  formatDateTime,
  formatTdhRatePerToken,
} from "@/components/user/xtdh/utils/xtdhGrantFormatters";

type SelectionDescription = {
  readonly text: string;
  readonly tokenCount: number | null;
};

const describeCollectionSelection = (collectionLabel: string | null): string =>
  collectionLabel
    ? `Collection selected: ${collectionLabel}. Choose token IDs to grant.`
    : "Choose token IDs to grant.";

const describeAllTokensGrantText = (collectionLabel: string | null): string =>
  collectionLabel
    ? `All tokens from ${collectionLabel} will receive a grant.`
    : "All tokens from the selected collection will receive a grant.";

const describeTokenSelectionText = (
  tokenLabel: string,
  collectionLabel: string | null,
): string =>
  collectionLabel
    ? `${tokenLabel} selected from ${collectionLabel}.`
    : `${tokenLabel} selected.`;

const getTokenLabel = (tokenCount: number): string =>
  `${tokenCount} token${tokenCount === 1 ? "" : "s"}`;

const getTotalSupplyCount = (contract: ContractOverview | null): number | null => {
  if (!contract?.totalSupply) {
    return null;
  }

  const parsedSupply = Number(contract.totalSupply);
  const normalizedSupply = Math.trunc(parsedSupply);

  if (!Number.isSafeInteger(normalizedSupply) || normalizedSupply <= 0) {
    return null;
  }

  return normalizedSupply;
};

const describeSelection = (
  selection: NftPickerSelection,
  collectionLabel: string | null,
  totalSupplyCount: number | null,
): SelectionDescription => {
  if (selection.allSelected) {
    return {
      text: describeAllTokensGrantText(collectionLabel),
      tokenCount: totalSupplyCount,
    };
  }

  const tokenCount = selection.tokenIds.length;

  return {
    text: describeTokenSelectionText(getTokenLabel(tokenCount), collectionLabel),
    tokenCount,
  };
};

const isValidGrantAmount = (amount: number | null): amount is number =>
  amount !== null && Number.isFinite(amount) && amount > 0;

const isSelectionError = (
  selection: NftPickerChange
): selection is NftPickerSelectionError =>
  Boolean(selection && "type" in selection && selection.type === "error");

const getPerTokenText = (amount: number, tokenCount: number | null): string => {
  if (!tokenCount || tokenCount <= 0) {
    return "";
  }

  const perTokenText = formatTdhRatePerToken(amount, tokenCount);
  if (!perTokenText) {
    return "";
  }

  return ` (~${perTokenText} xTDH per token)`;
};

const getAmountSummaryText = (amount: number, tokenCount: number | null): string => {
  const formattedTotal = amount.toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });

  const perTokenText = getPerTokenText(amount, tokenCount);

  return `Total grant: ${formattedTotal} xTDH${perTokenText}.`;
};

const getCollectionLabel = (contract: ContractOverview | null): string | null => {
  if (!contract) {
    return null;
  }

  if (typeof contract.name === "string") {
    return contract.name;
  }

  if (typeof contract.symbol === "string") {
    return contract.symbol;
  }

  return contract.address ?? null;
};

const getSelectionSummary = ({
  contract,
  selection,
  amount,
}: {
  readonly contract: ContractOverview | null;
  readonly selection: NftPickerChange;
  readonly amount: number | null;
}): string => {
  if (!contract && !selection) {
    return "Search for a collection to begin granting xTDH.";
  }

  const collectionLabel = getCollectionLabel(contract);

  if (!selection) {
    return describeCollectionSelection(collectionLabel);
  }

  if (isSelectionError(selection)) {
    return selection.error;
  }

  const totalSupplyCount = getTotalSupplyCount(contract);
  const { text: selectionText, tokenCount } = describeSelection(
    selection,
    collectionLabel,
    totalSupplyCount
  );

  if (!isValidGrantAmount(amount)) {
    return selectionText;
  }

  return `${selectionText} ${getAmountSummaryText(amount, tokenCount)}`;
};

const getValiditySummary = (validUntil: Date | null): string => {
  if (!validUntil) {
    return "Grant never expires.";
  }

  const timestamp = validUntil.getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "Grant never expires.";
  }

  return `Grant valid until ${formatDateTime(timestamp)}.`;
};

export interface UserPageXtdhGrantSummaryProps {
  readonly contract: ContractOverview | null;
  readonly selection: NftPickerChange;
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
    <div className="tw-flex tw-flex-col tw-gap-1">
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {getSelectionSummary({ contract, selection, amount })}
      </p>
      <p className="tw-m-0 tw-text-xs tw-text-iron-400">{getValiditySummary(validUntil)}</p>
    </div>
  );
}
