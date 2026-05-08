"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import { NftPageStats } from "@/components/nft-attributes/NftStats";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { numberWithCommas, printMintDate } from "@/helpers/Helpers";
import { getFileMimeTypeFromMetadata } from "@/helpers/nft.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import ArtistProfileHandle from "./ArtistProfileHandle";

const statsTableClassName =
  "tw-w-full tw-border-collapse [&_td]:tw-px-0.5 [&_td]:tw-py-0.5";

const nftTableClassName =
  "tw-mb-4 tw-w-full tw-border-collapse [&_td]:tw-p-2";

export function MemeCollectorsStats({
  nftMeta,
}: {
  readonly nftMeta: MemesExtendedData;
}) {
  return (
    <section className="tw-pt-2">
      <h3>Meme Collectors</h3>
      <table className={statsTableClassName}>
        <tbody>
          <tr>
            <td>Edition Size</td>
            <td className="tw-text-right tw-font-medium">
              {numberWithCommas(nftMeta.edition_size)}
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.edition_size_rank}/{nftMeta.collection_size}
            </td>
          </tr>
          {nftMeta.burnt > 0 && (
            <>
              <tr>
                <td>
                  <span className="tw-flex tw-items-center tw-gap-2">
                    <span>Burnt</span>
                    <FontAwesomeIcon
                      icon={faFire}
                      className="tw-h-[22px] tw-text-[#c51d34]"
                    />
                  </span>
                </td>
                <td className="tw-text-right tw-font-medium">
                  {numberWithCommas(nftMeta.burnt)}
                </td>
              </tr>
              <tr>
                <td>Edition Size ex. Burnt</td>
                <td className="tw-text-right tw-font-medium">
                  {numberWithCommas(nftMeta.edition_size_not_burnt)}
                </td>
                <td className="tw-text-right tw-font-medium">
                  {nftMeta.edition_size_not_burnt_rank}/
                  {nftMeta.collection_size}
                </td>
              </tr>
            </>
          )}
          <tr>
            <td>6529 Museum</td>
            <td className="tw-text-right tw-font-medium">
              {numberWithCommas(nftMeta.museum_holdings)}
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.museum_holdings_rank}/{nftMeta.collection_size}
            </td>
          </tr>
          <tr>
            <td>
              Edition Size ex.{nftMeta.burnt > 0 && " Burnt and"} 6529 Museum
            </td>
            <td className="tw-text-right tw-font-medium">
              {numberWithCommas(nftMeta.edition_size_cleaned)}
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.edition_size_cleaned_rank}/{nftMeta.collection_size}
            </td>
          </tr>
          <tr>
            <td>Collectors</td>
            <td className="tw-text-right tw-font-medium">
              {numberWithCommas(nftMeta.hodlers)}
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.hodlers_rank}/{nftMeta.collection_size}
            </td>
          </tr>
          <tr>
            <td>% Unique</td>
            <td className="tw-text-right tw-font-medium">
              {Math.round(nftMeta.percent_unique * 100 * 10) / 10}%
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.percent_unique_rank}/{nftMeta.collection_size}
            </td>
          </tr>
          {nftMeta.burnt > 0 && (
            <tr>
              <td>% Unique ex. Burnt</td>
              <td className="tw-text-right tw-font-medium">
                {Math.round(nftMeta.percent_unique_not_burnt * 100 * 10) / 10}%
              </td>
              <td className="tw-text-right tw-font-medium">
                {nftMeta.percent_unique_not_burnt_rank}/
                {nftMeta.collection_size}
              </td>
            </tr>
          )}
          <tr>
            <td>
              % Unique ex.{nftMeta.burnt > 0 && " Burnt and"} 6529 Museum
            </td>
            <td className="tw-text-right tw-font-medium">
              {Math.round(nftMeta.percent_unique_cleaned * 100 * 10) / 10}%
            </td>
            <td className="tw-text-right tw-font-medium">
              {nftMeta.percent_unique_cleaned_rank}/{nftMeta.collection_size}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function MemeNftLivePanel({
  nft,
  nftBalance,
}: {
  readonly nft: NFT;
  readonly nftBalance: number;
}) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const metadata = nft.metadata as unknown;
  const fileMimeType = getFileMimeTypeFromMetadata(
    metadata !== null && typeof metadata === "object"
      ? (metadata as Parameters<typeof getFileMimeTypeFromMetadata>[0])
      : undefined
  );
  const distributionPlanLink = getDistributionPlanLink(nft);

  return (
    <section className="tw-pt-4">
      <h3>NFT</h3>
      <table className={nftTableClassName}>
        <tbody>
          <tr>
            <td>Artist Name</td>
            <td className="tw-font-medium">{nft.artist}</td>
          </tr>
          <tr>
            <td>Artist Profile</td>
            <td className="tw-font-medium">
              <ArtistProfileHandle nft={nft} />
            </td>
          </tr>
          <tr>
            <td>Mint Date</td>
            <td className="tw-font-medium">{printMintDate(nft.mint_date)}</td>
          </tr>
          <NftPageStats
            nft={nft}
            afterMetadata={
              fileMimeType ? (
                <tr>
                  <td>File Type</td>
                  <td>
                    <MediaTypeBadge
                      mimeType={fileMimeType}
                      size="sm"
                      showTooltip={false}
                      showLabel={true}
                      tone="color"
                      labelClassName="tw-text-inherit tw-font-medium"
                    />
                  </td>
                </tr>
              ) : null
            }
          />
        </tbody>
      </table>
      {distributionPlanLink && (
        <div>
          <Link
            href={distributionPlanLink}
            target={nft.has_distribution ? "_self" : "_blank"}
            rel={nft.has_distribution ? undefined : "noopener noreferrer"}
          >
            Distribution Plan
          </Link>
        </div>
      )}
      {nftBalance > 0 && (
        <h3 className="font-color tw-pt-4">
          You Own {nftBalance} edition{nftBalance > 1 && "s"}
        </h3>
      )}
      {(!capacitor.isIos || country === "US") && (
        <div className="tw-pt-6">
          <NFTMarketplaceLinks contract={nft.contract} id={nft.id} />
        </div>
      )}
    </section>
  );
}

function getDistributionPlanLink(nft: NFT) {
  if (nft.has_distribution) {
    return `/the-memes/${nft.id}/distribution`;
  }
  if (nft.id > 3) {
    return `https://github.com/6529-Collections/thememecards/tree/main/card${nft.id}`;
  }
  return "https://github.com/6529-Collections/thememecards/tree/main/card1-3";
}
