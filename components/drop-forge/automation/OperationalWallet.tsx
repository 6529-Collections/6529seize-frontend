import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { ApiDropForgeSettings } from "@/generated/models/ApiDropForgeSettings";
import { formatAddress, getAddressEtherscanLink } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import CopyWalletAddressButton from "./CopyWalletAddressButton";
import WalletFunding from "./WalletFunding";

export default function OperationalWallet({
  settings,
  onConfirmed,
}: Readonly<{ settings: ApiDropForgeSettings; onConfirmed: () => void }>) {
  const locale = useBrowserLocale();
  const explorerLabel = t(locale, "dropForge.settings.explorer");
  return (
    <div className="tw-min-w-0 tw-self-start tw-rounded-lg tw-bg-iron-900 tw-p-4">
      <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
        <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          {t(locale, "dropForge.settings.wallet")}
        </h3>
        <span className="tw-text-sm tw-text-iron-400">
          {"— "}
          {t(locale, "dropForge.funding.network", {
            network: settings.chain_id === 1 ? "Ethereum" : "Sepolia",
          })}
        </span>
      </div>
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-sm tw-text-iron-100">
        {settings.ens_name && (
          <span className="tw-min-w-0 tw-break-all">
            {settings.ens_name}
            {" —"}
          </span>
        )}
        <span className="tw-inline-flex tw-items-center tw-gap-1">
          <span title={settings.signer_address}>
            {formatAddress(settings.signer_address)}
          </span>
          <CopyWalletAddressButton
            key={settings.signer_address}
            address={settings.signer_address}
          />
          <CustomTooltip content={explorerLabel} placement="top">
            <a
              href={getAddressEtherscanLink(
                settings.chain_id,
                settings.signer_address
              )}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={explorerLabel}
              className={getButtonClasses({
                variant: "ghost",
                size: null,
                className: "tw-size-8",
              })}
            >
              <ArrowTopRightOnSquareIcon
                aria-hidden="true"
                className="tw-size-4"
              />
            </a>
          </CustomTooltip>
        </span>
      </div>
      <WalletFunding settings={settings} onConfirmed={onConfirmed} />
    </div>
  );
}
