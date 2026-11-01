import {
  addMoney,
  editionMoney,
  NO_MONEY,
  oneOfOneMoney,
  readManyWorkSales,
  type SaleMoney,
  type WorkSales,
} from "@/components/stream/browse/reads";
import type { StreamDataSource } from "@/lib/stream/dataSource";
import type {
  Address,
  SplitWalletView,
  StreamArtist,
  WorkVariant,
} from "@/lib/stream/types";

/** Where a work sells: 6529 Stream, 6529 Stream Editions, or a federated contract. */
export type ArtistProduct = "stream" | "editions" | "federated";

export const ARTIST_PRODUCTS: readonly ArtistProduct[] = [
  "stream",
  "editions",
  "federated",
];

export function productOf(variant: WorkVariant): ArtistProduct {
  switch (variant) {
    case "stream-1of1":
      return "stream";
    case "stream-edition":
      return "editions";
    case "federated-721":
    case "federated-1155":
    case "federated-pair-master":
    case "federated-pair-edition":
      return "federated";
  }
}

/** One of an artist's works with its sale and what the sale raised. */
export interface ArtistWork {
  readonly sales: WorkSales;
  readonly product: ArtistProduct;
  readonly money: SaleMoney;
}

export interface ArtistTotal {
  readonly works: number;
  readonly money: SaleMoney;
}

/** A split wallet that pays the artist, with every payee's name. */
export interface ArtistWallet {
  readonly wallet: SplitWalletView;
  readonly payeeNames: readonly string[];
  readonly titles: readonly string[];
}

/** An artist page: the works across every product, totals, and split wallets. */
export interface ArtistBoard {
  readonly works: readonly ArtistWork[];
  readonly totals: Readonly<Record<ArtistProduct | "all", ArtistTotal>>;
  readonly wallets: readonly ArtistWallet[];
}

function moneyOf(sales: WorkSales): SaleMoney {
  return sales.work.standard === "ERC1155"
    ? editionMoney(sales.edition)
    : oneOfOneMoney(sales.oneOfOne);
}

/** Every work the artist leads (`listWorks({ artistId })`), with its sale. */
async function readArtistWorks(
  source: StreamDataSource,
  artistId: string
): Promise<ArtistWork[]> {
  const summaries = await source.listWorks({ artistId });
  const sales = await readManyWorkSales(
    source,
    summaries.map((summary) => summary.key)
  );
  return sales.map((entry) => ({
    sales: entry,
    product: productOf(entry.work.variant),
    money: moneyOf(entry),
  }));
}

function totalsOf(
  works: readonly ArtistWork[]
): Record<ArtistProduct | "all", ArtistTotal> {
  const empty: ArtistTotal = { works: 0, money: NO_MONEY };
  const totals: Record<ArtistProduct | "all", ArtistTotal> = {
    stream: empty,
    editions: empty,
    federated: empty,
    all: empty,
  };
  for (const work of works) {
    for (const key of [work.product, "all"] as const) {
      totals[key] = {
        works: totals[key].works + 1,
        money: addMoney(totals[key].money, work.money),
      };
    }
  }
  return totals;
}

/** The seller split wallets behind the artist's works (`IStream.work(id).seller`). */
async function readArtistWallets(
  source: StreamDataSource,
  works: readonly ArtistWork[],
  artists: readonly StreamArtist[]
): Promise<ArtistWallet[]> {
  const byWallet = new Map<Address, string[]>();
  for (const { sales } of works) {
    const seller = sales.work.economics.seller;
    byWallet.set(seller, [...(byWallet.get(seller) ?? []), sales.work.title]);
  }
  const names = new Map(
    artists.map((artist) => [artist.artistId, artist.displayName])
  );
  const wallets = await Promise.all(
    [...byWallet.keys()].map((address) => source.splitWallet(address))
  );
  return wallets
    .filter((wallet): wallet is SplitWalletView => wallet !== null)
    .map((wallet) => ({
      wallet,
      payeeNames: wallet.payees.map(
        (payee) => names.get(payee.artistId) ?? payee.artistId
      ),
      titles: byWallet.get(wallet.address) ?? [],
    }));
}

export async function readArtistBoard(
  source: StreamDataSource,
  artistId: string
): Promise<ArtistBoard> {
  const [works, artists] = await Promise.all([
    readArtistWorks(source, artistId),
    source.listArtists(),
  ]);
  return {
    works,
    totals: totalsOf(works),
    wallets: await readArtistWallets(source, works, artists),
  };
}

/** One row of the artists index. */
interface ArtistIndexRow {
  readonly artist: StreamArtist;
  readonly totals: Readonly<Record<ArtistProduct | "all", ArtistTotal>>;
}

export async function readArtistsIndex(
  source: StreamDataSource
): Promise<ArtistIndexRow[]> {
  const artists = await source.listArtists();
  return Promise.all(
    artists.map(async (artist) => ({
      artist,
      totals: totalsOf(await readArtistWorks(source, artist.artistId)),
    }))
  );
}

/** Most raised first. */
export function compareRaised(left: ArtistIndexRow, right: ArtistIndexRow) {
  const a = left.totals.all.money.raised;
  const b = right.totals.all.money.raised;
  if (a === b) {
    return 0;
  }
  return a > b ? -1 : 1;
}
