import { encodeAbiParameters, keccak256, stringToBytes } from "viem";
import type { Config } from "wagmi";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { runOperation } from "@/lib/chain-identity/operation";
import { usableSessionKey } from "@/lib/chain-identity/session";
import { wavesGateway } from "@/lib/chain-waves/gateway";
import { legacyObjectId } from "@/lib/chain-waves/ids";
import {
  writeChainPollBallot,
  writeChainVote,
  writeChainWaveRating,
  loneClusterCid,
} from "@/lib/chain-waves/writers";
import { DECISION, ENTRY, VOTER, WALLET } from "./wavesDraftFixture";
import { repCategoryId } from "@/lib/chain/codec/ids";

jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: { getIdentityByWallet: jest.fn() },
}));
jest.mock("@/lib/chain-waves/gateway", () => ({
  wavesGateway: {
    getEntry: jest.fn(),
    getEntryByLegacy: jest.fn(),
    getDecision: jest.fn(),
    getVoterVotes: jest.fn(),
    getPoll: jest.fn(),
    getPollByLegacy: jest.fn(),
    findPollBallot: jest.fn(),
    getTdhWallet: jest.fn(),
    getTdhDayWallet: jest.fn(),
    getWave: jest.fn(),
    getWaveByLegacy: jest.fn(),
    getWaveRatingsByRater: jest.fn(),
  },
}));
jest.mock("@/lib/chain-identity/operation", () => ({
  ...jest.requireActual("@/lib/chain-identity/operation"),
  runOperation: jest.fn(),
}));
jest.mock("@/lib/chain-identity/session", () => ({
  ...jest.requireActual("@/lib/chain-identity/session"),
  usableSessionKey: jest.fn(),
}));
jest.mock("@/lib/chain-identity/signers", () => ({
  walletSigner: jest.fn(() => ({ keyType: 1, sign: jest.fn() })),
  sessionSigner: jest.fn(() => ({ keyType: 2, sign: jest.fn() })),
}));

const config = {} as Config;
const DROP_UUID = "6f1c2c4e-9a1b-4c3d-8e5f-0a1b2c3d4e5f";
const OTHER_WALLET = "0x2222222222222222222222222222222222222222";
const KEY = {
  principalId: VOTER,
  keyId: `0x${"aa".repeat(32)}`,
  publicKeyHex: "0x01",
  keyPair: {} as CryptoKeyPair,
  grantId: `0x${"bb".repeat(32)}`,
  expiresAtMs: Date.now() + 86_400_000,
};

// An imported drop's entry, poll and wave ids derive from its UUID.
const DROP_ENTRY = legacyObjectId(DROP_UUID, 0x0603);
const DROP_POLL = legacyObjectId(DROP_UUID, 0x060b);
const DROP_WAVE = legacyObjectId(DROP_UUID, 0x0501);

const gateway = wavesGateway as jest.Mocked<typeof wavesGateway>;

/** A decision taking votes: open window, votes from -100 to 1000. */
const OPEN_CONFIG = {
  creditScope: 1,
  votingStart: "0",
  votingEnd: "0",
  minVote: "-100",
  maxVote: "1000",
  perEntryCap: "0",
};
const identityByWallet = chainGateway.getIdentityByWallet as jest.Mock;
const run = runOperation as jest.Mock;
const sessionKey = usableSessionKey as jest.Mock;

const lastRequest = () => run.mock.calls.at(-1)?.[0];
const lastSigner = () => run.mock.calls.at(-1)?.[2];

beforeEach(() => {
  jest.clearAllMocks();
  identityByWallet.mockResolvedValue({
    principalId: VOTER,
    wallets: [WALLET, OTHER_WALLET],
  });
  sessionKey.mockResolvedValue(null);
  run.mockResolvedValue({});
  gateway.getEntry.mockImplementation(
    async (id) =>
      ({ entryId: id, decisionId: DECISION, status: "active" }) as never
  );
  gateway.getDecision.mockResolvedValue({
    decisionId: DECISION,
    configVersion: 2,
    status: "published",
    due: false,
    config: OPEN_CONFIG,
  } as never);
  gateway.getVoterVotes.mockResolvedValue({
    decisionId: DECISION,
    voter: VOTER,
    votes: [
      { entryId: DROP_ENTRY.toUpperCase(), value: "10", updatedHeight: 88 },
    ],
  } as never);
});

describe("writeChainVote", () => {
  it("drafts VOTE_SET for the drop's entry with the vote it replaces", async () => {
    await writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 25n });

    expect(gateway.getEntry).toHaveBeenCalledWith(DROP_ENTRY, undefined);
    expect(lastRequest()).toMatchObject({
      opType: "VOTE_SET",
      principal: VOTER,
      keyType: 1,
      signer: WALLET,
      body: {
        decisionId: DECISION,
        expectedConfigVersion: 2,
        entryId: DROP_ENTRY,
        amount: "25",
        priorVoteVersion: "88",
        budgetScope: 1,
      },
    });
    expect(run.mock.calls.at(-1)?.[4]).toBe("included");
  });

  it("names an entry made on the chain by its id", async () => {
    gateway.getVoterVotes.mockResolvedValue(null);
    await writeChainVote(config, WALLET, { dropId: ENTRY, amount: 1n });
    expect(gateway.getEntry).toHaveBeenCalledWith(ENTRY, undefined);
    expect(lastRequest().body.priorVoteVersion).toBe("0");
  });

  it("signs with the session key when its grant lists VOTE_SET", async () => {
    sessionKey.mockResolvedValue({
      ...KEY,
      ops: [0x0102, 0x0606, 0x0608, 0x0701],
    });
    await writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 3n });
    expect(lastRequest()).toMatchObject({
      keyType: 2,
      keyId: KEY.keyId,
      authRef: KEY.grantId,
    });
    expect(lastSigner()).toMatchObject({ keyType: 2 });
  });

  it("asks the wallet when the session key predates votes", async () => {
    sessionKey.mockResolvedValue(KEY);
    await writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 3n });
    expect(lastRequest()).toMatchObject({ keyType: 1, signer: WALLET });
  });

  it("says so when the wallet has no identity or the drop no entry", async () => {
    identityByWallet.mockResolvedValueOnce(null);
    await expect(
      writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 1n })
    ).rejects.toThrow("This wallet has no identity on the 6529 Network yet.");

    gateway.getEntry.mockResolvedValueOnce(null);
    await expect(
      writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 1n })
    ).rejects.toThrow("This entry isn't on the 6529 Network.");

    await expect(
      writeChainVote(config, WALLET, { dropId: "temp-123", amount: 1n })
    ).rejects.toThrow("This entry isn't on the 6529 Network.");
    expect(run).not.toHaveBeenCalled();
  });

  describe("refuses before signing what the chain would refuse in a block", () => {
    const decisionWith = (fields: Record<string, unknown>) =>
      gateway.getDecision.mockResolvedValue({
        decisionId: DECISION,
        configVersion: 2,
        status: "published",
        due: false,
        ...fields,
        config: {
          ...OPEN_CONFIG,
          ...((fields["config"] as object | undefined) ?? {}),
        },
      } as never);

    it.each([
      [
        "a decision not open",
        { status: "draft" },
        5n,
        "This decision isn't open.",
      ],
      [
        "a decision counting its result",
        { due: true },
        5n,
        "This decision is counting its result. Try again in a few minutes.",
      ],
      [
        "voting not started",
        { config: { votingStart: String(Date.now() + 600_000) } },
        5n,
        "Voting is closed in this decision.",
      ],
      [
        "voting ended",
        { config: { votingEnd: String(Date.now() - 600_000) } },
        5n,
        "Voting is closed in this decision.",
      ],
      [
        "a negative vote where none is allowed",
        { config: { minVote: "0" } },
        -5n,
        "Negative votes aren't allowed in this decision.",
      ],
      [
        "a vote above the range",
        { config: {} },
        1001n,
        "This vote is outside the range this decision allows.",
      ],
      [
        "a vote above the per-entry cap",
        { config: { perEntryCap: "50" } },
        -60n,
        "This vote is above the limit for one entry.",
      ],
    ])("%s", async (_why, fields, amount, sentence) => {
      decisionWith(fields);
      await expect(
        writeChainVote(config, WALLET, { dropId: DROP_UUID, amount })
      ).rejects.toThrow(sentence);
      expect(run).not.toHaveBeenCalled();
    });

    it("an entry no longer in the running", async () => {
      gateway.getEntry.mockImplementation(
        async (id) =>
          ({ entryId: id, decisionId: DECISION, status: "winner" }) as never
      );
      await expect(
        writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 5n })
      ).rejects.toThrow("This entry no longer takes votes.");
      expect(run).not.toHaveBeenCalled();
    });

    it("still takes a vote back to 0 from an ended decision", async () => {
      decisionWith({ status: "ended" });
      await writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 0n });
      expect(lastRequest().body).toMatchObject({
        amount: "0",
        priorVoteVersion: "88",
      });
    });

    it("sends nothing for a vote equal to the current one", async () => {
      await writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 10n });
      gateway.getVoterVotes.mockResolvedValue(null);
      await writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 0n });
      expect(run).not.toHaveBeenCalled();
    });

    it("leaves a window's edge within a minute to the chain", async () => {
      decisionWith({ config: { votingEnd: String(Date.now() - 30_000) } });
      await writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 5n });
      expect(run).toHaveBeenCalled();
    });
  });
});

describe("writeChainPollBallot", () => {
  const CID = `0x${"cc".repeat(32)}`;

  beforeEach(() => {
    gateway.getPoll.mockResolvedValue({
      pollId: DROP_POLL,
      snapshotDay: 30,
      status: "open",
      closeTime: Date.now() + 3_600_000,
      optionCount: 4,
      maxChoices: 2,
    } as never);
    gateway.findPollBallot.mockResolvedValue({
      cid: CID,
      selection: 1,
      version: 3,
    } as never);
  });

  it("goes through the first wallet the snapshot day's list holds", async () => {
    gateway.getTdhDayWallet.mockImplementation(async (_day, wallet) =>
      wallet === OTHER_WALLET
        ? ({ wallet, cid: CID, identityTdh: "9", walletCount: 2 } as never)
        : null
    );
    await writeChainPollBallot(config, WALLET, {
      pollId: DROP_UUID,
      optionNumbers: [2],
    });
    expect(gateway.getTdhDayWallet).toHaveBeenCalledWith(
      30,
      OTHER_WALLET,
      undefined
    );
    expect(gateway.getTdhWallet).not.toHaveBeenCalled();
    expect(gateway.findPollBallot).toHaveBeenCalledWith(
      DROP_POLL,
      CID,
      undefined
    );
    expect(lastRequest()).toMatchObject({
      opType: "POLL_BALLOT_SET",
      body: {
        pollId: DROP_POLL,
        selection: 0b10,
        priorVersion: 3,
        wallet: OTHER_WALLET,
      },
    });
  });

  it("keys a ballot of a cluster above 16 wallets by the wallet's own cid", async () => {
    gateway.getTdhDayWallet.mockImplementation(async (_day, wallet) =>
      wallet === WALLET
        ? ({ wallet, cid: CID, identityTdh: "9", walletCount: 17 } as never)
        : null
    );
    await writeChainPollBallot(config, WALLET, {
      pollId: DROP_UUID,
      optionNumbers: [3],
    });
    // abi.encode(keccak256("6529.TdhIdentity.v1"), address[] [w]), hashed.
    const lone = keccak256(
      encodeAbiParameters(
        [{ type: "bytes32" }, { type: "address[]" }],
        [keccak256(stringToBytes("6529.TdhIdentity.v1")), [WALLET]]
      )
    );
    expect(loneClusterCid(WALLET)).toBe(lone);
    expect(gateway.findPollBallot).toHaveBeenCalledWith(
      DROP_POLL,
      lone,
      undefined
    );
  });

  it("answers through another wallet of a large cluster when the first is below the least TDH", async () => {
    gateway.getPoll.mockResolvedValue({
      pollId: DROP_POLL,
      snapshotDay: 30,
      status: "open",
      closeTime: Date.now() + 3_600_000,
      optionCount: 4,
      maxChoices: 2,
      minTdh: "10",
    } as never);
    gateway.getTdhDayWallet.mockImplementation(
      async (_day, wallet) =>
        ({
          wallet,
          cid: CID,
          identityTdh: "500",
          walletTdh: wallet === WALLET ? "3" : "40",
          walletCount: 17,
        }) as never
    );
    await writeChainPollBallot(config, WALLET, {
      pollId: DROP_UUID,
      optionNumbers: [2],
    });
    expect(lastRequest().body.wallet).toBe(OTHER_WALLET);
  });

  it("leaves the least TDH to the chain off the snapshot day", async () => {
    gateway.getPoll.mockResolvedValue({
      pollId: DROP_POLL,
      snapshotDay: 30,
      status: "open",
      closeTime: Date.now() + 3_600_000,
      optionCount: 4,
      maxChoices: 2,
      minTdh: "10",
    } as never);
    gateway.getTdhDayWallet.mockResolvedValue(undefined);
    gateway.getTdhWallet.mockResolvedValue({
      leaf: { wallet: WALLET, cid: CID, identityTdh: "9", walletCount: 1 },
    } as never);
    await writeChainPollBallot(config, WALLET, {
      pollId: DROP_UUID,
      optionNumbers: [2],
    });
    expect(run).toHaveBeenCalled();
  });

  it("reads today's list when the node no longer keeps the snapshot day", async () => {
    gateway.getTdhDayWallet.mockResolvedValue(undefined);
    gateway.getTdhWallet.mockResolvedValue({
      leaf: { wallet: WALLET, cid: CID, identityTdh: "9", walletCount: 1 },
    } as never);
    await writeChainPollBallot(config, WALLET, {
      pollId: DROP_UUID,
      optionNumbers: [3],
    });
    expect(lastRequest().body.wallet).toBe(WALLET);
  });

  it("says so when no wallet holds TDH", async () => {
    gateway.getTdhDayWallet.mockResolvedValue(null);
    await expect(
      writeChainPollBallot(config, WALLET, {
        pollId: DROP_UUID,
        optionNumbers: [1],
      })
    ).rejects.toThrow("holds TDH");
    expect(run).not.toHaveBeenCalled();
  });

  it.each([
    ["a closed poll", { status: "closed" }, [2], "This poll is closed."],
    [
      "a poll past its close time",
      { closeTime: Date.now() - 120_000 },
      [2],
      "This poll is closed.",
    ],
    [
      "more options than the poll allows",
      {},
      [1, 2, 3],
      "That's more options than this poll allows.",
    ],
    [
      "an option the poll doesn't have",
      {},
      [5],
      "That's more options than this poll allows.",
    ],
    [
      "the answer already given",
      {},
      [1],
      "That's already your answer in this poll.",
    ],
    [
      "a cluster below the poll's least TDH on its snapshot day",
      { minTdh: "10" },
      [2],
      "You can't answer this poll.",
    ],
  ])("refuses %s before signing", async (_why, fields, options, sentence) => {
    gateway.getTdhDayWallet.mockResolvedValue({
      wallet: WALLET,
      cid: CID,
      identityTdh: "9",
      walletCount: 1,
    } as never);
    gateway.getPoll.mockResolvedValue({
      pollId: DROP_POLL,
      snapshotDay: 30,
      status: "open",
      closeTime: Date.now() + 3_600_000,
      optionCount: 4,
      maxChoices: 2,
      ...fields,
    } as never);
    await expect(
      writeChainPollBallot(config, WALLET, {
        pollId: DROP_UUID,
        optionNumbers: options,
      })
    ).rejects.toThrow(sentence);
    expect(run).not.toHaveBeenCalled();
  });
});

describe("writeChainWaveRating", () => {
  beforeEach(() => {
    gateway.getWave.mockResolvedValue({ waveId: DROP_WAVE } as never);
    gateway.getWaveRatingsByRater.mockResolvedValue([
      {
        rater: VOTER,
        target: DROP_WAVE,
        category: { id: repCategoryId("Quality"), name: "Quality" },
        value: 5,
        updatedHeight: 41,
      },
    ] as never);
  });

  it("replaces the rater's rating of the wave in that category", async () => {
    await writeChainWaveRating(config, WALLET, {
      waveId: DROP_UUID,
      category: "quality",
      value: 12n,
    });
    expect(gateway.getWave).toHaveBeenCalledWith(DROP_WAVE, undefined);
    expect(lastRequest()).toMatchObject({
      opType: "RATING_SET",
      body: {
        matter: 1,
        targetKind: 2,
        target: DROP_WAVE,
        categoryName: "quality",
        value: "12",
        priorVersion: "41",
      },
    });
  });

  it("starts a new category at version 0", async () => {
    await writeChainWaveRating(config, WALLET, {
      waveId: DROP_UUID,
      category: "Craft",
      value: 2n,
    });
    expect(lastRequest().body.priorVersion).toBe("0");
  });
});

describe("the gateway's answers", () => {
  it("must name the object asked for", async () => {
    gateway.getEntry.mockResolvedValueOnce({
      entryId: ENTRY,
      decisionId: DECISION,
    } as never);
    await expect(
      writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 1n })
    ).rejects.toThrow("answered for a different object");
    expect(run).not.toHaveBeenCalled();
  });

  it("must give the entry's own decision", async () => {
    gateway.getDecision.mockResolvedValueOnce({
      decisionId: `0x${"d2".repeat(32)}`,
      configVersion: 2,
      config: { creditScope: 1 },
    } as never);
    await expect(
      writeChainVote(config, WALLET, { dropId: DROP_UUID, amount: 1n })
    ).rejects.toThrow("decision isn't on the 6529 Network");
  });
});
