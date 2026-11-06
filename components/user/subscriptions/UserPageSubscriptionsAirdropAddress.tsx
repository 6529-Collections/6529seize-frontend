import { AIRDROPS_USE_CASE } from "@/components/delegation/delegation-constants";
import DotLoader from "@/components/dotLoader/DotLoader";
import { formatAddress } from "@/helpers/Helpers";
import { MEMES_CONTRACT } from "@/constants/constants";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Link from "next/link";
import { Tooltip } from "react-tooltip";

interface AirdropAddress {
  address: string;
  ens: string;
}

export interface AirdropAddressResult {
  tdh_wallet: AirdropAddress;
  airdrop_address?: AirdropAddress | null;
}

export default function UserPageSubscriptionsAirdropAddress(
  props: Readonly<{
    show_edit: boolean;
    layout?: "row" | "inline";
    airdrop?: AirdropAddressResult | undefined;
    fetching?: boolean | undefined;
    error?: boolean | undefined;
  }>
) {
  const locale = useBrowserLocale();
  const airdropAddress = props.airdrop?.airdrop_address;
  const addressTooltipId = `airdrop-address-${airdropAddress?.address ?? "unavailable"}`;
  const editHref = `/safe-collecting/register-delegation?collection=${MEMES_CONTRACT}&use_case=${AIRDROPS_USE_CASE.use_case}`;
  const inline = props.layout === "inline";
  const layoutClasses = inline
    ? "tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-y-1 tw-py-3 lg:tw-py-0"
    : "tw-flex tw-min-h-[60px] tw-items-center tw-justify-between tw-gap-4 tw-gap-y-1 tw-py-3 max-sm:tw-flex-col max-sm:tw-items-start";

  return (
    <div className={`tw-min-w-0 tw-gap-x-3 ${layoutClasses}`}>
      <div className="tw-col-start-1 tw-flex tw-min-w-0 tw-items-center">
        <h3 className="tw-m-0 tw-text-[15px] tw-font-medium tw-text-iron-100 md:tw-text-sm">
          {t(locale, "subscriptions.airdrop.title")}
        </h3>
      </div>
      <div
        className={`tw-min-w-0 tw-flex-1 max-sm:tw-w-full ${props.layout === "inline" ? "tw-contents" : ""}`}
      >
        {props.fetching ? (
          <DotLoader />
        ) : (
          <div
            className={`tw-min-w-0 tw-items-center tw-gap-3 ${props.layout === "inline" ? "tw-contents" : "tw-flex tw-justify-end max-sm:tw-justify-start"}`}
          >
            {airdropAddress && (
              <span
                className={`tw-min-w-0 tw-break-all ${inline ? "tw-col-start-1 tw-row-start-2 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1" : ""}`}
              >
                {airdropAddress.ens && (
                  <span
                    className={`tw-text-meta tw-font-normal tw-text-iron-300 ${inline ? "tw-min-w-0" : "tw-mb-1 tw-block"}`}
                  >
                    {airdropAddress.ens}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={airdropAddress.address}
                  data-tooltip-id={addressTooltipId}
                  aria-describedby={addressTooltipId}
                  className={`tw-block tw-break-all tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-meta tw-leading-5 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${inline ? "tw-max-w-full" : "tw-w-full"} ${airdropAddress.ens ? "tw-text-iron-500" : "tw-text-iron-300"}`}
                >
                  {inline && airdropAddress.ens && (
                    <span
                      aria-hidden="true"
                      className="tw-mr-2 tw-text-iron-600"
                    >
                      ·
                    </span>
                  )}
                  {props.layout === "inline"
                    ? formatAddress(airdropAddress.address)
                    : airdropAddress.address}
                </button>
                <Tooltip
                  id={addressTooltipId}
                  openEvents={{ mouseover: true, focus: true, click: true }}
                  place="top"
                  positionStrategy="fixed"
                  offset={8}
                  delayShow={250}
                  opacity={1}
                  style={TOOLTIP_STYLES}
                >
                  <span className="tw-text-meta tw-font-normal">
                    {airdropAddress.address}
                  </span>
                </Tooltip>
              </span>
            )}
            {airdropAddress && props.show_edit && (
              <>
                <Link
                  href={editHref}
                  aria-label={t(locale, "subscriptions.airdrop.change")}
                  data-tooltip-id="subscriptions-change-airdrop-address"
                  className={`tw-group tw-row-start-1 tw-inline-flex tw-size-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-justify-self-end tw-text-iron-400 focus:tw-outline-none ${inline ? "tw-col-start-2 tw-row-span-2" : "md:tw-size-7"}`}
                >
                  <span className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-transition-colors group-focus-visible:tw-ring-2 group-focus-visible:tw-ring-primary-400 desktop-hover:group-hover:tw-bg-iron-800 desktop-hover:group-hover:tw-text-iron-100">
                    <PencilSquareIcon
                      className="tw-size-4"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
                <Tooltip
                  id="subscriptions-change-airdrop-address"
                  place="top"
                  positionStrategy="fixed"
                  offset={8}
                  delayShow={250}
                  opacity={1}
                  style={TOOLTIP_STYLES}
                >
                  <span className="tw-text-meta tw-font-normal">
                    {t(locale, "subscriptions.airdrop.change")}
                  </span>
                </Tooltip>
              </>
            )}
            {!airdropAddress && (
              <div className="tw-col-start-1 tw-row-start-2 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
                <span className="tw-text-meta tw-font-normal tw-text-iron-500">
                  {t(
                    locale,
                    props.error
                      ? "subscriptions.details.unavailable"
                      : "subscriptions.airdrop.empty"
                  )}
                </span>
                {props.show_edit && !props.error && (
                  <Link
                    href={editHref}
                    className="desktop-hover:hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-md tw-px-1 tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    {t(locale, "subscriptions.airdrop.set")}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
