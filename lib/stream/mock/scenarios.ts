import { MOCK_EPOCH, type MockStreamEngine } from "@/lib/stream/mock/engine";
import { mockAddress, mockHash } from "@/lib/stream/mock/ids";
import {
  ARTISTS,
  type ArtistKey,
  authority,
  COLLECTIONS,
  D,
  eth,
  H,
  MOCK_ACCOUNTS,
  OTHER_BIDDERS,
  type SeedContext,
  SEED_START,
  spec,
} from "@/lib/stream/mock/scenarioKit";
import { seedTimeline } from "@/lib/stream/mock/scenarioTimeline";
import { addArtist } from "@/lib/stream/mock/tokens";
import { ZERO_ADDRESS } from "@/lib/stream/constants";
import type {
  Address,
  CurationItem,
  Hex32,
  StatementView,
} from "@/lib/stream/types";

/**
 * The seeded world: fictional artists, generated art, and one example of every
 * state the UI must show. The seed replays four simulated days of activity in
 * time order through the same functions the mock's actions use, ending at
 * `MOCK_EPOCH`. Every name here is invented.
 */

function curationItem(
  itemHash: Hex32,
  fields: Omit<
    CurationItem,
    "itemHash" | "consumed" | "startable" | "thumbnailUri"
  >
): CurationItem {
  return {
    ...fields,
    itemHash,
    thumbnailUri: null,
    consumed: false,
    startable: fields.moveSigned && fields.accepted === fields.parties,
  };
}

/**
 * The curator's `CURATION_EVIDENCE` statement for a package root: the published
 * vote record. On-chain its subject is `(address(0), uint256(packageRoot))`;
 * the view's numeric ID cannot hold a root, so the mock leaves it at 0.
 */
function voteRecord(
  packageRoot: Hex32,
  at: number,
  summary: string
): StatementView {
  return {
    entryHash: mockHash(`vote-record:${packageRoot}`),
    role: "CURATOR",
    kind: "CURATION_EVIDENCE",
    subject: { token: ZERO_ADDRESS, id: 0n },
    contentHash: mockHash(`vote-record-content:${packageRoot}`),
    uri: `ar://${mockHash("vote-record-uri:" + packageRoot).slice(2, 45)}`,
    summary,
    supersedes: null,
    at,
  };
}

function seedCuration(context: SeedContext): void {
  const { engine, ids } = context;
  const lowWater = mockHash("item:low-water");
  const saltLines = mockHash("item:salt-lines");
  const quarrySong = mockHash("item:quarry-song");
  const harborGlass = mockHash("item:harbor-glass");
  const tidewater = mockHash("package:tidewater");
  const quarryPackage = mockHash("package:quarry-song");
  const harborPackage = mockHash("package:harbor-glass");
  const lowWaterSpec = spec(context, "ines", {
    title: "Low Water",
    description: "The estuary at the lowest tide of the year.",
    medium: "Generative glaze",
    style: "bands",
    seed: 97,
    kind: "EDITION_MASTER",
    collection: COLLECTIONS.tidewater,
  });
  engine.state.pendingItems.set(lowWater, {
    itemHash: lowWater,
    spec: lowWaterSpec,
    cap: 40,
  });
  engine.state.packages.push(
    {
      packageRoot: tidewater,
      status: "REGISTERED",
      signer: mockAddress("account:curation-signer-1"),
      evidenceHash: mockHash("evidence:tidewater"),
      registeredAt: MOCK_EPOCH - 20 * H,
      waveVote: "6529 Stream submissions · TDH vote",
      voteRecord: voteRecord(
        tidewater,
        MOCK_EPOCH - 20 * H,
        "TDH vote: 2 of 3 submissions approved, with 61% of the TDH that voted."
      ),
      revocation: null,
      items: [
        curationItem(lowWater, {
          title: "Low Water",
          artistId: ids.ines,
          kind: "EDITION_MASTER",
          accepted: 1,
          parties: 1,
          moveSigned: true,
          editionCap: 40,
          licenseSpdxId: "CC0-1.0",
        }),
        curationItem(saltLines, {
          title: "Salt Lines",
          artistId: ids.ines,
          kind: "ORIGINAL",
          accepted: 1,
          parties: 1,
          moveSigned: false,
          editionCap: null,
          licenseSpdxId: "CC0-1.0",
        }),
      ],
    },
    {
      packageRoot: quarryPackage,
      status: "REGISTERED",
      signer: mockAddress("account:curation-signer-2"),
      evidenceHash: mockHash("evidence:quarry-song"),
      registeredAt: MOCK_EPOCH - 6 * H,
      waveVote: "6529 Stream submissions · TDH vote",
      voteRecord: voteRecord(
        quarryPackage,
        MOCK_EPOCH - 6 * H,
        "TDH vote: 1 of 2 submissions approved, with 72% of the TDH that voted."
      ),
      revocation: null,
      items: [
        curationItem(quarrySong, {
          title: "Quarry Song",
          artistId: ids.mara,
          kind: "ORIGINAL",
          accepted: 1,
          parties: 2,
          moveSigned: true,
          editionCap: null,
          licenseSpdxId: "CC0-1.0",
        }),
      ],
    },
    {
      // A guardian revoked this approval: its item can never mint.
      packageRoot: harborPackage,
      status: "REVOKED",
      signer: mockAddress("account:curation-signer-1"),
      evidenceHash: mockHash("evidence:harbor-glass"),
      registeredAt: MOCK_EPOCH - 30 * H,
      waveVote: "6529 Stream submissions · TDH vote",
      voteRecord: voteRecord(
        harborPackage,
        MOCK_EPOCH - 30 * H,
        "TDH vote: its one submission approved, with 55% of the TDH that voted."
      ),
      revocation: {
        at: MOCK_EPOCH - 26 * H,
        reasonHash: mockHash("revocation-reason:harbor-glass"),
        txHash: mockHash("tx:revoke:harbor-glass"),
      },
      items: [
        curationItem(harborGlass, {
          title: "Harbor Glass",
          artistId: ids.wren,
          kind: "ORIGINAL",
          accepted: 1,
          parties: 1,
          moveSigned: false,
          editionCap: null,
          licenseSpdxId: "CC0-1.0",
        }),
      ],
    }
  );
}

function seedAccounts(context: SeedContext): void {
  const { engine } = context;
  const artistAccount = authority(context, "mara");
  const federatedAccount = authority(context, "juno");
  engine.state.devAccounts.push(
    {
      address: MOCK_ACCOUNTS.collectorA,
      role: "collectorA",
      label: "Collector A",
    },
    {
      address: MOCK_ACCOUNTS.collectorB,
      role: "collectorB",
      label: "Collector B",
    },
    { address: artistAccount, role: "artist", label: ARTISTS.mara.displayName },
    {
      address: federatedAccount,
      role: "federatedArtist",
      label: ARTISTS.juno.displayName,
    },
    {
      address: engine.museumAddress(),
      role: "museum",
      label: "6529 Network Museum",
    },
    { address: MOCK_ACCOUNTS.guardian, role: "guardian", label: "Guardian" }
  );
  const funded: Address[] = [
    MOCK_ACCOUNTS.collectorA,
    MOCK_ACCOUNTS.collectorB,
    ...OTHER_BIDDERS,
  ];
  funded.forEach((account) => engine.creditBalance(account, eth("40")));
  Object.keys(ARTISTS).forEach((key) =>
    engine.creditBalance(authority(context, key as ArtistKey), eth("2"))
  );
}

/** Builds the seeded world on an empty engine whose clock is at `SEED_START`. */
export function seedScenarios(engine: MockStreamEngine): void {
  const ids = {} as Record<ArtistKey, string>;
  (Object.keys(ARTISTS) as ArtistKey[]).forEach((key) => {
    ids[key] = addArtist(engine, ARTISTS[key], SEED_START).artistId;
  });
  const context: SeedContext = {
    engine,
    ids,
    works: new Map(),
    federated: new Map(),
  };
  seedAccounts(context);
  // The dev accounts' artists sign and are paid at one address, so their
  // dashboard can release payouts (a split wallet pays an artist only at the
  // artist's current payout address).
  for (const key of ["mara", "juno"] as const) {
    const artist = engine.state.artists.get(ids[key]);
    if (artist) {
      artist.payout = artist.authority;
    }
  }
  const oto = engine.state.artists.get(ids.oto);
  if (oto) {
    // A lost-key override is pending: nobody may act as this artist (IDENTITY-1).
    oto.restrainedUntil = MOCK_EPOCH + 150 * D;
  }
  for (const step of seedTimeline()) {
    const wait = step.at - engine.now();
    if (wait > 0) {
      engine.clock.advance(wait);
    }
    step.run(context);
    engine.state.txSequence += 1;
  }
  engine.clock.advance(Math.max(0, MOCK_EPOCH - engine.now()));
  seedCuration(context);
}

export { MOCK_ACCOUNTS, SEED_START };
