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
  readonly disabled?: boolean;
}

export function NftSuggestItem({
  suggestion,
  isActive,
  index,
  style,
  onHover,
  onSelect,
  disabled,
}: NftSuggestItemProps) {
  return (
    <li
      id={`nft-suggestion-${index}`}
      className="tw-absolute tw-w-full tw-px-2"
      style={style}
    >
      <button
        type="button"
        disabled={disabled}
        className={clsx(
          "tw-flex tw-h-[calc(100%-8px)] tw-w-full tw-items-center tw-gap-4 tw-rounded-xl tw-border tw-px-4 tw-text-left tw-transition-all",
          disabled
            ? "tw-cursor-not-allowed tw-border-transparent tw-bg-iron-900/50 tw-opacity-50"
            : isActive
              ? "tw-cursor-pointer tw-border-primary-500 tw-bg-iron-800"
              : "tw-cursor-pointer tw-border-transparent tw-bg-iron-900 hover:tw-bg-iron-800"
        )}
        onMouseEnter={() => !disabled && onHover(index)}
        onFocus={() => !disabled && onHover(index)}
        onClick={() => !disabled && onSelect(suggestion)}
      >
        <div className="tw-relative tw-h-10 tw-w-10 tw-shrink-0">
          <div className="tw-h-full tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/10">
            {suggestion.imageUrl ? (
              <Image
                src={suggestion.imageUrl}
                alt=""
                fill
                sizes="40px"
                className="tw-h-full tw-w-full tw-object-cover"
              />
            ) : (
              <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-800 tw-text-[10px] tw-font-bold tw-text-iron-500">
                NFT
              </div>
            )}
          </div>
          {suggestion.safelist === "verified" && (
            <div className="tw-absolute -tw-right-1 -tw-top-1 tw-z-10 tw-translate-x-1/2 -tw-translate-y-1/2">
              <DistributionPlanVerifiedIcon />
            </div>
          )}
        </div>

        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-between tw-gap-4">
          <div className="tw-flex tw-min-w-0 tw-flex-col">
            <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-white">
              {suggestion.name ?? shortenAddress(suggestion.address)}
            </span>
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
              <span className="tw-font-mono">{shortenAddress(suggestion.address)}</span>
              {suggestion.tokenType && (
                <>
                  <span className="tw-h-1 tw-w-1 tw-rounded-full tw-bg-iron-700" />
                  <span>{suggestion.tokenType}</span>
                </>
              )}
            </div>
          </div>

          <div className="tw-flex tw-items-center tw-gap-4 tw-text-xs">
            <div className="tw-flex tw-w-20 tw-flex-col tw-items-end">
              {typeof suggestion.floorPriceEth === "number" && !Number.isNaN(suggestion.floorPriceEth) ? (
                <>
                  <span className="tw-text-iron-400">Floor</span>
                  <span className="tw-font-medium tw-text-white">
                    {formatFloor(suggestion.floorPriceEth)} ETH
                  </span>
                </>
              ) : (
                <span className="tw-text-iron-600">—</span>
              )}
            </div>

            <div className="tw-flex tw-w-16 tw-flex-col tw-items-end">
              {suggestion.totalSupply ? (
                <>
                  <span className="tw-text-iron-400">Supply</span>
                  <span className="tw-font-medium tw-text-white">{suggestion.totalSupply}</span>
                </>
              ) : (
                <span className="tw-text-iron-600">—</span>
              )}
            </div>
          </div>
        </div>
      </button>
    </li>
  );
}
