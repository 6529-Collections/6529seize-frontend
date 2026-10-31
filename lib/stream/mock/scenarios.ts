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
import type { Address, CurationItem, Hex32 } from "@/lib/stream/types";

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

function seedCuration(context: SeedContext): void {
  const { engine, ids } = context;
  const lowWater = mockHash("item:low-water");
  const saltLines = mockHash("item:salt-lines");
  const quarrySong = mockHash("item:quarry-song");
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
      packageRoot: mockHash("package:tidewater"),
      status: "REGISTERED",
      signer: mockAddress("account:curation-signer-1"),
      evidenceHash: mockHash("evidence:tidewater"),
      registeredAt: MOCK_EPOCH - 20 * H,
      waveVote: "6529 Stream submissions · TDH vote",
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
      packageRoot: mockHash("package:quarry-song"),
      status: "REGISTERED",
      signer: mockAddress("account:curation-signer-2"),
      evidenceHash: mockHash("evidence:quarry-song"),
      registeredAt: MOCK_EPOCH - 6 * H,
      waveVote: "6529 Stream submissions · TDH vote",
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
