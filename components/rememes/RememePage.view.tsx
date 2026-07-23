import Address from "@/components/address/Address";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import { OPENSEA_STORE_FRONT_CONTRACT } from "@/constants/constants";
import type { Rememe } from "@/entities/INFT";
import { areEqualAddresses, formatAddress } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

export enum Tabs {
  LIVE = "overview",
  METADATA = "metadata",
  REFERENCES = "references",
}

export function getRememeTitle(rememe: Rememe) {
  const metadata = getRememeMetadataRecord(rememe);
  const metadataName = metadata["name"];
  if (typeof metadataName === "string" && metadataName.length > 0) {
    return metadataName;
  }

  return `${formatAddress(rememe.contract)} #${rememe.id}`;
}

export function getRememeCollectionName(rememe: Rememe) {
  const collectionName = rememe.contract_opensea_data.collectionName;
  return typeof collectionName === "string" && collectionName.length > 0
    ? collectionName
    : formatAddress(rememe.contract);
}

export function getRememeMetadataRecord(
  rememe: Rememe
): Record<string, unknown> {
  if (
    rememe.metadata !== null &&
    rememe.metadata !== undefined &&
    typeof rememe.metadata === "object" &&
    !Array.isArray(rememe.metadata)
  ) {
    return rememe.metadata as Record<string, unknown>;
  }

  return {};
}

export function getRememeTokenLabel(rememe: Rememe) {
  if (areEqualAddresses(rememe.contract, OPENSEA_STORE_FRONT_CONTRACT)) {
    return rememe.contract_opensea_data.collectionName;
  }

  return `${getRememeCollectionName(rememe)} #${rememe.id}`;
}

export function RememeInfoMetric({
  label,
  children,
  valueClassName = "",
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly valueClassName?: string | undefined;
}) {
  return (
    <div className="tw-min-w-[8.5rem]">
      <div className="tw-mb-1 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400 md:tw-mb-2">
        {label}
      </div>
      <div
        className={`tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1.5 tw-break-words tw-text-sm tw-font-semibold tw-leading-5 tw-text-white md:tw-text-lg md:tw-leading-6 ${valueClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

export function RememeAddressValue({
  wallet,
  display,
}: {
  readonly wallet: string;
  readonly display?: string | undefined;
}) {
  const identity = display ?? wallet;
  const { profile } = useIdentity({
    handleOrWallet: identity,
    initialProfile: null,
  });

  return (
    <>
      <ProfileAvatar
        pfpUrl={profile?.pfp}
        size={ProfileBadgeSize.SMALL}
        alt={`${identity} avatar`}
        fallbackContent={<RememeAvatarFallback value={identity} />}
      />
      <span className="tw-min-w-0 tw-whitespace-nowrap [&_*]:tw-whitespace-nowrap">
        <Address wallets={[wallet as `0x${string}`]} display={display} />
      </span>
    </>
  );
}

function RememeAvatarFallback({ value }: { readonly value: string }) {
  return (
    <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-text-iron-400">
      {getInitials(value)}
    </span>
  );
}

function getInitials(value: string) {
  return value
    .split(/[,\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function RememeExternalLink({
  href,
  children,
  align = "center",
  openInNewTab = true,
  ariaLabel,
}: {
  readonly href: string;
  readonly children: ReactNode;
  readonly align?: "center" | "start" | undefined;
  readonly openInNewTab?: boolean | undefined;
  readonly ariaLabel?: string | undefined;
}) {
  const alignmentClass =
    align === "start" ? "tw-items-start" : "tw-items-center";

  return (
    <a
      href={href}
      {...(openInNewTab
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      aria-label={ariaLabel}
      className={`tw-inline-flex tw-min-w-0 ${alignmentClass} tw-gap-3 tw-break-all tw-rounded-sm tw-text-sm tw-font-semibold tw-leading-5 tw-text-white tw-no-underline hover:tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 md:tw-text-lg md:tw-leading-6`}
    >
      {children}
      <ArrowTopRightOnSquareIcon
        aria-hidden="true"
        className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400"
      />
    </a>
  );
}

export function RememeMetadataLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-inline-flex tw-min-w-0 tw-items-start tw-gap-2 tw-break-all tw-rounded-sm tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-300 tw-no-underline hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
    >
      {children}
      <ArrowTopRightOnSquareIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500"
      />
    </a>
  );
}

export function RememeTabButton({
  title,
  isActive,
  onClick,
}: {
  readonly title: string;
  readonly isActive: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`tw-m-0 tw-flex tw-items-center tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-1 tw-py-4 tw-text-base tw-font-semibold tw-leading-4 tw-no-underline tw-transition-colors tw-duration-150 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none ${
        isActive
          ? "tw-pointer-events-none tw-border-primary-400 tw-text-iron-100"
          : "tw-cursor-pointer tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100"
      }`}
      onClick={onClick}
      aria-pressed={isActive}
    >
      {title}
    </button>
  );
}
