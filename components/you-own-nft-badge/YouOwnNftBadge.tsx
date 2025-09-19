import { faCertificate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";

export default function YouOwnNftBadge() {
  return (
    <span data-tooltip-id="you-own-nft-badge" className="inline-block">
      <FontAwesomeIcon
        icon={faCertificate}
        className="tw-size-4 tw-text-blue-500"
      />
      <Tooltip
        variant="light"
        id="you-own-nft-badge"
        className="tw-flex tw-items-center tw-gap-1">
        <FontAwesomeIcon
          icon={faCertificate}
          className="tw-size-4 tw-text-blue-500"
        />
        <span className="tw-text-sm">You own this NFT</span>
      </Tooltip>
    </span>
  );
}
