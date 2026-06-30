import { AIRDROPS_USE_CASE } from "@/components/delegation/delegation-constants";
import { MEMES_CONTRACT } from "@/constants/constants";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  }>
) {
  return (
    <div>
      <div className="tw-pb-2">
        <div className="tw-flex tw-items-center tw-gap-2">
          <h5 className="tw-mb-0 tw-whitespace-nowrap">Airdrop Address</h5>
        </div>
      </div>
      <div className="tw-pt-1">
        <div className="tw-flex tw-gap-2">
          <span>
            {props.airdrop?.airdrop_address && (
              <>
                <>
                  <span
                    data-tooltip-id={`airdrop-address-${props.airdrop.airdrop_address.address}`}
                  >
                    {props.airdrop.airdrop_address.address}
                  </span>
                  <Tooltip
                    id={`airdrop-address-${props.airdrop.airdrop_address.address}`}
                    style={{
                      backgroundColor: "#1F2937",
                      color: "white",
                      padding: "4px 8px",
                    }}
                  >
                    {props.airdrop.airdrop_address.address}
                  </Tooltip>
                </>
                {props.airdrop.airdrop_address.ens && (
                  <span> - {props.airdrop.airdrop_address.ens}</span>
                )}
              </>
            )}
          </span>
          {props.airdrop?.airdrop_address && props.show_edit && (
            <a
              href={`/delegation/register-delegation?collection=${MEMES_CONTRACT}&use_case=${AIRDROPS_USE_CASE.use_case}`}
              aria-label="Change airdrop address"
            >
              <FontAwesomeIcon icon={faEdit} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
