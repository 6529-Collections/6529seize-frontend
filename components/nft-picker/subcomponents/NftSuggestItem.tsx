import Image from "next/image";
import clsx from "clsx";
import DistributionPlanVerifiedIcon from "../../distribution-plan-tool/common/DistributionPlanVerifiedIcon";
import type { Suggestion } from "../types";
import { shortenAddress } from "@/helpers/address.helpers";
import { formatFloor } from "../utils/formatting";

interface NftSuggestItemProps {
  readonly suggestion: Suggestion;
  readonly isActive: boolean;
  readonly index: number;
  readonly style: React.CSSProperties;
  readonly onHover: (index: number) => void;
  readonly onSelect: (item: Suggestion) => void;
}

export function NftSuggestItem({
  suggestion,
  isActive,
  index,
  style,
  onHover,
  onSelect,
}: NftSuggestItemProps) {
  return (
    <li
      id={`nft-suggestion-${index}`}
      className="tw-absolute tw-w-full"
      style={style}
    >
      <button
        type="button"
        className={clsx(
          "tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-items-center tw-gap-3 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-left tw-transition-colors",
          isActive
            ? "tw-bg-primary-500/20 tw-text-white"
            : "tw-text-iron-200 hover:tw-bg-iron-800"
        )}
        onMouseEnter={() => onHover(index)}
        onFocus={() => onHover(index)}
        onClick={() => onSelect(suggestion)}
      >
        <div className="tw-relative tw-h-10 tw-w-10">
          <div className="tw-h-full tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800">
            {suggestion.imageUrl ? (
              <Image
                src={suggestion.imageUrl}
                alt=""
                fill
                sizes="40px"
                className="tw-h-full tw-w-full tw-object-cover"
              />
            ) : (
              <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-text-iron-400">
                NFT
              </div>
            )}
          </div>
          {suggestion.safelist === "verified" && (
            <div className="tw-absolute tw-right-[-6px] tw-top-[-6px]">
              <DistributionPlanVerifiedIcon />
            </div>
          )}
        </div>
        <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-1">
          <span className="tw-text-sm tw-font-medium tw-text-white">
            {suggestion.name ?? shortenAddress(suggestion.address)}
          </span>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
            <span>{shortenAddress(suggestion.address)}</span>
            {suggestion.tokenType && (
              <span className="tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5">
                {suggestion.tokenType}
              </span>
            )}
            <span>Ξ{formatFloor(suggestion.floorPriceEth)}</span>
            {suggestion.totalSupply && <span>Supply {suggestion.totalSupply}</span>}
            {suggestion.safelist === "verified" && (
              <span className="tw-rounded tw-bg-green-500/20 tw-px-2 tw-py-0.5 tw-text-green-300">
                Verified
              </span>
            )}
            {suggestion.isSpam && (
              <span className="tw-rounded tw-bg-amber-500/20 tw-px-2 tw-py-0.5 tw-text-amber-300">
                Suspected spam
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
