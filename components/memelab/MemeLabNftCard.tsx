"use client";

import CollectionCardMetadataRow from "@/components/collection-page/CollectionCardMetadataRow";
import CollectionCardMetricLine from "@/components/collection-page/CollectionCardMetricLine";
import NFTImage from "@/components/nft-image/NFTImage";
import type { LabExtendedData, LabNFT } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import { getNftMimeType } from "@/helpers/nft.helpers";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MemeLabSort } from "@/types/enums";
import Link from "next/link";
import { printNftContent } from "./memeLabCardContent";
import { getMemeLabDetailHref } from "./memeLabRouteParams";

export default function MemeLabNftCard({
  nft,
  sort,
  nftMetas,
  volumeType,
  hasConnectedProfile,
  locale = DEFAULT_LOCALE,
  showArtistMetric = false,
}: {
  readonly nft: LabNFT;
  readonly sort: MemeLabSort;
  readonly nftMetas: LabExtendedData[];
  readonly volumeType: VolumeType;
  readonly hasConnectedProfile: boolean;
  readonly locale?: SupportedLocale | undefined;
  readonly showArtistMetric?: boolean | undefined;
}) {
  const mediaMimeType = getNftMimeType(nft);
  const tokenId = formatInteger(locale, nft.id);

  return (
    <Link
      key={`${nft.contract}-${nft.id}`}
      href={getMemeLabDetailHref({ id: nft.id, locale })}
      aria-label={t(locale, "memeLab.card.linkAriaLabel", {
        name: nft.name,
        tokenId,
      })}
      className="tw-group tw-block tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-border-white/20 hover:tw-bg-iron-900/50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      <div className="tw-bg-iron-900">
        <NFTImage
          nft={nft}
          animation={false}
          height={300}
          showBalance={false}
          showThumbnail={true}
        />
      </div>
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-center tw-px-2 tw-pb-4 tw-pt-4 tw-text-center md:tw-px-4">
        <div className="tw-w-full tw-max-w-full tw-text-center tw-text-md tw-font-semibold tw-leading-snug tw-text-iron-50">
          {nft.name}
        </div>
        <CollectionCardMetadataRow
          tokenId={nft.id}
          mediaMimeType={mediaMimeType}
          mediaBadgeId={`${nft.contract}-${nft.id}`}
          align="center"
          ownership={{
            contract: nft.contract,
            tokenId: nft.id,
            show: hasConnectedProfile,
          }}
        />
        {showArtistMetric && (
          <CollectionCardMetricLine
            text={t(locale, "memeLab.card.metric.artists", {
              value: nft.artist,
            })}
            align="center"
          />
        )}
        <CollectionCardMetricLine
          text={printNftContent(nft, sort, nftMetas, volumeType, locale)}
          align="center"
        />
      </div>
    </Link>
  );
}
