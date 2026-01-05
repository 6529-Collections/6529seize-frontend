import type { CSSProperties, ReactNode } from "react";
import type { TokenMetadata } from "@/components/nft-picker/NftPicker.types";
import type { TokenListAction, TokenWindowEntry } from "../types";
import { TokenThumbnail } from "./TokenThumbnail";

type GridRowProps = Readonly<{
  tokens: TokenWindowEntry[];
  metadataMap: Map<string, TokenMetadata>;
  metadataQuery: any;
  renderTokenExtra?:
    | ((tokenId: bigint, metadata?: TokenMetadata) => ReactNode)
    | undefined
    | undefined;
  action?: TokenListAction | undefined;
  positionStyle: CSSProperties;
  columns: number;
}>;

export function GridRow({
  tokens,
  metadataMap,
  metadataQuery,
  renderTokenExtra,
  action,
  positionStyle,
  columns,
}: GridRowProps) {
  return (
    <li
      className="tw-absolute tw-grid tw-w-full tw-gap-3 tw-px-3 tw-py-2"
      style={{
        ...positionStyle,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {tokens.map((token) => {
        const metadata = metadataMap.get(token.decimalId);
        const isLoadingMetadata = metadataQuery.isFetching && !metadata;
        const hasMetadataError = metadataQuery.isError && !metadata;

        return (
          <div
            key={token.decimalId}
            className="tw-flex tw-flex-col tw-rounded-lg tw-overflow-hidden"
          >
            <div className="tw-aspect-square tw-w-full tw-overflow-hidden tw-bg-iron-900">
              <TokenThumbnail
                metadata={metadata}
                decimalId={token.decimalId}
                isLoading={isLoadingMetadata}
                hasError={hasMetadataError}
              />
            </div>
            <div className="tw-flex tw-flex-col tw-p-3 tw-gap-3">
              <div className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-iron-400">
                <span className="tw-truncate">
                  {metadata?.collectionName ?? "Collection"}
                </span>
                <span className="tw-font-mono">#{token.decimalId}</span>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
                <div className="tw-font-medium tw-text-white tw-truncate">
                  {metadata?.name ?? `Token #${token.decimalId}`}
                </div>
                <div className="tw-flex tw-gap-1 tw-text-xs tw-shrink-0">
                  <span className="tw-text-iron-400">xTDH</span>
                  <span className="tw-text-white">
                    {Math.floor((token.xtdh ?? 0) * 10) / 10}
                  </span>
                </div>
              </div>
            </div>

            {renderTokenExtra?.(token.tokenId, metadata)}
            {action ? (
              <div className="tw-p-3 tw-pt-0">
                <button
                  type="button"
                  className="tw-w-full tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-xs tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white"
                  onClick={() => action.onClick(token.tokenId, metadata)}
                  aria-label={
                    action.getAriaLabel?.(`#${token.decimalId}`) ?? action.label
                  }
                >
                  {action.label}
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </li>
  );
}
