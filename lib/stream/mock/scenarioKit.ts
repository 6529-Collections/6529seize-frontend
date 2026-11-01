import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "@/lib/stream/constants";
import { parseEthToWei } from "@/lib/stream/eth";
import { MOCK_EPOCH, type MockStreamEngine } from "@/lib/stream/mock/engine";
import { mockAddress } from "@/lib/stream/mock/ids";
import {
  findEditionAuction,
  openPreparedAuction,
  placeEditionBid,
  prepareEditionAuction,
} from "@/lib/stream/mock/sales/editionAuction";
import {
  findEnglishAuction,
  placeEnglishBid,
  startEnglishAuction,
} from "@/lib/stream/mock/sales/englishAuction";
import type { MockToken, WorkSpec } from "@/lib/stream/mock/state";
import { addLinkedEdition, addStreamWork } from "@/lib/stream/mock/tokens";
import type { Address } from "@/lib/stream/types";

/** Building blocks for the seeded scenarios. Every name here is invented. */

export const H = SECONDS_PER_HOUR;
export const D = SECONDS_PER_DAY;
export const M = 60;

/** The seed starts four days before the simulated "now". */
export const SEED_START = MOCK_EPOCH - 4 * D;

export const MOCK_ACCOUNTS = {
  collectorA: mockAddress("account:collector-a"),
  collectorB: mockAddress("account:collector-b"),
  guardian: mockAddress("account:guardian"),
} as const;

/** The seed's keeper: settles edition auctions on the timeline. */
export const SEED_KEEPER: Address = mockAddress("account:keeper");

export const OTHER_BIDDERS: readonly Address[] = Array.from(
  { length: 8 },
  (_, index) => mockAddress(`account:bidder-${index + 1}`)
);

export function eth(text: string): bigint {
  const wei = parseEthToWei(text);
  if (wei === null) {
    throw new Error(`bad ETH literal ${text}`);
  }
  return wei;
}

export const ARTISTS = {
  mara: {
    label: "mara-vell",
    displayName: "Mara Vell",
    handle: "maravell",
    bio: "Draws with light tables and code; keeps field notes of tides and salt flats.",
  },
  oto: {
    label: "oto-kestrel",
    displayName: "Oto Kestrel",
    handle: "otokestrel",
    bio: "Signal paintings from radio noise, folded and re-scanned.",
  },
  ines: {
    label: "ines-quarry",
    displayName: "Ines Quarry",
    handle: "inesquarry",
    bio: "Slow images of water edges, made with generative glazes.",
  },
  juno: {
    label: "juno-halden",
    displayName: "Juno Halden",
    handle: "junohalden",
    bio: "Runs a one-person studio contract for ferry and harbour studies.",
  },
  tomas: {
    label: "tomas-reik",
    displayName: "Tomas Reik",
    handle: "tomasreik",
    bio: "Prints multiples: grain, noise and paper texture, in editions.",
  },
  sable: {
    label: "sable-ohm",
    displayName: "Sable Ohm",
    handle: "sableohm",
    bio: "Pairs a single original with an open edition of the same room.",
  },
  wren: {
    label: "wren-atelier",
    displayName: "Wren Atelier",
    handle: "wrenatelier",
    bio: "",
  },
} as const;

export type ArtistKey = keyof typeof ARTISTS;

export interface SeedContext {
  readonly engine: MockStreamEngine;
  readonly ids: Record<ArtistKey, string>;
  readonly works: Map<string, MockToken>;
  readonly federated: Map<string, Address>;
}

export type Step = {
  readonly at: number;
  readonly run: (context: SeedContext) => void;
};

export function work(context: SeedContext, name: string): MockToken {
  const token = context.works.get(name);
  if (!token) {
    throw new Error(`seed: unknown work ${name}`);
  }
  return token;
}

export function saleOf(context: SeedContext, name: string) {
  const saleId = work(context, name).sale?.saleId;
  if (saleId === undefined) {
    throw new Error(`seed: ${name} has no sale`);
  }
  return findEnglishAuction(context.engine, saleId);
}

export function editionOf(context: SeedContext, name: string) {
  const edition = work(context, name).linked.edition;
  if (edition === null) {
    throw new Error(`seed: ${name} has no edition`);
  }
  return findEditionAuction(context.engine, edition);
}

/** Starts a canonical work's 1/1, and for a master its edition auction (cap 0 = none). */
export function launch(
  context: SeedContext,
  name: string,
  workSpec: WorkSpec,
  cap?: number
): void {
  const { engine } = context;
  const token = addStreamWork(engine, workSpec, engine.now());
  context.works.set(name, token);
  startEnglishAuction(engine, token.key);
  if (cap !== undefined) {
    const edition = addLinkedEdition(engine, token, {
      token: engine.contracts.editions,
      variant: "stream-edition",
      created: false,
    });
    const auction = prepareEditionAuction(engine, edition.key, {
      master: token.key,
      cap,
    });
    openPreparedAuction(engine, auction);
  }
}

export function bid(
  context: SeedContext,
  name: string,
  from: Address,
  amount: string
) {
  placeEnglishBid(context.engine, saleOf(context, name), from, eth(amount));
}

export function editionBids(
  context: SeedContext,
  name: string,
  bids: readonly (readonly [Address, number, number])[]
): void {
  const auction = editionOf(context, name);
  for (const [from, step, qty] of bids) {
    placeEditionBid(context.engine, auction, from, step, qty);
  }
}

export function spec(
  context: SeedContext,
  artist: ArtistKey,
  fields: Omit<WorkSpec, "artistId" | "year"> & { readonly year?: number }
): WorkSpec {
  return { year: 2026, ...fields, artistId: context.ids[artist] };
}

export const COLLECTIONS = {
  fieldNotes: { id: 1, name: "Field Notes" },
  signal: { id: 2, name: "Signal" },
  tidewater: { id: 3, name: "Tidewater" },
} as const;

export function authority(context: SeedContext, artist: ArtistKey): Address {
  const value = context.engine.state.artists.get(
    context.ids[artist]
  )?.authority;
  if (value === undefined) {
    throw new Error(`seed: no artist ${artist}`);
  }
  return value;
}

export function federatedAddress(context: SeedContext, name: string): Address {
  const value = context.federated.get(name);
  if (value === undefined) {
    throw new Error(`seed: no contract ${name}`);
  }
  return value;
}
