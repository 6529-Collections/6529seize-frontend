"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiArtistNameItem } from "@/generated/models/ApiArtistNameItem";
import type { ApiNft } from "@/generated/models/ApiNft";
import type { ApiNftsPage } from "@/generated/models/ApiNftsPage";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { fetchArtistMemeCardIds } from "@/services/api/meme-artist-api";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { getTheMemesDetailHref } from "./theMemesRouteParams";

const PREVIEW_SIZE = 4;
const STALE_TIME = 5 * 60 * 1000;
const BUTTON_CLASS_NAME =
  "tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

export default function MemePageArtistWorks({
  nft,
  locale,
}: Readonly<{
  nft: Pick<ApiNft, "id" | "artist_seize_handle">;
  locale: SupportedLocale;
}>) {
  const handles = [
    ...new Set(
      (nft.artist_seize_handle ?? "")
        .split(",")
        .map((handle) => handle.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
  if (handles.length === 0) {
    return <CatalogueArtistWorks cardId={nft.id} locale={locale} />;
  }
  return handles.map((handle) => (
    <ProfileArtistWorks
      key={handle}
      handle={handle}
      cardId={nft.id}
      locale={locale}
    />
  ));
}

function ProfileArtistWorks({
  handle,
  cardId,
  locale,
}: Readonly<{ handle: string; cardId: number; locale: SupportedLocale }>) {
  const identity = useQuery(
    getIdentityQueryOptions({ handleOrWallet: handle })
  );
  const profile = identity.data;
  const cards = useQuery({
    queryKey: [
      QueryKey.NFTS,
      {
        scope: "artist-meme-card-ids",
        handle,
        prevote: profile?.artist_of_prevote_cards,
        winners: profile?.winner_main_stage_drop_ids,
      },
    ],
    queryFn: ({ signal }) => {
      if (!profile) {
        throw new Error("Artist profile is required");
      }
      return fetchArtistMemeCardIds(profile, signal);
    },
    enabled: !!profile,
    staleTime: STALE_TIME,
  });
  if (identity.isError || cards.isError) {
    return (
      <ArtistWorksError
        locale={locale}
        retry={() => {
          if (identity.isError) {
            void identity.refetch();
          }
          if (cards.isError) {
            void cards.refetch();
          }
        }}
      />
    );
  }
  if (identity.isPending || cards.isPending) {
    return <ArtistWorksLoading locale={locale} />;
  }
  return (
    <ArtistWorksGallery
      artist={{ name: profile?.handle ?? handle, cards: cards.data }}
      cardId={cardId}
      locale={locale}
    />
  );
}

function CatalogueArtistWorks({
  cardId,
  locale,
}: Readonly<{ cardId: number; locale: SupportedLocale }>) {
  const artists = useQuery({
    queryKey: [QueryKey.NFTS, { scope: "memes-artist-catalogue" }],
    queryFn: ({ signal }) =>
      commonApiFetch<ApiArtistNameItem[]>({
        endpoint: "memes/artists_names",
        signal,
      }),
    staleTime: STALE_TIME,
  });

  if (artists.isPending) {
    return <ArtistWorksLoading locale={locale} />;
  }
  if (artists.isError) {
    return (
      <ArtistWorksError locale={locale} retry={() => void artists.refetch()} />
    );
  }

  return artists.data
    .filter((artist) => artist.cards.includes(cardId))
    .map((artist) => (
      <ArtistWorksGallery
        key={`${cardId}-${artist.name}`}
        artist={artist}
        cardId={cardId}
        locale={locale}
      />
    ));
}

function ArtistWorksGallery({
  artist,
  cardId,
  locale,
}: Readonly<{
  artist: ApiArtistNameItem;
  cardId: number;
  locale: SupportedLocale;
}>) {
  const [showAll, setShowAll] = useState(false);
  const headingId = useId();
  const galleryId = useId();
  const cardIds = [...new Set(artist.cards)]
    .filter((id) => Number.isInteger(id) && id > 0 && id !== cardId)
    .sort((a, b) => b - a);
  const visibleIds = showAll ? cardIds : cardIds.slice(0, PREVIEW_SIZE);
  const works = useQuery({
    queryKey: [
      QueryKey.NFTS,
      {
        contract: MEMES_CONTRACT,
        ids: visibleIds.join(","),
        scope: "artist-works",
      },
    ],
    queryFn: async ({ signal }) => {
      const pages: Promise<ApiNftsPage>[] = [];
      for (let index = 0; index < visibleIds.length; index += 100) {
        pages.push(
          commonApiFetch<ApiNftsPage>({
            endpoint: "nfts",
            params: {
              contract: MEMES_CONTRACT,
              id: visibleIds.slice(index, index + 100).join(","),
              page_size: "100",
            },
            signal,
          })
        );
      }
      const cards = (await Promise.all(pages)).flatMap((page) => page.data);
      const cardsById = new Map(cards.map((card) => [card.id, card]));
      return visibleIds
        .map((id) => cardsById.get(id))
        .filter((card): card is ApiNft => card !== undefined);
    },
    enabled: visibleIds.length > 0,
    staleTime: STALE_TIME,
  });

  if (cardIds.length === 0 || (works.isSuccess && works.data.length === 0)) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className="tw-mt-8 tw-min-w-0">
      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <div className="tw-min-w-0">
          <h2
            id={headingId}
            className="tw-m-0 tw-break-words tw-text-lg tw-font-semibold tw-text-iron-100"
          >
            {t(locale, "theMemes.detail.artistWorks.title", {
              artist: artist.name,
            })}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
            {t(locale, "theMemes.detail.artistWorks.collection")}
          </p>
        </div>
        {cardIds.length > PREVIEW_SIZE && (
          <button
            type="button"
            className={BUTTON_CLASS_NAME}
            aria-expanded={showAll}
            aria-controls={galleryId}
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll
              ? t(locale, "theMemes.detail.artistWorks.showFewer")
              : t(locale, "theMemes.detail.artistWorks.viewAll", {
                  count: formatInteger(locale, cardIds.length),
                })}
          </button>
        )}
      </div>
      <div id={galleryId} aria-busy={works.isPending}>
        {works.isPending && <ArtistWorksLoading locale={locale} />}
        {works.isError && (
          <ArtistWorksError
            locale={locale}
            retry={() => void works.refetch()}
          />
        )}
        {works.isSuccess && (
          <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-gap-3 tw-p-0 lg:tw-grid-cols-4 lg:tw-gap-4">
            {works.data.map((card) => (
              <li key={card.id} className="tw-min-w-0">
                <ArtistWorkCard card={card} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ArtistWorkCard({
  card,
  locale,
}: Readonly<{ card: ApiNft; locale: SupportedLocale }>) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = card.scaled || card.thumbnail || card.image;
  const tokenId = formatInteger(locale, card.id);

  return (
    <Link
      href={getTheMemesDetailHref({ id: card.id, locale })}
      aria-label={t(locale, "theMemes.card.linkAriaLabel", {
        name: card.name,
        tokenId,
      })}
      className="tw-group tw-block tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-100 tw-no-underline hover:tw-border-white/20 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
    >
      <div className="tw-relative tw-flex tw-aspect-square tw-items-center tw-justify-center tw-bg-iron-950">
        {image && !imageFailed ? (
          <Image
            src={image}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="tw-object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="tw-p-3 tw-text-center tw-text-sm tw-text-iron-400">
            {t(locale, "theMemes.detail.artistWorks.imageUnavailable")}
          </span>
        )}
      </div>
      <div className="tw-p-3">
        <p className="tw-m-0 tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100">
          {card.name}
        </p>
        <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
          {t(locale, "theMemes.detail.heading.card", { tokenId })}
        </p>
      </div>
    </Link>
  );
}

function ArtistWorksLoading({ locale }: Readonly<{ locale: SupportedLocale }>) {
  return (
    <div role="status" className="tw-my-4">
      <span className="tw-sr-only">
        {t(locale, "theMemes.detail.artistWorks.loading")}
      </span>
      <div
        aria-hidden="true"
        className="tw-grid tw-grid-cols-2 tw-gap-3 lg:tw-grid-cols-4 lg:tw-gap-4"
      >
        {[1, 2, 3, 4].map((id) => (
          <div
            key={id}
            className="tw-aspect-square tw-animate-pulse tw-rounded-xl tw-bg-iron-900 motion-reduce:tw-animate-none"
          />
        ))}
      </div>
    </div>
  );
}

function ArtistWorksError({
  locale,
  retry,
}: Readonly<{ locale: SupportedLocale; retry: () => void }>) {
  return (
    <div className="tw-my-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
      <p role="status" className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(locale, "theMemes.detail.artistWorks.error")}
      </p>
      <button type="button" onClick={retry} className={BUTTON_CLASS_NAME}>
        {t(locale, "theMemes.detail.artistWorks.retry")}
      </button>
    </div>
  );
}
