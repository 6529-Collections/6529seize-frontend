"use client";

import Link from "next/link";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  Facts,
  Loading,
  NotFoundNote,
  PageHeader,
  PlaceholderNote,
  Section,
  WorkGrid,
} from "@/components/stream/pages/common";
import { AddressChip } from "@/components/stream/ui/AddressChip";
import {
  STREAM_CARD,
  STREAM_FOCUS,
  STREAM_HELP,
} from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

/** /stream/artists: every artist with a canonical or federated work. */
export function ArtistsIndexPage() {
  const locale = useBrowserLocale();
  const { data: artists } = useStreamQuery("artists", [], (source) =>
    source.listArtists()
  );
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.artists.title")}
        intro={t(locale, "stream.artists.intro")}
      >
        <PlaceholderNote locale={locale} />
      </PageHeader>
      {artists === undefined ? <Loading /> : null}
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
        {(artists ?? []).map((artist) => (
          <li key={artist.artistId} className={`${STREAM_CARD} tw-p-4`}>
            <Link
              href={STREAM_ROUTES.artist(artist.artistId)}
              className={`tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
            >
              {artist.displayName}
            </Link>
            <p className={`${STREAM_HELP} tw-mt-1`}>
              {artist.programs
                .map((program) => t(locale, `stream.program.${program}`))
                .join(" · ") || t(locale, "stream.artists.noWorks")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** /stream/artists/[id]: identity, authority and restraint, and the artist's works. */
export function ArtistPage({ artistId }: { readonly artistId: string }) {
  const locale = useBrowserLocale();
  const { data: artist } = useStreamQuery("artist", [artistId], (source) =>
    source.getArtist(artistId)
  );
  const { data: works } = useStreamQuery(
    "works-by-artist",
    [artistId],
    (source) => source.listWorks({ artistId })
  );
  if (artist === undefined) {
    return <Loading />;
  }
  if (artist === null) {
    return <NotFoundNote locale={locale} />;
  }
  return (
    <div>
      <PageHeader
        title={artist.displayName}
        {...(artist.bio === "" ? {} : { intro: artist.bio })}
      >
        <PlaceholderNote locale={locale} />
      </PageHeader>
      <Section title={t(locale, "stream.artist.identity")}>
        <Facts
          items={[
            {
              label: t(locale, "stream.artist.authority"),
              value: <AddressChip address={artist.authority} locale={locale} />,
            },
            {
              label: t(locale, "stream.artist.payout"),
              value: <AddressChip address={artist.payout} locale={locale} />,
            },
            {
              label: t(locale, "stream.artist.status"),
              value:
                artist.activeAuthority === null
                  ? t(locale, "stream.artist.restrained")
                  : t(locale, "stream.artist.active"),
            },
            {
              label: t(locale, "stream.artist.lastActivity"),
              value: formatUtcDate(locale, artist.lastActivity * 1_000),
            },
            {
              label: t(locale, "stream.artist.wallets"),
              value: formatInteger(locale, artist.consolidatedWallets.length),
            },
            {
              label: t(locale, "stream.artist.federatedContracts"),
              value: formatInteger(locale, artist.federatedContracts.length),
            },
          ]}
        />
        {artist.pendingChange === null ? null : (
          <p className={`${STREAM_HELP} tw-mt-3`}>
            {t(locale, "stream.artist.pending", {
              date: formatUtcDate(
                locale,
                artist.pendingChange.executableAt * 1_000
              ),
            })}
          </p>
        )}
      </Section>
      <Section title={t(locale, "stream.artist.works")}>
        {works === undefined ? (
          <Loading />
        ) : (
          <WorkGrid
            keys={works.map((work) => work.key)}
            locale={locale}
            empty={t(locale, "stream.artists.noWorks")}
          />
        )}
      </Section>
    </div>
  );
}
