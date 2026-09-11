import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Toggle from "react-toggle";
import DropForgeLaunchIcon from "@/components/common/icons/DropForgeLaunchIcon";
import DropForgeExplorerLink from "@/components/drop-forge/DropForgeExplorerLink";
import DropForgeFieldBox from "@/components/drop-forge/DropForgeFieldBox";
import { DropForgePermissionFallback } from "@/components/drop-forge/DropForgePermissionFallback";
import DropForgeStorageLinkCard from "@/components/drop-forge/DropForgeStorageLinkCard";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import { getDropForgeStorageLocationInfo } from "@/components/drop-forge/drop-forge-storage-location.helpers";
import type { DropForgeLaunchClaimPermissionFallbackViewProps } from "@/components/drop-forge/launch/view/types";
import type { ApiMintingClaimAction } from "@/generated/models/ApiMintingClaimAction";

export const BTN_SUBSCRIPTIONS_AIRDROP =
  "tw-h-12 tw-w-full lg:tw-w-64 tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-400/60 tw-bg-primary-500 tw-px-5 tw-text-base tw-font-semibold tw-text-white tw-transition-colors tw-duration-150 enabled:hover:tw-bg-primary-600 enabled:hover:tw-ring-primary-300 enabled:active:tw-bg-primary-700 enabled:active:tw-ring-primary-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
export const BTN_METADATA_UPDATE_ACTION =
  "tw-h-12 tw-w-full lg:tw-w-64 tw-rounded-lg tw-border-0 tw-bg-orange-600 tw-px-5 tw-text-base tw-font-semibold tw-text-orange-50 tw-ring-1 tw-ring-inset tw-ring-orange-300/60 tw-shadow-[0_8px_18px_rgba(234,88,12,0.25)] tw-transition-colors tw-duration-150 enabled:hover:tw-bg-orange-500 enabled:active:tw-bg-orange-700 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
export const ARWEAVE_LINK_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3";
const ARWEAVE_LINK_CARD_CLASS =
  "tw-flex tw-flex-col tw-items-stretch tw-gap-2 tw-rounded-lg tw-bg-iron-900/60 tw-px-4 tw-py-3 tw-ring-1 tw-ring-inset tw-ring-iron-800";

export function DropForgePhaseDateTimeField({
  label,
  value,
  onChange,
  isPhaseSelected,
  changed,
  changedFieldBoxClassName,
  changedFieldBoxLabelClassName,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  isPhaseSelected: boolean;
  changed: boolean;
  changedFieldBoxClassName: string;
  changedFieldBoxLabelClassName: string;
}>) {
  return (
    <DropForgeFieldBox
      label={label}
      className={changed ? changedFieldBoxClassName : ""}
      labelClassName={changed ? changedFieldBoxLabelClassName : ""}
    >
      <input
        type="datetime-local"
        value={isPhaseSelected ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={!isPhaseSelected}
        className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
      />
    </DropForgeFieldBox>
  );
}

function DropForgeLaunchPageTitleRight() {
  return (
    <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-2 sm:tw-w-auto sm:tw-justify-end">
      <DropForgeExplorerLink />
      <DropForgeTestnetIndicator />
    </div>
  );
}

export function DropForgeLaunchClaimPermissionFallbackView({
  pageTitle,
  permissionsLoading,
  hasWallet,
  canAccessLaunchPage,
}: Readonly<DropForgeLaunchClaimPermissionFallbackViewProps>) {
  return (
    <DropForgePermissionFallback
      title={pageTitle}
      permissionsLoading={permissionsLoading}
      hasWallet={hasWallet}
      hasAccess={canAccessLaunchPage}
      titleIcon={DropForgeLaunchIcon}
      titleRight={<DropForgeLaunchPageTitleRight />}
    />
  );
}

export function DropForgeLaunchClaimHeader({
  pageTitle,
  craftHref,
}: Readonly<{ pageTitle: string; craftHref: string }>) {
  return (
    <div className="tw-mb-6">
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-gap-4">
        <Link
          href="/drop-forge/launch"
          className="tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50 sm:tw-w-auto sm:tw-justify-start"
        >
          <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          Back to Launch list
        </Link>
        <Link
          href={craftHref}
          className="tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50 sm:tw-ml-auto sm:tw-w-auto sm:tw-justify-start"
        >
          <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          Go to Craft
        </Link>
      </div>
      <div className="tw-mt-2 tw-flex tw-flex-col tw-items-center tw-gap-3 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <h1 className="tw-mb-0 tw-inline-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-2 tw-text-center tw-text-2xl tw-font-semibold tw-text-iron-50 sm:tw-w-auto sm:tw-justify-start sm:tw-gap-3 sm:tw-text-left sm:tw-text-3xl">
          <DropForgeLaunchIcon className="tw-h-7 tw-w-7 tw-flex-shrink-0 sm:tw-h-8 sm:tw-w-8" />
          <span className="tw-break-words">{pageTitle}</span>
        </h1>
        <DropForgeLaunchPageTitleRight />
      </div>
    </div>
  );
}

export function DropForgeExternalUrlFieldValue({
  externalUrl,
  safeExternalUrl,
}: Readonly<{
  externalUrl: string | null | undefined;
  safeExternalUrl: string | null;
}>) {
  if (!externalUrl) {
    return "—";
  }

  if (!safeExternalUrl) {
    return <span className="tw-break-all">{externalUrl}</span>;
  }

  return (
    <a
      href={safeExternalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:tw-text-primary-200 tw-break-all tw-text-primary-300 tw-no-underline"
    >
      {externalUrl}
    </a>
  );
}

export function DropForgeArweaveLinkValue({
  value,
  truncate = false,
}: Readonly<{ value: string | null | undefined; truncate?: boolean }>) {
  const locationInfo = getDropForgeStorageLocationInfo(value);
  const url = locationInfo?.openUrl ?? null;
  const text = (locationInfo?.displayValue ?? value) || "—";

  if (!url) {
    return text;
  }

  const className = truncate
    ? "hover:tw-text-primary-200 tw-block tw-max-w-full tw-truncate tw-text-primary-300 tw-no-underline"
    : "hover:tw-text-primary-200 tw-text-primary-300 tw-no-underline";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={
        truncate
          ? (locationInfo?.displayTitle ?? value ?? undefined)
          : undefined
      }
    >
      {text}
    </a>
  );
}

export function DropForgeArweaveLinkCard({
  label,
  value,
}: Readonly<{ label: string; value: string | null | undefined }>) {
  return (
    <DropForgeStorageLinkCard
      label={label}
      value={value}
      cardClassName={ARWEAVE_LINK_CARD_CLASS}
      labelClassName="tw-min-w-0 tw-text-base tw-text-iron-200"
    />
  );
}

function DropForgeActionCompletionToggle({
  action,
  disabled,
  ariaLabel,
  onToggle,
}: Readonly<{
  action: ApiMintingClaimAction | null | undefined;
  disabled: boolean;
  ariaLabel: string;
  onToggle: (action: string, completed: boolean) => Promise<void>;
}>) {
  if (!action) {
    return null;
  }

  return (
    <div className="tw-inline-flex tw-items-center tw-gap-3">
      <span className="tw-text-sm tw-text-iron-400">Completed</span>
      <Toggle
        checked={action.completed}
        disabled={disabled}
        icons={false}
        aria-label={ariaLabel}
        onChange={() => {
          void onToggle(action.action, action.completed);
        }}
      />
    </div>
  );
}

export function DropForgeSectionTitleWithToggle({
  title,
  action,
  toggleDisabled,
  toggleAriaLabel,
  onActionToggle,
}: Readonly<{
  title: string;
  action: ApiMintingClaimAction | null | undefined;
  toggleDisabled: boolean;
  toggleAriaLabel: string;
  onActionToggle: (action: string, completed: boolean) => Promise<void>;
}>) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
      <div className="tw-text-base tw-font-medium tw-text-white">{title}</div>
      <DropForgeActionCompletionToggle
        action={action}
        disabled={toggleDisabled}
        ariaLabel={toggleAriaLabel}
        onToggle={onActionToggle}
      />
    </div>
  );
}
