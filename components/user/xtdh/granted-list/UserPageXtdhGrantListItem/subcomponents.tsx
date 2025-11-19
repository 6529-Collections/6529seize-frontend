import Image from "next/image";
import type { ReactNode } from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { ApiTdhGrantStatus } from "@/generated/models/ApiTdhGrantStatus";
import type { ContractOverview } from "@/types/nft";

import { formatContractLabel, shortenAddress } from "./formatters";
import type { GrantDetails } from "./types";
import { getStatusVisuals } from "./statusVisuals";

interface GrantItemContentProps {
  readonly contract: ContractOverview;
  readonly details: GrantDetails;
  readonly errorDetails?: string | null;
  readonly status: ApiTdhGrantStatus;
}

export function GrantItemContent({
  contract,
  details,
  errorDetails,
  status,
}: Readonly<GrantItemContentProps>) {
  const name = contract.name ?? shortenAddress(contract.address);

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <header className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
        <div className="tw-flex tw-items-start tw-gap-3">
          <div className="tw-relative tw-h-14 tw-w-14 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
            {contract.imageUrl ? (
              <Image
                src={contract.imageUrl}
                alt={name}
                fill
                sizes="56px"
                className="tw-h-full tw-w-full tw-object-cover"
              />
            ) : (
              <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
                NFT
              </div>
            )}
          </div>
          <div className="tw-flex tw-flex-col tw-gap-1">
            <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              {name}
            </p>
            <p className="tw-m-0 tw-text-xs tw-text-iron-400">
              {shortenAddress(contract.address)}
            </p>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <GrantExpiryBadge value={details.validUntilLabel} />
          <StatusBadge status={status} />
        </div>
      </header>
      <GrantDetailsGrid details={details} />
      {errorDetails ? <GrantErrorDetails message={errorDetails} /> : null}
    </div>
  );
}

interface GrantItemErrorProps {
  readonly contractLabel: string;
  readonly details: GrantDetails;
  readonly errorDetails?: string | null;
  readonly status: ApiTdhGrantStatus;
}

export function GrantItemError({
  contractLabel,
  details,
  errorDetails,
  status,
}: Readonly<GrantItemErrorProps>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <header className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
        <div>
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            Contract details unavailable
          </p>
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {`We couldn't load metadata for ${formatContractLabel(contractLabel)}.`}
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <GrantExpiryBadge value={details.validUntilLabel} />
          <StatusBadge status={status} />
        </div>
      </header>
      <GrantDetailsGrid details={details} />
      {errorDetails ? <GrantErrorDetails message={errorDetails} /> : null}
    </div>
  );
}

const GRANT_DETAILS_SKELETON_FIELDS = [
  "token-type",
  "total-supply",
  "floor-price",
  "tokens-granted",
  "tdh-rate",
  "valid-from",
] as const;

export function GrantItemSkeleton() {
  return (
    <div className="tw-animate-pulse tw-space-y-4">
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
        <div className="tw-flex tw-items-start tw-gap-3">
          <div className="tw-h-14 tw-w-14 tw-rounded-lg tw-bg-iron-800" />
          <div className="tw-space-y-2">
            <div className="tw-h-4 tw-w-36 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-iron-800" />
          </div>
        </div>
        <div className="tw-h-5 tw-w-16 tw-rounded-full tw-bg-iron-800" />
      </div>
      <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
        {GRANT_DETAILS_SKELETON_FIELDS.map((field) => (
          <div key={field} className="tw-space-y-2">
            <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GrantDetailsGrid({
  details,
}: Readonly<{ details: GrantDetails }>) {
  return (
    <dl className="tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
      <GrantDetailsRow label="Token type" value={details.tokenTypeLabel} />
      <GrantDetailsRow label="Total supply" value={details.totalSupplyLabel} />
      <GrantDetailsRow label="Floor price" value={details.floorPriceLabel} />
      <GrantDetailsRow
        label="Tokens granted"
        value={details.tokensCountLabel}
      />
      <GrantDetailsRow
        label="TDH rate"
        value={
          <div className="tw-flex tw-items-baseline tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-100">
            <span>{details.tdhRateLabel}</span>
            {details.tdhRatePerTokenLabel ? (
              <span
                className="tw-text-xs tw-font-semibold tw-text-iron-400 tw-whitespace-nowrap"
                title={details.tdhRatePerTokenHint ?? undefined}
              >
                ({details.tdhRatePerTokenLabel}/token)
              </span>
            ) : null}
          </div>
        }
      />
      <GrantDetailsRow label="Valid from" value={details.validFromLabel} />
    </dl>
  );
}

function GrantDetailsRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-0.5">
      <dt className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
        {value}
      </dd>
    </div>
  );
}

function GrantExpiryBadge({
  value,
}: Readonly<{ value: ReactNode }>) {
  return (
    <div className="tw-min-w-[140px] tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2">
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-50">
        <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
          Expires:
        </span>
        <span className="tw-ml-2 tw-text-iron-50">{value}</span>
      </p>
    </div>
  );
}

function StatusBadge({ status }: Readonly<{ status: ApiTdhGrantStatus }>) {
  const { badgeClassName, icon, label } = getStatusVisuals(status);

  return (
    <output
      aria-label={`${label} grant status`}
      className={clsx(
        "tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-px-3 tw-py-1 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-transition-colors tw-duration-200",
        badgeClassName
      )}>
      <FontAwesomeIcon
        icon={icon}
        aria-hidden="true"
        className="tw-text-base tw-leading-none tw-drop-shadow-sm"
      />
      <span>{label}</span>
    </output>
  );
}

function GrantErrorDetails({ message }: Readonly<{ message: string }>) {
  return (
    <section
      aria-live="polite"
      className="tw-rounded-lg tw-border tw-border-red-500/40 tw-bg-red-500/5 tw-p-3 tw-text-red-200">
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-red-300">
        Error details
      </p>
      <p className="tw-m-0 tw-mt-1 tw-whitespace-pre-line tw-text-sm">
        {message}
      </p>
    </section>
  );
}
