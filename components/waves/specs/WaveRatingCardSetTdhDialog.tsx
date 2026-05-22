"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT } from "@/entities/INFT";
import { fetchUrl } from "@/services/6529api";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getMemeCardCountLabel } from "./wave-card-set-tdh.helpers";

const METADATA_CHUNK_SIZE = 100;

type MemeCardMetadata = Pick<
  NFT,
  "id" | "name" | "thumbnail" | "scaled" | "image" | "icon"
>;

interface WaveRatingCardSetTdhDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly tokenIds: readonly number[];
}
function getTokenIdChunks(tokenIds: readonly number[]): number[][] {
  const chunks: number[][] = [];

  for (let i = 0; i < tokenIds.length; i += METADATA_CHUNK_SIZE) {
    chunks.push(tokenIds.slice(i, i + METADATA_CHUNK_SIZE));
  }

  return chunks;
}

function getImageSrc(metadata: MemeCardMetadata | undefined): string | null {
  if (!metadata) {
    return null;
  }

  return (
    metadata.thumbnail ||
    metadata.scaled ||
    metadata.image ||
    metadata.icon ||
    null
  );
}

function getCardName(
  metadata: MemeCardMetadata | undefined,
  tokenId: number
): string {
  return metadata?.name || `Meme card #${tokenId}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function fetchMemeCardMetadata(
  tokenIds: readonly number[],
  signal: AbortSignal
): Promise<Map<number, MemeCardMetadata>> {
  const responses = await Promise.all(
    getTokenIdChunks(tokenIds).map((chunk) =>
      fetchUrl<DBResponse<MemeCardMetadata>>(
        `${publicEnv.API_ENDPOINT}/api/nfts?contract=${MEMES_CONTRACT}&id=${chunk.join(
          ","
        )}&page_size=${chunk.length}`,
        { signal }
      )
    )
  );

  const metadataById = new Map<number, MemeCardMetadata>();

  for (const response of responses) {
    const nfts = Array.isArray(response.data) ? response.data : [];
    for (const nft of nfts) {
      if (Number.isInteger(nft.id)) {
        metadataById.set(nft.id, nft);
      }
    }
  }

  return metadataById;
}

function MemeCardSetLink({
  metadata,
  tokenId,
}: {
  readonly metadata: MemeCardMetadata | undefined;
  readonly tokenId: number;
}) {
  const imageSrc = getImageSrc(metadata);
  const cardName = getCardName(metadata, tokenId);

  return (
    <Link
      href={`/the-memes/${tokenId}`}
      prefetch={false}
      className="tw-flex tw-min-h-[68px] tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/50 tw-p-2.5 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-border-iron-700 hover:tw-bg-iron-900"
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={metadata?.name ? `${metadata.name} Meme card` : cardName}
          width={48}
          height={48}
          className="tw-h-12 tw-w-12 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-800 tw-object-cover"
        />
      ) : (
        <div className="tw-flex tw-h-12 tw-w-12 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-800 tw-text-xs tw-font-semibold tw-text-iron-300">
          M
        </div>
      )}
      <div className="tw-min-w-0">
        {metadata ? (
          <>
            <p
              title={cardName}
              className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50"
            >
              {cardName}
            </p>
            <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-400">
              #{tokenId}
            </p>
          </>
        ) : (
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
            #{tokenId}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function WaveRatingCardSetTdhDialog({
  isOpen,
  onClose,
  tokenIds,
}: WaveRatingCardSetTdhDialogProps) {
  const [metadataById, setMetadataById] = useState<
    Map<number, MemeCardMetadata>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [hasMetadataError, setHasMetadataError] = useState(false);
  const countLabel = getMemeCardCountLabel(tokenIds.length);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setMetadataById(new Map());
    setHasMetadataError(false);

    if (tokenIds.length === 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    setIsLoading(true);

    fetchMemeCardMetadata(tokenIds, controller.signal)
      .then((nextMetadataById) => {
        if (!cancelled) {
          setMetadataById(nextMetadataById);
        }
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) {
          return;
        }

        console.error("Failed to fetch Meme card metadata", error);
        setMetadataById(new Map());
        setHasMetadataError(true);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isOpen, tokenIds]);

  return (
    <MobileWrapperDialog
      title="Meme cards in TDH set"
      isOpen={isOpen}
      onClose={onClose}
      fixedHeight
      showScrollbar
      tabletModal
      maxWidthClass="md:tw-max-w-2xl"
    >
      <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4 tw-px-4 sm:tw-px-6">
        <div className="tw-flex tw-min-h-6 tw-items-center tw-justify-between tw-gap-3">
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
            {countLabel}
          </p>
          {isLoading && (
            <div
              aria-label="Loading Meme card details"
              className="tw-size-4 tw-flex-shrink-0 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-700 tw-border-t-primary-400"
            />
          )}
        </div>

        {hasMetadataError && (
          <p className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-300">
            Card details could not load. Token links are still available.
          </p>
        )}

        {tokenIds.length === 0 ? (
          <p className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-px-3 tw-py-4 tw-text-sm tw-text-iron-300">
            No Meme cards are configured for this wave.
          </p>
        ) : (
          <div className="tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2">
            {tokenIds.map((tokenId) => (
              <MemeCardSetLink
                key={tokenId}
                metadata={metadataById.get(tokenId)}
                tokenId={tokenId}
              />
            ))}
          </div>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
