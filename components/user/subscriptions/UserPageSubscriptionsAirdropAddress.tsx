import { AIRDROPS_USE_CASE } from "@/components/delegation/delegation-constants";
import DotLoader from "@/components/dotLoader/DotLoader";
import { MEMES_CONTRACT } from "@/constants/constants";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

  return (
    <div className="tw-min-w-0">
      <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
        Airdrop Address
      </h3>
      <div className="tw-mt-2 tw-min-h-6">
        {props.fetching ? (
          <DotLoader />
        ) : (
          <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-2">
            {airdropAddress && (
              <span className="tw-min-w-0 tw-break-all tw-text-iron-200">
                <span
                  data-tooltip-id={`airdrop-address-${airdropAddress.address}`}
                >
                  {airdropAddress.address}
                </span>
                <Tooltip
                  id={`airdrop-address-${airdropAddress.address}`}
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}
                >
                  {airdropAddress.address}
                </Tooltip>
                {airdropAddress.ens && (
                  <span className="tw-text-iron-400">
                    {" "}
                    - {airdropAddress.ens}
                  </span>
                )}
              </span>
            )}
            {airdropAddress && props.show_edit && (
              <Link
                href={`/delegation/register-delegation?collection=${MEMES_CONTRACT}&use_case=${AIRDROPS_USE_CASE.use_case}`}
                aria-label="Change airdrop address"
                className="tw-inline-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-300 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
              >
                <FontAwesomeIcon
                  icon={faEdit}
                  className="tw-size-4"
                  aria-hidden="true"
                />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
