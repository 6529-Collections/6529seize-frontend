"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import type { Address } from "viem";
import { mainnet } from "viem/chains";
import { useEnsName } from "wagmi";
import Button from "@/components/utils/button/Button";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function ContractAdminRow({
  address,
  isOwner,
  locale,
  canManage,
  disabled,
  onRevoke,
}: Readonly<{
  address: Address;
  isOwner: boolean;
  locale: SupportedLocale;
  canManage: boolean;
  disabled: boolean;
  onRevoke: () => void;
}>) {
  const { data: ensName } = useEnsName({ address, chainId: mainnet.id });

  return (
    <li className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-py-4">
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-mb-1.5 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          {ensName && (
            <span className="tw-break-all tw-text-sm tw-font-medium tw-text-iron-100">
              {ensName}
            </span>
          )}
          <span
            className={`tw-inline-flex tw-shrink-0 tw-items-center tw-rounded-full tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset ${
              isOwner
                ? "tw-bg-primary-500/10 tw-text-primary-300 tw-ring-primary-500/30"
                : "tw-bg-iron-800 tw-text-iron-200 tw-ring-iron-700"
            }`}
          >
            {t(
              locale,
              isOwner ? "dropForge.admins.owner" : "dropForge.admins.admin"
            )}
          </span>
        </div>
        <span className="tw-block tw-break-all tw-font-mono tw-text-sm tw-text-iron-300">
          {address}
        </span>
      </div>
      {canManage && !isOwner && (
        <CustomTooltip content={t(locale, "dropForge.admins.revokeTooltip")}>
          <Button
            variant="destructiveOutline"
            size="sm"
            disabled={disabled}
            aria-label={t(locale, "dropForge.admins.revokeLabel", { address })}
            onClick={onRevoke}
          >
            <TrashIcon aria-hidden="true" className="tw-size-4" />
          </Button>
        </CustomTooltip>
      )}
    </li>
  );
}
