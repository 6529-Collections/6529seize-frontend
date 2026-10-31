import { appendStatement, createEditionFor } from "@/lib/stream/mock/curation";
import { MOCK_EPOCH } from "@/lib/stream/mock/engine";
import {
  deployFederated,
  mintViaAuction,
  openFederatedEdition,
  setFederatedStatus,
} from "@/lib/stream/mock/federated";
import {
  claimEditionBid,
  findEditionAuction,
  placeEditionBid,
  prepareEditionAuction,
  raiseEditionBid,
} from "@/lib/stream/mock/sales/editionAuction";
import { settleEditionAuction } from "@/lib/stream/mock/sales/editionSettlement";
import {
  pauseEnglishAuction,
  resolveEnglishDispute,
  settleEnglishAuction,
} from "@/lib/stream/mock/sales/englishAuction";
import {
  authority,
  bid,
  COLLECTIONS,
  D,
  editionBids,
  editionOf,
  eth,
  federatedAddress,
  H,
  launch,
  M,
  MOCK_ACCOUNTS,
  OTHER_BIDDERS,
  saleOf,
  type SeedContext,
  SEED_START,
  spec,
  type Step,
  work,
} from "@/lib/stream/mock/scenarioKit";
import { addLinkedEdition } from "@/lib/stream/mock/tokens";

/**
 * Four simulated days of activity, as timed steps. `seedScenarios` runs them
 * in time order through the same functions the mock's actions use.
 */

function earlySteps(): Step[] {
  const S = SEED_START;
  return [
    {
      at: S,
      run: (c) =>
        launch(
          c,
          "saltMeridian",
          spec(c, "mara", {
            title: "Salt Meridian",
            description:
              "A salt flat at noon, drawn as a single line that never lifts.",
            medium: "Generative drawing",
            style: "orbits",
            seed: 11,
            collection: COLLECTIONS.fieldNotes,
            storage: {
              locators: ["ARWEAVE", "IPFS", "ONCHAIN"],
              preferred: 2,
              onChainComplete: true,
              finalized: true,
            },
          })
        ),
    },
    {
      at: S + H,
      run: (c) =>
        launch(
          c,
          "lanternField",
          spec(c, "oto", {
            title: "Lantern Field",
            description:
              "Twelve minutes of shortwave static, folded into a grid.",
            medium: "Scanned signal",
            style: "grid",
            seed: 23,
            collection: COLLECTIONS.signal,
          })
        ),
    },
    {
      at: S + 2 * H,
      run: (c) => bid(c, "saltMeridian", MOCK_ACCOUNTS.collectorB, "0.2"),
    },
    {
      at: S + 2 * H + 30 * M,
      run: (c) => {
        const result = deployFederated(c.engine, authority(c, "juno"), {
          form: "ERC721",
          name: "Halden Studio",
          symbol: "HALDEN",
          defaultLicense: "LicenseRef-All-Rights-Reserved",
        });
        c.federated.set(
          "halden",
          result.contracts[0] ?? MOCK_ACCOUNTS.guardian
        );
      },
    },
    {
      at: S + 3 * H,
      run: (c) => {
        const result = deployFederated(c.engine, authority(c, "wren"), {
          form: "ERC721",
          name: "Mara Vell Official",
          symbol: "MVO",
          defaultLicense: "CC0-1.0",
        });
        c.federated.set(
          "counterfeit",
          result.contracts[0] ?? MOCK_ACCOUNTS.guardian
        );
      },
    },
    {
      at: S + 4 * H,
      run: (c) => {
        const key = mintViaAuction(
          c.engine,
          authority(c, "juno"),
          federatedAddress(c, "halden"),
          "Ferry Light"
        );
        c.works.set("ferryLight", c.engine.token(key));
      },
    },
    {
      at: S + 5 * H,
      run: (c) => {
        const key = mintViaAuction(
          c.engine,
          authority(c, "wren"),
          federatedAddress(c, "counterfeit"),
          "Untitled (after Mara Vell)"
        );
        c.works.set("counterfeitWork", c.engine.token(key));
      },
    },
    {
      at: S + 6 * H,
      run: (c) => bid(c, "counterfeitWork", MOCK_ACCOUNTS.collectorB, "0.05"),
    },
    {
      at: S + 10 * H,
      run: (c) => bid(c, "saltMeridian", MOCK_ACCOUNTS.collectorA, "0.5"),
    },
    {
      at: S + 20 * H,
      run: (c) => bid(c, "saltMeridian", MOCK_ACCOUNTS.collectorB, "0.8"),
    },
    // A bid in the last 15 minutes moves the end to 15 minutes after it.
    {
      at: S + D - 10 * M,
      run: (c) => bid(c, "saltMeridian", MOCK_ACCOUNTS.collectorA, "1.2"),
    },
    {
      at: S + D + 10 * M,
      run: (c) => settleEnglishAuction(c.engine, saleOf(c, "saltMeridian")),
    },
  ];
}

/** The owner's worked example (PLAN Appendix C, trace 2): 80 editions at 0.0511 ETH. */
const OPEN_LEDGER_BOOK: readonly (readonly [number, number, number])[] = [
  [0, 192, 1],
  [1, 158, 4],
  [2, 158, 5],
  [3, 144, 8],
  [4, 144, 12],
  [5, 130, 20],
  [6, 130, 15],
  [7, 130, 15],
  [0, 96, 60],
  [1, 96, 70],
  [2, 96, 70],
];

function dayOneSteps(): Step[] {
  const S = SEED_START + D;
  return [
    {
      at: S + H,
      run: (c) =>
        launch(
          c,
          "emberIndex",
          spec(c, "mara", {
            title: "Ember Index",
            description:
              "An index of embers, one row per minute of a campfire.",
            medium: "Generative drawing",
            style: "field",
            seed: 37,
            kind: "EDITION_MASTER",
            collection: COLLECTIONS.fieldNotes,
            seedPolicy: "ARTIST",
          }),
          0
        ),
    },
    {
      at: S + 2 * H,
      run: (c) => settleEnglishAuction(c.engine, saleOf(c, "lanternField")),
    },
    {
      at: S + 3 * H,
      run: (c) => {
        bid(c, "emberIndex", MOCK_ACCOUNTS.collectorA, "0.3");
        editionBids(c, "emberIndex", [
          [MOCK_ACCOUNTS.collectorA, 120, 3],
          [MOCK_ACCOUNTS.collectorB, 130, 2],
          [OTHER_BIDDERS[0] ?? MOCK_ACCOUNTS.guardian, 110, 10],
          [OTHER_BIDDERS[1] ?? MOCK_ACCOUNTS.guardian, 100, 25],
          [OTHER_BIDDERS[2] ?? MOCK_ACCOUNTS.guardian, 125, 4],
        ]);
      },
    },
    {
      at: S + 5 * H,
      run: (c) => settleEnglishAuction(c.engine, saleOf(c, "ferryLight")),
    },
    {
      at: S + 6 * H,
      run: (c) => {
        launch(
          c,
          "withdrawnLight",
          spec(c, "oto", {
            title: "Withdrawn Light",
            description:
              "A signal painting later found to reuse another artist's scan.",
            medium: "Scanned signal",
            style: "bands",
            seed: 41,
            kind: "EDITION_MASTER",
            collection: COLLECTIONS.signal,
          }),
          0
        );
        deployFederated(c.engine, authority(c, "tomas"), {
          form: "ERC1155",
          name: "Reik Multiples",
          symbol: "REIK",
          defaultLicense: "CC-BY-4.0",
        });
      },
    },
    {
      at: S + 7 * H,
      run: (c) => {
        const result = deployFederated(c.engine, authority(c, "sable"), {
          form: "PAIR",
          name: "Ohm Rooms",
          symbol: "OHM",
          editionName: "Ohm Rooms Editions",
          editionSymbol: "OHME",
          defaultLicense: "LicenseRef-Ohm-Studio-1.0",
        });
        c.federated.set("ohm", result.contracts[0] ?? MOCK_ACCOUNTS.guardian);
        bid(c, "withdrawnLight", MOCK_ACCOUNTS.collectorA, "0.2");
        editionBids(c, "withdrawnLight", [
          [MOCK_ACCOUNTS.collectorA, 115, 2],
          [MOCK_ACCOUNTS.collectorB, 105, 5],
        ]);
      },
    },
    {
      at: S + 10 * H,
      run: (c) => pauseEnglishAuction(c.engine, saleOf(c, "withdrawnLight")),
    },
    {
      at: S + 12 * H,
      run: (c) => {
        const statement = appendStatement(c.engine, {
          role: "CURATOR",
          kind: "DELISTING",
          subject: { token: federatedAddress(c, "counterfeit"), id: 0 },
          summary: "TDH vote: delisted for impersonating another artist.",
        });
        setFederatedStatus(
          c.engine,
          federatedAddress(c, "counterfeit"),
          true,
          statement
        );
      },
    },
    {
      at: S + 20 * H,
      run: (c) => {
        // Collector B bids from a contract wallet that refuses ERC-721 transfers,
        // so settlement leaves a pending delivery to claim.
        saleOf(c, "emberIndex").refusingRecipients.push(
          MOCK_ACCOUNTS.collectorB
        );
        bid(c, "emberIndex", MOCK_ACCOUNTS.collectorB, "0.4");
      },
    },
  ];
}

function dayTwoSteps(): Step[] {
  const S = SEED_START + 2 * D;
  return [
    {
      at: S,
      run: (c) =>
        launch(
          c,
          "glassOrchard",
          spec(c, "ines", {
            title: "Glass Orchard",
            description: "Rows of glass trees grown from a glaze simulation.",
            medium: "Generative glaze",
            style: "orbits",
            seed: 53,
            kind: "EDITION_MASTER",
            collection: COLLECTIONS.tidewater,
          }),
          0
        ),
    },
    {
      at: S + H,
      run: (c) => {
        launch(
          c,
          "openLedger",
          spec(c, "oto", {
            title: "Open Ledger",
            description: "A ledger of every frequency heard in one night.",
            medium: "Scanned signal",
            style: "grid",
            seed: 59,
            kind: "EDITION_MASTER",
            collection: COLLECTIONS.signal,
          }),
          0
        );
        const pool = [
          MOCK_ACCOUNTS.collectorA,
          MOCK_ACCOUNTS.collectorB,
          ...OTHER_BIDDERS,
        ];
        editionBids(
          c,
          "openLedger",
          OPEN_LEDGER_BOOK.map(([who, step, qty]) => [
            pool[who] ?? MOCK_ACCOUNTS.guardian,
            step,
            qty,
          ])
        );
      },
    },
    {
      at: S + H + 30 * M,
      run: (c) => settleEnglishAuction(c.engine, saleOf(c, "emberIndex")),
    },
    {
      at: S + 2 * H,
      run: (c) => {
        createEditionFor(c.engine, work(c, "emberIndex").key);
        settleEditionAuction(c.engine, editionOf(c, "emberIndex"));
        claimEditionBid(
          c.engine,
          editionOf(c, "emberIndex"),
          MOCK_ACCOUNTS.collectorB,
          2,
          MOCK_ACCOUNTS.collectorB
        );
        bid(c, "glassOrchard", MOCK_ACCOUNTS.collectorA, "0.25");
        bid(c, "openLedger", MOCK_ACCOUNTS.collectorA, "1.5");
      },
    },
    {
      at: S + 3 * H,
      run: (c) => {
        const key = mintViaAuction(
          c.engine,
          authority(c, "sable"),
          federatedAddress(c, "ohm"),
          "Two Rooms"
        );
        c.works.set("twoRooms", c.engine.token(key));
      },
    },
    {
      at: S + 5 * H,
      run: (c) => {
        bid(c, "glassOrchard", MOCK_ACCOUNTS.collectorB, "0.3");
        bid(c, "twoRooms", MOCK_ACCOUNTS.collectorA, "0.15");
        bid(c, "openLedger", MOCK_ACCOUNTS.collectorB, "2.4");
        editionBids(c, "glassOrchard", [
          [MOCK_ACCOUNTS.collectorA, 118, 2],
          [MOCK_ACCOUNTS.collectorB, 112, 4],
          [OTHER_BIDDERS[3] ?? MOCK_ACCOUNTS.guardian, 108, 6],
        ]);
        editionBids(c, "twoRooms", [
          [MOCK_ACCOUNTS.collectorA, 100, 2],
          [MOCK_ACCOUNTS.collectorB, 96, 5],
          [OTHER_BIDDERS[4] ?? MOCK_ACCOUNTS.guardian, 104, 3],
        ]);
      },
    },
    {
      at: S + 8 * H,
      run: (c) => pauseEnglishAuction(c.engine, saleOf(c, "glassOrchard")),
    },
    {
      at: S + 23 * H + 30 * M,
      run: (c) =>
        launch(
          c,
          "nightTide",
          spec(c, "ines", {
            title: "Night Tide",
            description:
              "The tide line after dark, traced from long exposures.",
            medium: "Generative glaze",
            style: "bands",
            seed: 61,
            collection: COLLECTIONS.tidewater,
          })
        ),
    },
  ];
}

/** The capped book with a raise hole at the cut step (PLAN section 1.6). */
function foldStudyBook(context: SeedContext): void {
  const auction = editionOf(context, "foldStudy");
  const other = OTHER_BIDDERS[5] ?? MOCK_ACCOUNTS.guardian;
  const late = OTHER_BIDDERS[6] ?? MOCK_ACCOUNTS.guardian;
  placeEditionBid(context.engine, auction, MOCK_ACCOUNTS.collectorA, 130, 12);
  const raised = placeEditionBid(
    context.engine,
    auction,
    MOCK_ACCOUNTS.collectorB,
    130,
    8
  );
  placeEditionBid(context.engine, auction, other, 130, 6);
  placeEditionBid(context.engine, auction, MOCK_ACCOUNTS.collectorB, 130, 10);
  placeEditionBid(context.engine, auction, late, 133, 3);
  // The raise leaves a hole at position 12 of step 130; settlement sweeps it.
  raiseEditionBid(
    context.engine,
    auction,
    MOCK_ACCOUNTS.collectorB,
    raised.id,
    132
  );
}

function dayThreeMorningSteps(): Step[] {
  const S = SEED_START + 3 * D;
  return [
    {
      at: S + 10 * M,
      run: (c) => {
        launch(
          c,
          "foldStudy",
          spec(c, "oto", {
            title: "Fold Study 7",
            description:
              "A printout folded seven times and scanned at each fold.",
            medium: "Scanned paper",
            style: "grid",
            seed: 67,
            kind: "EDITION_MASTER",
            collection: COLLECTIONS.signal,
          }),
          25
        );
        foldStudyBook(c);
      },
    },
    {
      at: S + H + 5 * M,
      run: (c) => {
        settleEnglishAuction(c.engine, saleOf(c, "openLedger"));
        createEditionFor(c.engine, work(c, "openLedger").key);
      },
    },
    {
      at: S + 2 * H,
      run: (c) => {
        const token = work(c, "saltMeridian");
        appendStatement(c.engine, {
          role: "CURATOR",
          kind: "DISPUTE_OUTCOME",
          subject: { token: token.token, id: token.tokenId },
          summary:
            "Attribution question reviewed by TDH vote: no change to the work.",
        });
        const royalty = c.engine.splitWallet(token.economics.royaltyReceiver);
        if (royalty) {
          royalty.received += eth("0.07835");
        }
      },
    },
    {
      at: S + 3 * H + 10 * M,
      run: (c) => settleEnglishAuction(c.engine, saleOf(c, "twoRooms")),
    },
    {
      at: S + 4 * H,
      run: (c) => {
        settleEditionAuction(c.engine, editionOf(c, "twoRooms"));
        bid(c, "foldStudy", MOCK_ACCOUNTS.collectorB, "0.5");
      },
    },
    {
      at: S + 6 * H,
      run: (c) => {
        const reik = c.engine.state.artists.get(c.ids.tomas)
          ?.federatedContracts[0];
        if (reik === undefined) {
          throw new Error("seed: no Reik contract");
        }
        const key = openFederatedEdition(
          c.engine,
          authority(c, "tomas"),
          reik,
          {
            title: "Grain 01",
            cap: 0,
          }
        );
        c.works.set("grain", c.engine.token(key));
        const auction = findEditionAuction(c.engine, key);
        placeEditionBid(c.engine, auction, MOCK_ACCOUNTS.collectorA, 90, 3);
        placeEditionBid(c.engine, auction, MOCK_ACCOUNTS.collectorB, 84, 6);
        placeEditionBid(
          c.engine,
          auction,
          OTHER_BIDDERS[7] ?? MOCK_ACCOUNTS.guardian,
          80,
          12
        );
      },
    },
    {
      at: S + 11 * H,
      run: (c) => {
        // The TDH vote's outcome is recorded first; the cancel cites it.
        const token = work(c, "withdrawnLight");
        appendStatement(c.engine, {
          role: "CURATOR",
          kind: "DISPUTE_OUTCOME",
          subject: { token: token.token, id: token.tokenId },
          summary:
            "Dispute upheld by TDH vote: the sale is cancelled and bids refunded.",
        });
        resolveEnglishDispute(c.engine, saleOf(c, "withdrawnLight"), true);
      },
    },
    {
      at: S + 11 * H + 5 * M,
      run: (c) =>
        settleEditionAuction(c.engine, editionOf(c, "withdrawnLight")),
    },
  ];
}

function dayThreeEveningSteps(): Step[] {
  const S = SEED_START + 3 * D;
  return [
    {
      at: S + 12 * H,
      run: (c) => {
        launch(
          c,
          "quietEngine",
          spec(c, "mara", {
            title: "Quiet Engine",
            description:
              "A motor drawn from its own vibration, one revolution per line.",
            medium: "Generative drawing",
            style: "field",
            seed: 71,
            kind: "EDITION_MASTER",
            collection: COLLECTIONS.fieldNotes,
            seedPolicy: "ARTIST",
            storage: {
              locators: ["ARWEAVE", "IPFS", "ONCHAIN"],
              preferred: 0,
              onChainComplete: false,
            },
          }),
          0
        );
        bid(c, "quietEngine", MOCK_ACCOUNTS.collectorB, "0.12");
        editionBids(c, "quietEngine", [
          [MOCK_ACCOUNTS.collectorA, 112, 3],
          [MOCK_ACCOUNTS.collectorB, 120, 1],
          [OTHER_BIDDERS[0] ?? MOCK_ACCOUNTS.guardian, 100, 12],
          [OTHER_BIDDERS[1] ?? MOCK_ACCOUNTS.guardian, 106, 5],
          [OTHER_BIDDERS[2] ?? MOCK_ACCOUNTS.guardian, 96, 30],
        ]);
      },
    },
    {
      at: S + 20 * H,
      run: (c) => {
        launch(
          c,
          "copperRain",
          spec(c, "mara", {
            title: "Copper Rain",
            description:
              "Interactive: copper particles drift through a seeded wind field.",
            medium: "HTML, JavaScript",
            style: "canvas",
            seed: 83,
            kind: "EDITION_MASTER",
            collaborators: [c.ids.ines],
            payees: [
              { artistId: c.ids.mara, share: 70_000 },
              { artistId: c.ids.ines, share: 30_000 },
            ],
            seedPolicy: "VRF",
            storage: {
              locators: ["ARWEAVE", "IPFS"],
              preferred: 1,
              onChainComplete: false,
            },
          })
        );
        // An edition master whose edition auction nobody has opened yet.
        const master = work(c, "copperRain");
        const edition = addLinkedEdition(c.engine, master, {
          token: c.engine.contracts.editions,
          variant: "stream-edition",
          created: false,
        });
        prepareEditionAuction(c.engine, edition.key, {
          master: master.key,
          cap: 40,
        });
      },
    },
    {
      at: S + 23 * H,
      run: (c) => bid(c, "copperRain", MOCK_ACCOUNTS.collectorA, "0.1"),
    },
    {
      at: S + 23 * H + 4 * M,
      run: (c) => bid(c, "quietEngine", MOCK_ACCOUNTS.collectorA, "0.2"),
    },
    // Inside the last 15 minutes: the end moves to 15 minutes after this bid.
    {
      at: MOCK_EPOCH - 2 * M,
      run: (c) => bid(c, "foldStudy", MOCK_ACCOUNTS.collectorA, "0.6"),
    },
  ];
}

/**
 * A wide book, from 0.000105 to 1.96 ETH: 26 words of the ladder, so settling
 * takes two calls (rc.2 scans 24 words per call). Typical sales take one.
 */
const TIDE_TABLE_BOOK: readonly (readonly [number, number, number])[] = [
  [5, 206, 1],
  [1, 168, 3],
  [6, 144, 10],
  [0, 120, 4],
  [7, 120, 56],
  [8, 110, 90],
  [0, 1, 5],
  [9, 6, 40],
  [2, 1, 25],
];

/**
 * Tide Table: its 1/1 drew no bids (it goes to the museum) and its editions
 * still sold, 164 at 0.0196 ETH. The first settle call scanned 24 words and
 * stopped, so the sale is SETTLING with 2 words left: anyone can continue.
 */
function tideTableSteps(): Step[] {
  const S = SEED_START + 2 * D + 23 * H + 40 * M;
  const pool = [
    MOCK_ACCOUNTS.collectorA,
    MOCK_ACCOUNTS.collectorB,
    ...OTHER_BIDDERS,
  ];
  const bids = (from: number, to: number) => (c: SeedContext) =>
    editionBids(
      c,
      "tideTable",
      TIDE_TABLE_BOOK.slice(from, to).map(([who, step, qty]) => [
        pool[who] ?? MOCK_ACCOUNTS.guardian,
        step,
        qty,
      ])
    );
  return [
    {
      at: S,
      run: (c) =>
        launch(
          c,
          "tideTable",
          spec(c, "ines", {
            title: "Tide Table",
            description: "A year of tide heights, one glaze band per day.",
            medium: "Generative glaze",
            style: "field",
            seed: 89,
            kind: "EDITION_MASTER",
            collection: COLLECTIONS.tidewater,
          }),
          0
        ),
    },
    { at: S + 20 * M, run: bids(0, 3) },
    { at: S + 9 * H, run: bids(3, 6) },
    { at: S + 17 * H, run: bids(6, 9) },
    {
      at: S + D + 16 * M,
      run: (c) => {
        settleEnglishAuction(c.engine, saleOf(c, "tideTable"));
        createEditionFor(c.engine, work(c, "tideTable").key);
      },
    },
    {
      at: S + D + 17 * M,
      run: (c) => settleEditionAuction(c.engine, editionOf(c, "tideTable")),
    },
  ];
}

/** Every seeded step, in time order. */
export function seedTimeline(): Step[] {
  return [
    ...earlySteps(),
    ...dayOneSteps(),
    ...dayTwoSteps(),
    ...dayThreeMorningSteps(),
    ...dayThreeEveningSteps(),
    ...tideTableSteps(),
  ].sort((left, right) => left.at - right.at);
}
