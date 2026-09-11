import MemeLabLeaderboard from "@/components/leaderboard/MemeLabLeaderboard";
import { MemeLabOverviewDetails } from "@/components/memelab/MemeLabAdditionalDetails";
import {
  MEME_LAB_STATS_ROW_CLASS,
  MemeLabStaticCardHeader,
  MemeLabStatMetric,
} from "@/components/memelab/MemeLabCardHeader";
import { MemeLabYourCardsPanel } from "@/components/memelab/MemeLabYourCards";
import { printMemeReferences } from "@/components/rememes/RememePage";
import Timeline from "@/components/timeline/Timeline";
import type { LabExtendedData, LabNFT, NFT, NFTHistory } from "@/entities/INFT";
import { formatInteger, formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function MemeLabOverview({
  nft,
  defaultAdditionalDetailsOpen,
}: {
  readonly nft: LabNFT | undefined;
  readonly defaultAdditionalDetailsOpen: boolean;
}) {
  if (!nft) {
    return null;
  }
  return (
    <MemeLabOverviewDetails
      nft={nft}
      defaultAdditionalDetailsOpen={defaultAdditionalDetailsOpen}
    />
  );
}

export function MemeLabReferences({
  originalMemes,
  originalMemesLoaded,
  locale,
}: {
  readonly originalMemes: NFT[];
  readonly originalMemesLoaded: boolean;
  readonly locale: SupportedLocale;
}) {
  return (
    <section aria-labelledby="meme-lab-references-heading" className="tw-pb-3">
      <h2
        id="meme-lab-references-heading"
        className="tw-mb-4 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100"
      >
        {t(locale, "memeLab.detail.references.title")}
      </h2>
      {printMemeReferences(
        originalMemes,
        "the-memes",
        originalMemesLoaded,
        true,
        locale
      )}
    </section>
  );
}

export function MemeLabStaticHeader({
  nft,
  nftMeta,
  showMarketplaceLinks,
  locale,
  hasOwnershipContext,
  nftBalance,
}: {
  readonly nft: LabNFT;
  readonly nftMeta: LabExtendedData;
  readonly showMarketplaceLinks: boolean;
  readonly locale: SupportedLocale;
  readonly hasOwnershipContext: boolean;
  readonly nftBalance: number;
}) {
  return (
    <MemeLabStaticCardHeader
      nft={nft}
      nftMeta={nftMeta}
      showMarketplaceLinks={showMarketplaceLinks}
      locale={locale}
      artworkFooter={
        hasOwnershipContext ? (
          <MemeLabYourCardsPanel nft={nft} nftBalance={nftBalance} />
        ) : undefined
      }
    />
  );
}

export function MemeLabCollectors({
  nft,
  nftId,
  nftMeta,
  locale,
}: {
  readonly nft: LabNFT | undefined;
  readonly nftId: string;
  readonly nftMeta: LabExtendedData | undefined;
  readonly locale: SupportedLocale;
}) {
  if (!nft || !nftId) {
    return null;
  }

  return (
    <section
      aria-label={t(locale, "memeLab.detail.collectors.leaderboard")}
      className="tw-py-2"
    >
      {nftMeta && (
        <div className={MEME_LAB_STATS_ROW_CLASS}>
          <MemeLabStatMetric
            label={t(locale, "memeLab.detail.collectors.collectors")}
            value={formatInteger(locale, nftMeta.hodlers)}
            rank={nftMeta.hodlers_rank}
            total={nftMeta.collection_size}
          />
          <MemeLabStatMetric
            label={t(locale, "memeLab.detail.collectors.museum")}
            value={formatInteger(locale, nftMeta.museum_holdings)}
            rank={nftMeta.museum_holdings_rank}
            total={nftMeta.collection_size}
          />
          <MemeLabStatMetric
            label={t(locale, "memeLab.detail.collectors.unique")}
            value={formatPercent(locale, nftMeta.percent_unique)}
            rank={nftMeta.percent_unique_rank}
            total={nftMeta.collection_size}
          />
          {nftMeta.burnt > 0 && (
            <MemeLabStatMetric
              label={t(locale, "memeLab.detail.collectors.uniqueExBurnt")}
              value={formatPercent(locale, nftMeta.percent_unique_not_burnt)}
              rank={nftMeta.percent_unique_not_burnt_rank}
              total={nftMeta.collection_size}
            />
          )}
          <MemeLabStatMetric
            label={t(
              locale,
              nftMeta.burnt > 0
                ? "memeLab.detail.collectors.uniqueExBurntAndMuseum"
                : "memeLab.detail.collectors.uniqueExMuseum"
            )}
            value={formatPercent(locale, nftMeta.percent_unique_cleaned)}
            rank={nftMeta.percent_unique_cleaned_rank}
            total={nftMeta.collection_size}
          />
        </div>
      )}
      <div className="tw-pt-3">
        <MemeLabLeaderboard
          contract={nft.contract}
          nftId={Number.parseInt(nftId)}
        />
      </div>
    </section>
  );
}

export function MemeLabTimeline({
  nft,
  nftHistory,
  locale,
}: {
  readonly nft: LabNFT | undefined;
  readonly nftHistory: NFTHistory[];
  readonly locale: SupportedLocale;
}) {
  return (
    <section
      aria-label={t(locale, "memeLab.detail.timeline.region")}
      className="tw-pb-5 tw-pt-3"
    >
      <div className="tw-mx-auto tw-w-full md:tw-w-10/12">
        {nft && <Timeline nft={nft} steps={nftHistory} locale={locale} />}
      </div>
    </section>
  );
}
