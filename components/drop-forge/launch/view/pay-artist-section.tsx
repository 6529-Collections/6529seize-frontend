import DropForgeFieldBox from "@/components/drop-forge/DropForgeFieldBox";
import {
  BTN_SUBSCRIPTIONS_AIRDROP,
  DropForgeSectionTitleWithToggle,
} from "@/components/drop-forge/launch/view/common";
import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";
import type { ApiMemesMintStat } from "@/generated/models/ApiMemesMintStat";
import type { ApiMintingClaimAction } from "@/generated/models/ApiMintingClaimAction";

const MINT_STAT_LOADING_LABEL = "loading...";
const PAY_ARTIST_INPUT_CLASS_NAME =
  "tw-block tw-h-auto tw-w-full !tw-rounded-none !tw-border-0 !tw-bg-transparent !tw-p-0 !tw-text-base !tw-font-normal !tw-leading-6 !tw-text-white !tw-shadow-none [color-scheme:dark] placeholder:!tw-text-iron-500 focus:!tw-border-0 focus:!tw-bg-transparent focus:!tw-text-white focus:!tw-shadow-none focus:!tw-outline-none focus:!tw-ring-0";

function getPayArtistSalesLabel(mintStat: ApiMemesMintStat | null): string {
  if (!mintStat) {
    return "—";
  }

  return `${mintStat.total_count.toLocaleString()} (${mintStat.subscriptions_count.toLocaleString()} / ${mintStat.mint_count.toLocaleString()})`;
}

function formatMintStatEth(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    return "—";
  }
  return normalized.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

interface PayArtistDisplayState {
  isMintStatPending: boolean;
  amountClassName: string;
  amountLabelClassName: string;
  addressClassName: string;
  addressLabelClassName: string;
  mintStatLoadingClassName: string;
}

function getPayArtistDisplayState({
  mintStat,
  mintStatLoading,
  mintStatError,
  payArtistAmountEth,
  payArtistAddressMissing,
}: Readonly<{
  mintStat: ApiMemesMintStat | null;
  mintStatLoading: boolean;
  mintStatError: string | null;
  payArtistAmountEth: string;
  payArtistAddressMissing: boolean;
}>): PayArtistDisplayState {
  const isMintStatResolved = mintStat !== null || mintStatError !== null;
  const isMintStatPending = !isMintStatResolved || mintStatLoading;
  const amountInvalid = !isMintStatPending && payArtistAmountEth.trim() === "";
  const addressInvalid = !isMintStatPending && payArtistAddressMissing;
  return {
    isMintStatPending,
    amountClassName: amountInvalid ? "tw-ring-rose-500/70" : "",
    amountLabelClassName: amountInvalid
      ? "tw-text-rose-300 tw-ring-rose-500/70"
      : "",
    addressClassName: addressInvalid ? "tw-ring-rose-500/70" : "",
    addressLabelClassName: addressInvalid
      ? "tw-text-rose-300 tw-ring-rose-500/70"
      : "",
    mintStatLoadingClassName: isMintStatPending ? "!tw-text-iron-500" : "",
  };
}

function DropForgePayArtistDesignatedPayeeNote({
  paymentDetails,
}: Readonly<{
  paymentDetails: ApiMemesMintStat["payment_details"] | null;
}>) {
  if (
    !paymentDetails?.has_designated_payee ||
    !paymentDetails.designated_payee_name
  ) {
    return null;
  }
  return (
    <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
      Designated payee:{" "}
      <span className="tw-text-iron-200">
        {paymentDetails.designated_payee_name}
      </span>
    </p>
  );
}

function DropForgePayArtistSalesField({
  label,
  isMintStatPending,
  mintStatLoadingClassName,
  children,
}: Readonly<{
  label: string;
  isMintStatPending: boolean;
  mintStatLoadingClassName: string;
  children: React.ReactNode;
}>) {
  return (
    <DropForgeFieldBox
      label={label}
      contentClassName={mintStatLoadingClassName}
    >
      {isMintStatPending ? MINT_STAT_LOADING_LABEL : children}
    </DropForgeFieldBox>
  );
}

function DropForgePayArtistSalesRow({
  mintStat,
  isMintStatPending,
  mintStatLoadingClassName,
}: Readonly<{
  mintStat: ApiMemesMintStat | null;
  isMintStatPending: boolean;
  mintStatLoadingClassName: string;
}>) {
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-3 lg:tw-gap-x-5">
      <DropForgePayArtistSalesField
        label="Total Sales (Subscriptions / Mints)"
        isMintStatPending={isMintStatPending}
        mintStatLoadingClassName={mintStatLoadingClassName}
      >
        {getPayArtistSalesLabel(mintStat)}
      </DropForgePayArtistSalesField>
      <DropForgePayArtistSalesField
        label="Proceeds (ETH)"
        isMintStatPending={isMintStatPending}
        mintStatLoadingClassName={mintStatLoadingClassName}
      >
        {formatMintStatEth(mintStat?.proceeds_eth)}
      </DropForgePayArtistSalesField>
      <DropForgePayArtistSalesField
        label="Artist Split (ETH)"
        isMintStatPending={isMintStatPending}
        mintStatLoadingClassName={mintStatLoadingClassName}
      >
        {formatMintStatEth(mintStat?.artist_split_eth)}
      </DropForgePayArtistSalesField>
    </div>
  );
}

function DropForgePayArtistAmountField({
  payArtistAmountEth,
  onPayArtistAmountChange,
  isMintStatPending,
  displayState,
}: Readonly<{
  payArtistAmountEth: string;
  onPayArtistAmountChange: (value: string) => void;
  isMintStatPending: boolean;
  displayState: PayArtistDisplayState;
}>) {
  return (
    <DropForgeFieldBox
      label="Pay Artist (ETH)"
      className={displayState.amountClassName}
      labelClassName={displayState.amountLabelClassName}
      contentClassName={displayState.mintStatLoadingClassName}
    >
      {isMintStatPending ? (
        MINT_STAT_LOADING_LABEL
      ) : (
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.0001"
          value={payArtistAmountEth}
          onChange={(e) => onPayArtistAmountChange(e.target.value)}
          placeholder="Enter ETH Amount"
          className={PAY_ARTIST_INPUT_CLASS_NAME}
        />
      )}
    </DropForgeFieldBox>
  );
}

function DropForgePayArtistAddressField({
  payArtistAddressInput,
  payArtistAddressLoading,
  payArtistAddressError,
  onPayArtistResolvedAddressChange,
  onPayArtistAddressLoadingChange,
  onPayArtistAddressEnsErrorChange,
  isMintStatPending,
  displayState,
}: Readonly<{
  payArtistAddressInput: string;
  payArtistAddressLoading: boolean;
  payArtistAddressError: string | null;
  onPayArtistResolvedAddressChange: (value: string) => void;
  onPayArtistAddressLoadingChange: (isLoading: boolean) => void;
  onPayArtistAddressEnsErrorChange: (hasError: boolean) => void;
  isMintStatPending: boolean;
  displayState: PayArtistDisplayState;
}>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1.5">
      <DropForgeFieldBox
        label="Payment Address"
        className={displayState.addressClassName}
        labelClassName={displayState.addressLabelClassName}
        contentClassName={displayState.mintStatLoadingClassName}
      >
        {isMintStatPending ? (
          MINT_STAT_LOADING_LABEL
        ) : (
          <EnsAddressInput
            value={payArtistAddressInput}
            placeholder="0x... or ENS"
            onAddressChange={onPayArtistResolvedAddressChange}
            onLoadingChange={onPayArtistAddressLoadingChange}
            onError={onPayArtistAddressEnsErrorChange}
            className={PAY_ARTIST_INPUT_CLASS_NAME}
          />
        )}
      </DropForgeFieldBox>
      {payArtistAddressLoading ? (
        <span className="tw-px-1 tw-text-xs tw-text-iron-400">
          Resolving ENS…
        </span>
      ) : null}
      {payArtistAddressError ? (
        <span className="tw-px-1 tw-text-xs tw-text-rose-300">
          {payArtistAddressError}
        </span>
      ) : null}
    </div>
  );
}

function DropForgePayArtistActionButton({
  disabled,
  pending,
  onClick,
}: Readonly<{
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
}>) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 lg:tw-self-start">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={BTN_SUBSCRIPTIONS_AIRDROP}
      >
        {pending ? "Processing..." : "Pay Artist"}
      </button>
    </div>
  );
}

export function DropForgePayArtistSection({
  mintStat,
  mintStatLoading,
  mintStatError,
  payArtistAmountEth,
  onPayArtistAmountChange,
  payArtistAddressInput,
  payArtistAddressLoading,
  payArtistAddressMissing,
  payArtistAddressError,
  onPayArtistResolvedAddressChange,
  onPayArtistAddressLoadingChange,
  onPayArtistAddressEnsErrorChange,
  payArtistActionDisabled,
  payArtistWritePending,
  runPayArtistWrite,
  payArtistAction,
  mintingClaimActionPending,
  onMintingClaimActionToggle,
}: Readonly<{
  mintStat: ApiMemesMintStat | null;
  mintStatLoading: boolean;
  mintStatError: string | null;
  payArtistAmountEth: string;
  onPayArtistAmountChange: (value: string) => void;
  payArtistAddressInput: string;
  payArtistAddressLoading: boolean;
  payArtistAddressMissing: boolean;
  payArtistAddressError: string | null;
  onPayArtistResolvedAddressChange: (value: string) => void;
  onPayArtistAddressLoadingChange: (isLoading: boolean) => void;
  onPayArtistAddressEnsErrorChange: (hasError: boolean) => void;
  payArtistActionDisabled: boolean;
  payArtistWritePending: boolean;
  runPayArtistWrite: (mintingClaimAction: string | null) => void;
  payArtistAction?: ApiMintingClaimAction | null;
  mintingClaimActionPending: string | null;
  onMintingClaimActionToggle: (
    action: string,
    completed: boolean
  ) => Promise<void>;
}>) {
  const isCompleted = payArtistAction?.completed ?? false;
  const isActionToggleDisabled =
    payArtistWritePending || mintingClaimActionPending !== null;
  const payArtistActionName = payArtistAction?.action ?? null;
  const paymentDetails = mintStat?.payment_details ?? null;
  const displayState = getPayArtistDisplayState({
    mintStat,
    mintStatLoading,
    mintStatError,
    payArtistAmountEth,
    payArtistAddressMissing,
  });
  const { isMintStatPending, mintStatLoadingClassName } = displayState;
  const isButtonDisabled =
    payArtistActionDisabled ||
    isCompleted ||
    mintingClaimActionPending !== null;

  return (
    <div className="tw-space-y-5 tw-pt-4">
      <DropForgeSectionTitleWithToggle
        title="Pay Artist"
        action={payArtistAction}
        toggleDisabled={isActionToggleDisabled}
        toggleAriaLabel="Pay artist completed"
        onActionToggle={onMintingClaimActionToggle}
      />

      {mintStatError ? (
        <p className="tw-mb-0 tw-text-sm tw-text-rose-300">{mintStatError}</p>
      ) : null}

      <DropForgePayArtistDesignatedPayeeNote paymentDetails={paymentDetails} />

      <DropForgePayArtistSalesRow
        mintStat={mintStat}
        isMintStatPending={isMintStatPending}
        mintStatLoadingClassName={mintStatLoadingClassName}
      />

      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-[minmax(0,0.6fr)_minmax(0,2.4fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgePayArtistAmountField
          payArtistAmountEth={payArtistAmountEth}
          onPayArtistAmountChange={onPayArtistAmountChange}
          isMintStatPending={isMintStatPending}
          displayState={displayState}
        />
        <DropForgePayArtistAddressField
          payArtistAddressInput={payArtistAddressInput}
          payArtistAddressLoading={payArtistAddressLoading}
          payArtistAddressError={payArtistAddressError}
          onPayArtistResolvedAddressChange={onPayArtistResolvedAddressChange}
          onPayArtistAddressLoadingChange={onPayArtistAddressLoadingChange}
          onPayArtistAddressEnsErrorChange={onPayArtistAddressEnsErrorChange}
          isMintStatPending={isMintStatPending}
          displayState={displayState}
        />
        <DropForgePayArtistActionButton
          disabled={isButtonDisabled}
          pending={payArtistWritePending}
          onClick={() => runPayArtistWrite(payArtistActionName)}
        />
      </div>
    </div>
  );
}
