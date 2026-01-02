import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import type { TokenMetadata } from "@/components/nft-picker/NftPicker.types";
import type { TokenListAction, TokenWindowEntry } from "../types";
import { TokenThumbnail } from "./TokenThumbnail";

type TokenRowProps = Readonly<{
  token: TokenWindowEntry;
  metadata?: TokenMetadata | undefined;
  rowClassName?: string | undefined;
  renderTokenExtra?:
    | ((tokenId: bigint, metadata?: TokenMetadata) => ReactNode)
    | undefined
    | undefined;
  action?: TokenListAction | undefined;
  isMetadataLoading: boolean;
  hasMetadataError: boolean;
  positionStyle: CSSProperties;
}>;

export function TokenRow({
  token,
  metadata,
  rowClassName,
  renderTokenExtra,
  action,
  isMetadataLoading,
  hasMetadataError,
  positionStyle,
}: Readonly<TokenRowProps>) {
  return (
    <li
      className={clsx(
        "tw-absolute tw-flex tw-w-full tw-items-center tw-gap-3 tw-px-3 tw-py-2",
        rowClassName
      )}
      style={positionStyle}
    >
      <div className="tw-h-10 tw-w-10">
        <TokenThumbnail
          metadata={metadata}
          decimalId={token.decimalId}
          isLoading={isMetadataLoading}
          hasError={hasMetadataError}
        />
      </div>
      <div className="tw-flex tw-flex-1 tw-items-center tw-justify-between tw-gap-4">
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <span className="tw-text-sm tw-font-medium tw-text-white">
            #{token.decimalId}
          </span>
          {metadata?.name && (
            <span className="tw-text-xs tw-text-iron-400">{metadata.name}</span>
          )}
        </div>
        {renderTokenExtra?.(token.tokenId, metadata)}
        {action ? (
          <button
            type="button"
            className="tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-xs tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white"
            onClick={() => action.onClick(token.tokenId, metadata)}
            aria-label={
              action.getAriaLabel?.(`#${token.decimalId}`) ?? action.label
            }
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </li>
  );
}
