import { AIRDROPS_USE_CASE } from "@/components/delegation/delegation-constants";
import DotLoader from "@/components/dotLoader/DotLoader";
import { MEMES_CONTRACT } from "@/constants/constants";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Tooltip } from "react-tooltip";

interface AirdropAddress {
  address: string;
  ens: string;
}

export interface AirdropAddressResult {
  tdh_wallet: AirdropAddress;
  airdrop_address: AirdropAddress;
}

export default function UserPageSubscriptionsAirdropAddress(
  props: Readonly<{
    show_edit: boolean;
    airdrop?: AirdropAddressResult | undefined;
    fetching?: boolean | undefined;
  }>
) {
  const airdropAddress = props.airdrop?.airdrop_address;
  const addressTooltipId = `airdrop-address-${airdropAddress?.address ?? "unavailable"}`;
  const editHref = `/delegation/register-delegation?collection=${MEMES_CONTRACT}&use_case=${AIRDROPS_USE_CASE.use_case}`;

  return (
    <div className="tw-min-w-0">
      <div className="tw-flex tw-min-h-8 tw-items-center tw-justify-between tw-gap-3">
        <h3 className="tw-m-0 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
          Airdrop Address
        </h3>
        {airdropAddress && props.show_edit && (
          <>
            <Link
              href={editHref}
              aria-label="Change airdrop address"
              data-tooltip-id="subscriptions-change-airdrop-address"
              className="tw-inline-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-300 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
            >
              <PencilSquareIcon className="tw-size-4" aria-hidden="true" />
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
              Change airdrop address
            </Tooltip>
          </>
        )}
      </div>
      <div className="tw-mt-2 tw-min-h-8">
        {props.fetching ? (
          <DotLoader />
        ) : (
          <div className="tw-min-w-0">
            {airdropAddress && (
              <span className="tw-min-w-0 tw-break-all">
                {airdropAddress.ens && (
                  <span className="tw-mb-1 tw-block tw-text-sm tw-font-medium tw-text-iron-200">
                    {airdropAddress.ens}
                  </span>
                )}
                <button
                  type="button"
                  data-tooltip-id={addressTooltipId}
                  aria-describedby={addressTooltipId}
                  className={
                    airdropAddress.ens
                      ? "tw-block tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-xs tw-leading-5 tw-text-iron-500"
                      : "tw-block tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-sm tw-leading-5 tw-text-iron-200"
                  }
                >
                  {airdropAddress.address}
                </button>
                <Tooltip
                  id={addressTooltipId}
                  place="top"
                  positionStrategy="fixed"
                  offset={8}
                  delayShow={250}
                  opacity={1}
                  style={TOOLTIP_STYLES}
                >
                  {airdropAddress.address}
                </Tooltip>
              </span>
            )}
            {!airdropAddress && (
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
                <span className="tw-text-sm tw-text-iron-400">
                  No airdrop address found
                </span>
                {props.show_edit && (
                  <Link
                    href={editHref}
                    className="desktop-hover:hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-md tw-px-1 tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    Set airdrop address
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
