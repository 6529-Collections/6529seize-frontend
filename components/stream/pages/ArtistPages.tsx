"use client";

import Link from "next/link";

import {
  ARTIST_PRODUCTS,
  type ArtistBoard,
  type ArtistWallet,
  type ArtistWork,
  compareRaised,
  readArtistBoard,
  readArtistsIndex,
} from "@/components/stream/artists/artistBoard";
import {
  editionResultText,
  EditionTag,
  OneOfOneTag,
  oneOfOneValueText,
  WorkCell,
  workHref,
} from "@/components/stream/browse/cells";
import { thumbnailOf } from "@/components/stream/browse/reads";
import StreamTable from "@/components/stream/browse/StreamTable";
import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  Empty,
  Facts,
  Loading,
  NotFoundNote,
  PageHeader,
  Section,
} from "@/components/stream/pages/common";
import { AddressChip } from "@/components/stream/ui/AddressChip";
import { formatEth } from "@/components/stream/ui/EthAmount";
import StatusBadge, { variantBadge } from "@/components/stream/ui/StatusBadge";
import { STREAM_FOCUS, STREAM_HELP } from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  compareLocalized,
  formatInteger,
  formatPercent,
  formatUtcDate,
} from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import {
  CANONICAL_FEE_SHARE,
  DEFAULT_ROYALTY_RATE,
  FEDERATED_FEE_SHARE,
  SPLITS_DENOMINATOR,
} from "@/lib/stream/constants";
import type { StreamArtist, Wei } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

const NONE = "stream.browse.none";

function share(value: number, locale: SupportedLocale): string {
  return formatPercent(locale, value / SPLITS_DENOMINATOR, 3);
}

/** ETH, or a dash for nothing yet. */
function ethOrNone(locale: SupportedLocale, wei: Wei): string {
  return wei === 0n ? t(locale, NONE) : formatEth(locale, wei);
}

function RecoveryTag({
  artist,
  locale,
}: {
  readonly artist: StreamArtist;
  readonly locale: SupportedLocale;
}) {
  return artist.activeAuthority === null ? (
    <StatusBadge tone="warning" label={t(locale, "stream.artists.recovery")} />
  ) : null;
}

/** /stream/artists: every artist, their works per product and what they raised. */
export function ArtistsIndexPage() {
  const locale = useBrowserLocale();
  const { data: rows } = useStreamQuery("artists-index", [], readArtistsIndex);
  const sorted = [...(rows ?? [])].sort(
    (left, right) =>
      compareRaised(left, right) ||
      compareLocalized(
        locale,
        left.artist.displayName,
        right.artist.displayName
      )
  );
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.artists.title")}
        intro={t(locale, "stream.artists.intro")}
      />
      {rows === undefined ? <Loading /> : null}
      {rows?.length === 0 ? (
        <Empty text={t(locale, "stream.artists.empty")} />
      ) : null}
      {sorted.length > 0 ? (
        <StreamTable
          caption={t(locale, "stream.artists.title")}
          columns={[
            { key: "artist", label: t(locale, "stream.artists.col.artist") },
            ...ARTIST_PRODUCTS.map((product) => ({
              key: product,
              label: t(locale, `stream.artists.col.${product}`),
              numeric: true,
              wide: product !== "stream",
            })),
            {
              key: "raised",
              label: t(locale, "stream.artists.col.raised"),
              numeric: true,
            },
          ]}
          rows={sorted.map(({ artist, totals }) => ({
            key: artist.artistId,
            cells: [
              <span
                key="artist"
                className="tw-flex tw-flex-wrap tw-items-center tw-gap-2"
              >
                <Link
                  href={STREAM_ROUTES.artist(artist.artistId)}
                  className={`tw-font-medium tw-text-iron-50 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
                >
                  {artist.displayName}
                </Link>
                <RecoveryTag artist={artist} locale={locale} />
              </span>,
              ...ARTIST_PRODUCTS.map((product) =>
                formatInteger(locale, totals[product].works)
              ),
              ethOrNone(locale, totals.all.money.raised),
            ],
          }))}
        />
      ) : null}
    </div>
  );
}

function TotalsTable({
  board,
  locale,
}: {
  readonly board: ArtistBoard;
  readonly locale: SupportedLocale;
}) {
  const keys = [...ARTIST_PRODUCTS, "all"] as const;
  return (
    <StreamTable
      caption={t(locale, "stream.artist.totals")}
      columns={[
        { key: "product", label: t(locale, "stream.artist.col.product") },
        {
          key: "works",
          label: t(locale, "stream.artist.col.works"),
          numeric: true,
        },
        {
          key: "raised",
          label: t(locale, "stream.artist.col.raised"),
          numeric: true,
        },
        {
          key: "artistSide",
          label: t(locale, "stream.artist.col.artistSide"),
          numeric: true,
        },
        {
          key: "network",
          label: t(locale, "stream.artist.col.network"),
          numeric: true,
          wide: true,
        },
      ]}
      rows={keys.map((key) => {
        const total = board.totals[key];
        return {
          key,
          cells: [
            <span
              key="product"
              className={
                key === "all" ? "tw-font-semibold tw-text-iron-50" : ""
              }
            >
              {t(locale, `stream.artists.product.${key}`)}
            </span>,
            formatInteger(locale, total.works),
            ethOrNone(locale, total.money.raised),
            ethOrNone(locale, total.money.artistSide),
            ethOrNone(locale, total.money.network),
          ],
        };
      })}
    />
  );
}

function workResult(locale: SupportedLocale, work: ArtistWork): string {
  const { oneOfOne, edition } = work.sales;
  if (work.sales.work.standard === "ERC1155") {
    return edition === null
      ? t(locale, NONE)
      : editionResultText(locale, edition);
  }
  return oneOfOne === null
    ? t(locale, NONE)
    : oneOfOneValueText(locale, oneOfOne);
}

function SaleTag({
  work,
  locale,
}: {
  readonly work: ArtistWork;
  readonly locale: SupportedLocale;
}) {
  const { oneOfOne, edition } = work.sales;
  if (work.sales.work.standard === "ERC1155") {
    return edition === null ? null : (
      <EditionTag auction={edition} locale={locale} />
    );
  }
  return oneOfOne === null ? null : (
    <OneOfOneTag auction={oneOfOne} locale={locale} />
  );
}

function WorksTable({
  works,
  locale,
}: {
  readonly works: readonly ArtistWork[];
  readonly locale: SupportedLocale;
}) {
  if (works.length === 0) {
    return <Empty text={t(locale, "stream.artists.noWorks")} />;
  }
  return (
    <StreamTable
      caption={t(locale, "stream.artist.works")}
      columns={[
        { key: "work", label: t(locale, "stream.browse.col.work") },
        {
          key: "product",
          label: t(locale, "stream.artist.col.product"),
          wide: true,
        },
        { key: "sale", label: t(locale, "stream.artist.col.sale") },
        {
          key: "result",
          label: t(locale, "stream.artist.col.result"),
          numeric: true,
        },
        {
          key: "raised",
          label: t(locale, "stream.artist.col.raised"),
          numeric: true,
          wide: true,
        },
      ]}
      rows={works.map((work) => ({
        key: work.sales.work.key,
        cells: [
          <WorkCell
            key="work"
            href={workHref(work.sales.work)}
            title={work.sales.work.title}
            thumbnail={thumbnailOf(work.sales.work)}
          />,
          t(locale, variantBadge(work.sales.work.variant).label),
          <SaleTag key="sale" work={work} locale={locale} />,
          workResult(locale, work),
          ethOrNone(locale, work.money.raised),
        ],
      }))}
    />
  );
}

function WalletsTable({
  wallets,
  locale,
}: {
  readonly wallets: readonly ArtistWallet[];
  readonly locale: SupportedLocale;
}) {
  if (wallets.length === 0) {
    return <Empty text={t(locale, "stream.artist.walletsEmpty")} />;
  }
  return (
    <StreamTable
      caption={t(locale, "stream.artist.wallets")}
      columns={[
        { key: "wallet", label: t(locale, "stream.artist.col.wallet") },
        { key: "payees", label: t(locale, "stream.artist.col.payees") },
        {
          key: "works",
          label: t(locale, "stream.artist.col.works"),
          wide: true,
        },
        {
          key: "received",
          label: t(locale, "stream.artist.col.received"),
          numeric: true,
        },
        {
          key: "waiting",
          label: t(locale, "stream.artist.col.waiting"),
          numeric: true,
        },
      ]}
      rows={wallets.map(({ wallet, payeeNames, titles }) => ({
        key: wallet.address,
        cells: [
          <AddressChip key="wallet" address={wallet.address} locale={locale} />,
          wallet.payees
            .map((payee, index) =>
              t(locale, "stream.artist.payeeShare", {
                name: payeeNames[index] ?? payee.artistId,
                share: share(payee.share, locale),
              })
            )
            .join(" · "),
          titles.join(", "),
          formatEth(locale, wallet.received),
          formatEth(
            locale,
            wallet.payees.reduce((sum, payee) => sum + payee.releasable, 0n)
          ),
        ],
      }))}
    />
  );
}

/** /stream/artists/[id]: the artist's works everywhere, totals, payouts, identity. */
export function ArtistPage({ artistId }: { readonly artistId: string }) {
  const locale = useBrowserLocale();
  const { data: artist } = useStreamQuery("artist", [artistId], (source) =>
    source.getArtist(artistId)
  );
  const { data: board } = useStreamQuery("artist-board", [artistId], (source) =>
    readArtistBoard(source, artistId)
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
        {artist.pendingChange === null ? null : (
          <p className="tw-m-0 tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-text-iron-300">
            <RecoveryTag artist={artist} locale={locale} />
            {t(locale, "stream.artist.pending", {
              date: formatUtcDate(
                locale,
                artist.pendingChange.executableAt * 1_000
              ),
            })}
          </p>
        )}
      </PageHeader>
      {board === undefined ? (
        <Loading />
      ) : (
        <>
          <Section title={t(locale, "stream.artist.totals")}>
            <TotalsTable board={board} locale={locale} />
            <p className={`${STREAM_HELP} tw-mt-3`}>
              {t(locale, "stream.artist.totalsNote")}
            </p>
          </Section>
          <Section title={t(locale, "stream.artist.works")}>
            <WorksTable works={board.works} locale={locale} />
          </Section>
          <Section title={t(locale, "stream.artist.payouts")}>
            <p className={`${STREAM_HELP} tw-mb-4 tw-text-sm`}>
              {t(locale, "stream.artist.splitRule", {
                artist: share(SPLITS_DENOMINATOR - CANONICAL_FEE_SHARE, locale),
                network: share(CANONICAL_FEE_SHARE, locale),
                federatedArtist: share(
                  SPLITS_DENOMINATOR - FEDERATED_FEE_SHARE,
                  locale
                ),
                federatedNetwork: share(FEDERATED_FEE_SHARE, locale),
                royalty: share(DEFAULT_ROYALTY_RATE, locale),
              })}
            </p>
            <WalletsTable wallets={board.wallets} locale={locale} />
          </Section>
        </>
      )}
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
              label: t(locale, "stream.artist.linkedWallets"),
              value: formatInteger(locale, artist.consolidatedWallets.length),
            },
            {
              label: t(locale, "stream.artist.federatedContracts"),
              value:
                artist.federatedContracts.length === 0 ? (
                  t(locale, NONE)
                ) : (
                  <span className="tw-flex tw-flex-col tw-gap-1">
                    {artist.federatedContracts.map((contract) => (
                      <Link
                        key={contract}
                        href={STREAM_ROUTES.federatedContract(contract)}
                        className={`tw-text-iron-100 ${STREAM_FOCUS}`}
                      >
                        <AddressChip address={contract} locale={locale} />
                      </Link>
                    ))}
                  </span>
                ),
            },
          ]}
        />
      </Section>
    </div>
  );
}
