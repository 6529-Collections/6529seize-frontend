import { bytesToString, type Hex } from "viem";
import type { Config } from "wagmi";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropType } from "@/generated/models/ApiDropType";
import {
  ChainGatewayError,
  chainGateway,
  chainGatewayGet,
} from "@/lib/chain-identity/gateway";
import { derivedId } from "@/lib/chain/codec/ids";
import {
  ChainOperationError,
  runOperation,
} from "@/lib/chain-identity/operation";
import { usableSessionKey } from "@/lib/chain-identity/session";
import { docCid } from "@/lib/chain-waves/docs";
import {
  entryManifestDocument,
  type EntryManifest,
} from "@/lib/chain-waves/entryManifest";
import { createdEntryId } from "@/lib/chain-waves/entryOps";
import {
  ChainEntryPendingError,
  writeChainEntry,
  writeChainWithdrawal,
} from "@/lib/chain-waves/entryWriters";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import { wavesGateway } from "@/lib/chain-waves/gateway";
import { VOTER, WALLET } from "./wavesDraftFixture";

jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: { getIdentityByWallet: jest.fn(), uploadDoc: jest.fn() },
  // entryGateway's reads: a decision by legacy id, a wave's decisions.
  chainGatewayGet: jest.fn(),
}));
jest.mock("@/lib/chain-waves/gateway", () => ({
  wavesGateway: {
    getDecision: jest.fn(),
    getEntry: jest.fn(),
    getWave: jest.fn(),
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
const TX: Hex = `0x${"7e".repeat(32)}`;
const COMPETITION_UUID = "9e0a2c4e-9a1b-4c3d-8e5f-0a1b2c3d4e5f";
const WAVE_UUID = "7d0a2c4e-9a1b-4c3d-8e5f-0a1b2c3d4e5f";
const DROP_UUID = "6f1c2c4e-9a1b-4c3d-8e5f-0a1b2c3d4e5f";
const OTHER: Hex = `0x${"22".repeat(32)}`;

// An imported object's id: DerivedId(uuid || 16 zero bytes, 0, kind)
// (chain-tx `legacy_object_id`). The gateway's answers are checked against it.
const imported = (uuid: string, kind: number): Hex =>
  derivedId(`0x${uuid.replace(/-/g, "")}${"00".repeat(16)}`, 0n, kind);
const DECISION = imported(COMPETITION_UUID, 0x0601);
const WAVE = imported(WAVE_UUID, 0x0501);
const ENTRY = imported(DROP_UUID, 0x0603);

const gateway = wavesGateway as jest.Mocked<typeof wavesGateway>;
const gatewayGet = chainGatewayGet as jest.Mock;
const entries = { getWaveDecisions: jest.fn() };
const identityByWallet = chainGateway.getIdentityByWallet as jest.Mock;
const uploadDoc = chainGateway.uploadDoc as jest.Mock;
const run = runOperation as jest.Mock;
const sessionKey = usableSessionKey as jest.Mock;

const decision = (overrides: Record<string, unknown> = {}) =>
  ({
    decisionId: DECISION,
    waveId: WAVE,
    configVersion: 3,
    status: "published",
    due: false,
    config: { participationStart: "0", participationEnd: "0" },
    ...overrides,
  }) as never;

const request = (): ApiCreateDropRequest => ({
  wave_id: WAVE_UUID,
  drop_type: ApiDropType.Participatory,
  title: "Entry",
  parts: [{ content: "Hello", media: [] }],
  referenced_nfts: [],
  mentioned_users: [],
  metadata: [],
  signature: null,
  signer_address: WALLET,
});

const lastRequest = () => run.mock.calls.at(-1)?.[0];
const storedManifest = (): EntryManifest =>
  JSON.parse(
    bytesToString(uploadDoc.mock.calls.at(-1)?.[0] as Uint8Array)
  ) as EntryManifest;

beforeEach(() => {
  jest.clearAllMocks();
  entries.getWaveDecisions.mockReset();
  gatewayGet.mockImplementation(async (path: string) => {
    if (path === `/v1/waves/${WAVE}/decisions`) {
      return entries.getWaveDecisions(WAVE, undefined);
    }
    throw new Error(`unexpected read ${path}`);
  });
  identityByWallet.mockResolvedValue({ principalId: VOTER, wallets: [WALLET] });
  sessionKey.mockResolvedValue({ keyId: "0x01" });
  uploadDoc.mockResolvedValue({});
  run.mockResolvedValue({ draft: { txId: TX } });
  gateway.getDecision.mockResolvedValue(decision({ configVersion: 4 }));
});

describe("writeChainEntry", () => {
  it("keeps the manifest, then has the wallet sign SUBMISSION_CREATE against the fresh decision", async () => {
    const consent = jest.fn().mockResolvedValue(null);
    const receipt = await writeChainEntry(config, WALLET, {
      request: request(),
      competitionId: COMPETITION_UUID,
      consent,
    });

    // The competition's decision, by the id its import derives.
    expect(gateway.getDecision).toHaveBeenCalledWith(DECISION, undefined);
    expect(consent).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Entry", wave_id: WAVE_UUID }),
      expect.any(Function)
    );
    const manifest = storedManifest();
    expect(manifest).toMatchObject({
      v: 1,
      kind: "entry",
      decision: DECISION,
      wave: WAVE,
      author: VOTER,
      title: "Entry",
      consent: null,
    });
    expect(manifest).not.toHaveProperty("signer_address");
    const document = entryManifestDocument(manifest);
    expect(uploadDoc).toHaveBeenCalledWith(
      document.bytes,
      docCid(document.bytes),
      undefined
    );
    expect(lastRequest()).toEqual({
      opType: "SUBMISSION_CREATE",
      principal: VOTER,
      keyType: 1,
      signer: WALLET,
      body: {
        decisionId: DECISION,
        expectedConfigVersion: 4,
        manifestHash: document.manifestHash,
        contentCid: document.contentCid,
      },
    });
    // Wallet-only: no session key is looked up, and the write waits for
    // finality.
    expect(sessionKey).not.toHaveBeenCalled();
    expect(run.mock.calls.at(-1)?.[4]).toBe("final");
    expect(receipt).toEqual({
      entryId: createdEntryId(TX),
      txId: TX,
      decisionId: DECISION,
      manifestHash: document.manifestHash,
      contentCid: document.contentCid,
    });
  });

  it("asks for the consent before anything is stored or signed", async () => {
    const order: string[] = [];
    uploadDoc.mockImplementation(async () => {
      order.push("store");
      return {};
    });
    run.mockImplementation(async () => {
      order.push("sign");
      return { draft: { txId: TX } };
    });
    await writeChainEntry(config, WALLET, {
      request: request(),
      competitionId: COMPETITION_UUID,
      consent: async () => {
        order.push("consent");
        return null;
      },
    });
    expect(order).toEqual(["consent", "store", "sign"]);
  });

  it("sends to the decision the API's chain_id names, for one made on the chain", async () => {
    const chainMade: Hex = `0x${"3c".repeat(32)}`;
    gateway.getDecision.mockResolvedValue(
      decision({ decisionId: chainMade, configVersion: 2 })
    );
    await writeChainEntry(config, WALLET, {
      request: request(),
      competitionId: "9a404fbe-be9b-5cbb-a70b-872173014744",
      competitionChainId: chainMade,
      consent: async () => null,
    });
    expect(gateway.getDecision).toHaveBeenCalledWith(chainMade, undefined);
    expect(gateway.getDecision).not.toHaveBeenCalledWith(
      imported("9a404fbe-be9b-5cbb-a70b-872173014744", 0x0601),
      undefined
    );
    expect(lastRequest().body.decisionId).toBe(chainMade);
  });

  it("refuses a chain_id whose decision is in another wave", async () => {
    gateway.getDecision.mockResolvedValue(
      decision({ decisionId: OTHER, waveId: `0x${"44".repeat(32)}` })
    );
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: COMPETITION_UUID,
        competitionChainId: OTHER,
        consent: async () => null,
      })
    ).rejects.toThrow("This decision isn't in this wave on the 6529 Network.");
    expect(run).not.toHaveBeenCalled();
  });

  it("finds the wave's one published decision when no competition is named", async () => {
    gateway.getWave.mockResolvedValue({ waveId: WAVE } as never);
    entries.getWaveDecisions.mockResolvedValue([
      decision({ decisionId: OTHER, status: "ended" }),
      decision(),
    ] as never);
    await writeChainEntry(config, WALLET, {
      request: request(),
      competitionId: null,
      consent: async () => null,
    });
    expect(gateway.getWave).toHaveBeenCalledWith(WAVE, undefined);
    expect(lastRequest().body.decisionId).toBe(DECISION);
  });

  it("refuses a wave with several decisions taking entries", async () => {
    gateway.getWave.mockResolvedValue({ waveId: WAVE } as never);
    entries.getWaveDecisions.mockResolvedValue([
      decision({ decisionId: OTHER }),
      decision(),
    ] as never);
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: null,
        consent: async () => null,
      })
    ).rejects.toThrow("more than one open decision");
    expect(run).not.toHaveBeenCalled();
  });

  it("says so when the decision isn't on the chain, isn't published, or is counting", async () => {
    gateway.getDecision.mockResolvedValueOnce(null);
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: COMPETITION_UUID,
        consent: async () => null,
      })
    ).rejects.toThrow("This decision isn't on the 6529 Network.");

    gateway.getDecision.mockResolvedValueOnce(decision({ status: "ended" }));
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: COMPETITION_UUID,
        consent: async () => null,
      })
    ).rejects.toThrow("isn't taking entries");

    gateway.getDecision.mockResolvedValueOnce(decision({ due: true }));
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: COMPETITION_UUID,
        consent: async () => null,
      })
    ).rejects.toThrow("counting its result");
    expect(run).not.toHaveBeenCalled();
  });

  it("refuses outside the decision's entry window", async () => {
    gateway.getDecision.mockResolvedValue(
      decision({
        config: { participationStart: "0", participationEnd: "1000" },
      })
    );
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: COMPETITION_UUID,
        consent: async () => null,
      })
    ).rejects.toThrow("isn't taking entries right now");
  });

  it("refuses an entry that carries a poll", async () => {
    await expect(
      writeChainEntry(config, WALLET, {
        request: {
          ...request(),
          poll: { options: [] } as never,
        },
        competitionId: COMPETITION_UUID,
        consent: async () => null,
      })
    ).rejects.toThrow("poll");
    expect(identityByWallet).not.toHaveBeenCalled();
  });
});

describe("who may enter, read from the chain", () => {
  const GROUP: Hex = `0x${"9a".repeat(32)}`;
  const membershipPath = `/v1/groups/${GROUP}/members/${VOTER}`;
  const byAuthorPath = `/v1/entries/by-author/${VOTER}`;
  const reads = new Map<string, () => unknown>();

  const enter = (consent = jest.fn().mockResolvedValue(null)) =>
    writeChainEntry(config, WALLET, {
      request: request(),
      competitionId: COMPETITION_UUID,
      consent,
    });
  const entryRow = (overrides: Record<string, unknown>) => ({
    entryId: `0x${"e0".repeat(32)}`,
    decisionId: DECISION,
    author: VOTER,
    status: "active",
    ...overrides,
  });

  beforeEach(() => {
    reads.clear();
    gatewayGet.mockImplementation(async (path: string) => {
      const read = reads.get(path);
      if (read === undefined) {
        throw new Error(`unexpected read ${path}`);
      }
      return read();
    });
  });

  it("refuses an author outside the decision's submit group before any prompt", async () => {
    gateway.getDecision.mockResolvedValue(
      decision({ submitGroup: { groupId: GROUP, version: 0 } })
    );
    reads.set(membershipPath, () => ({
      groupId: GROUP,
      principalId: VOTER,
      member: false,
    }));
    const consent = jest.fn().mockResolvedValue(null);
    await expect(enter(consent)).rejects.toThrow(
      "You aren't in the group that can enter this decision."
    );
    expect(gatewayGet).toHaveBeenCalledWith(membershipPath, {
      signal: undefined,
      query: { at: "head", version: 0 },
      nullOn404: true,
    });
    expect(consent).not.toHaveBeenCalled();
    expect(uploadDoc).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it("enters for a member, and leaves the check to the chain when the gateway can't say", async () => {
    gateway.getDecision.mockResolvedValue(
      decision({ submitGroup: { groupId: GROUP, version: 3 } })
    );
    reads.set(membershipPath, () => ({
      groupId: GROUP,
      principalId: VOTER,
      member: true,
    }));
    await expect(enter()).resolves.toMatchObject({ txId: TX });

    reads.set(membershipPath, () => null);
    await expect(enter()).resolves.toMatchObject({ txId: TX });
    expect(run).toHaveBeenCalledTimes(2);
  });

  it.each([
    [503, "The TDH day isn't copied yet. Try again."],
    [500, "The gateway failed."],
    [0, "The 6529 Network gateway did not answer."],
  ])(
    "goes on to the prompt when the membership read answers %i",
    async (status, message) => {
      gateway.getDecision.mockResolvedValue(
        decision({ submitGroup: { groupId: GROUP, version: 0 } })
      );
      reads.set(membershipPath, () => {
        throw new ChainGatewayError(status, `http_${status}`, message);
      });
      const consent = jest.fn().mockResolvedValue(null);
      await expect(enter(consent)).resolves.toMatchObject({ txId: TX });
      expect(consent).toHaveBeenCalledTimes(1);
      expect(run).toHaveBeenCalledTimes(1);
    }
  );

  it("stops at a membership read the gateway refuses", async () => {
    gateway.getDecision.mockResolvedValue(
      decision({ submitGroup: { groupId: GROUP, version: 0 } })
    );
    reads.set(membershipPath, () => {
      throw new ChainGatewayError(400, "bad_request", "Bad version.");
    });
    const consent = jest.fn().mockResolvedValue(null);
    await expect(enter(consent)).rejects.toThrow("Bad version.");
    expect(consent).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it("stops when the entry is cancelled during the membership read", async () => {
    gateway.getDecision.mockResolvedValue(
      decision({ submitGroup: { groupId: GROUP, version: 0 } })
    );
    const cancel = new AbortController();
    reads.set(membershipPath, () => {
      cancel.abort();
      throw new ChainGatewayError(
        0,
        "network",
        "The 6529 Network gateway did not answer."
      );
    });
    const consent = jest.fn().mockResolvedValue(null);
    await expect(
      writeChainEntry(
        config,
        WALLET,
        { request: request(), competitionId: COMPETITION_UUID, consent },
        cancel.signal
      )
    ).rejects.toThrow("did not answer");
    expect(consent).not.toHaveBeenCalled();
  });

  it("reads no group when everyone may enter", async () => {
    gateway.getDecision.mockResolvedValue(
      decision({ submitGroup: { groupId: `0x${"00".repeat(32)}`, version: 0 } })
    );
    await expect(enter()).resolves.toMatchObject({ txId: TX });
    expect(gatewayGet).not.toHaveBeenCalled();
  });

  it("refuses a membership answer for someone else", async () => {
    gateway.getDecision.mockResolvedValue(
      decision({ submitGroup: { groupId: GROUP, version: 0 } })
    );
    reads.set(membershipPath, () => ({
      groupId: GROUP,
      principalId: OTHER,
      member: true,
    }));
    await expect(enter()).rejects.toThrow("answered for a different object");
    expect(run).not.toHaveBeenCalled();
  });

  it("refuses an author who has as many entries in the running as the decision allows", async () => {
    gateway.getDecision.mockResolvedValue(
      decision({
        config: {
          participationStart: "0",
          participationEnd: "0",
          maxEntriesPerAuthor: 2,
        },
      })
    );
    reads.set(byAuthorPath, () => [
      entryRow({}),
      entryRow({ decisionId: OTHER }),
      entryRow({ status: "withdrawn" }),
      entryRow({}),
    ]);
    const consent = jest.fn().mockResolvedValue(null);
    await expect(enter(consent)).rejects.toThrow(
      "You already have 2 entries in this decision, the most it allows."
    );
    expect(consent).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it("enters below the limit, counting only this decision's active entries", async () => {
    gateway.getDecision.mockResolvedValue(
      decision({
        config: {
          participationStart: "0",
          participationEnd: "0",
          maxEntriesPerAuthor: "2",
        },
      })
    );
    reads.set(byAuthorPath, () => [
      entryRow({}),
      entryRow({ decisionId: OTHER }),
      entryRow({ status: "winner" }),
    ]);
    await expect(enter()).resolves.toMatchObject({ txId: TX });
  });

  it.each([
    [404, "Not found."],
    [503, "The TDH day isn't copied yet. Try again."],
    [500, "The gateway failed."],
  ])(
    "goes on to the prompt when the author's entries read answers %i",
    async (status, message) => {
      gateway.getDecision.mockResolvedValue(
        decision({
          config: {
            participationStart: "0",
            participationEnd: "0",
            maxEntriesPerAuthor: 1,
          },
        })
      );
      reads.set(byAuthorPath, () => {
        throw new ChainGatewayError(status, `http_${status}`, message);
      });
      const consent = jest.fn().mockResolvedValue(null);
      await expect(enter(consent)).resolves.toMatchObject({ txId: TX });
      expect(consent).toHaveBeenCalledTimes(1);
      expect(run).toHaveBeenCalledTimes(1);
    }
  );

  it("stops at an author's entries read the gateway refuses", async () => {
    gateway.getDecision.mockResolvedValue(
      decision({
        config: {
          participationStart: "0",
          participationEnd: "0",
          maxEntriesPerAuthor: 1,
        },
      })
    );
    reads.set(byAuthorPath, () => {
      throw new ChainGatewayError(400, "bad_request", "Bad cursor.");
    });
    await expect(enter()).rejects.toThrow("Bad cursor.");
    expect(run).not.toHaveBeenCalled();
  });
});

describe("writeChainWithdrawal", () => {
  beforeEach(() => {
    gateway.getEntry.mockResolvedValue({
      entryId: ENTRY,
      decisionId: DECISION,
      author: VOTER.toUpperCase().replace("0X", "0x"),
      version: 2,
      status: "active",
    } as never);
    gateway.getDecision.mockResolvedValue(decision({ status: "ended" }));
  });

  it("has the wallet sign SUBMISSION_WITHDRAW with the entry's version", async () => {
    await writeChainWithdrawal(config, WALLET, { dropId: DROP_UUID });
    expect(gateway.getEntry).toHaveBeenCalledWith(ENTRY, undefined);
    expect(lastRequest()).toEqual({
      opType: "SUBMISSION_WITHDRAW",
      principal: VOTER,
      keyType: 1,
      signer: WALLET,
      body: { entryId: ENTRY, expectedVersion: 2 },
    });
    expect(sessionKey).not.toHaveBeenCalled();
    expect(run.mock.calls.at(-1)?.[4]).toBe("final");
  });

  it("names an entry made on the chain by its id", async () => {
    gateway.getEntry.mockResolvedValue({
      entryId: ENTRY,
      decisionId: DECISION,
      author: VOTER,
      version: 1,
      status: "active",
    } as never);
    await writeChainWithdrawal(config, WALLET, { dropId: ENTRY });
    expect(gateway.getEntry).toHaveBeenCalledWith(ENTRY, undefined);
    expect(lastRequest().body).toEqual({ entryId: ENTRY, expectedVersion: 1 });
  });

  it("refuses someone else's entry, one out of the running, and one being counted", async () => {
    gateway.getEntry.mockResolvedValueOnce({
      entryId: ENTRY,
      decisionId: DECISION,
      author: OTHER,
      version: 1,
      status: "active",
    } as never);
    await expect(
      writeChainWithdrawal(config, WALLET, { dropId: DROP_UUID })
    ).rejects.toThrow("Only the entry's author");

    gateway.getEntry.mockResolvedValueOnce({
      entryId: ENTRY,
      decisionId: DECISION,
      author: VOTER,
      version: 3,
      status: "winner",
    } as never);
    await expect(
      writeChainWithdrawal(config, WALLET, { dropId: DROP_UUID })
    ).rejects.toThrow("no longer in the running");

    gateway.getDecision.mockResolvedValueOnce(decision({ due: true }));
    await expect(
      writeChainWithdrawal(config, WALLET, { dropId: DROP_UUID })
    ).rejects.toThrow("counting its result");
    expect(run).not.toHaveBeenCalled();
  });
});

describe("the gateway's answers", () => {
  it("refuse a decision that isn't the competition's import", async () => {
    gateway.getDecision.mockResolvedValue(decision({ decisionId: OTHER }));
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: COMPETITION_UUID,
        consent: async () => null,
      })
    ).rejects.toThrow("answered for a different object");
    expect(uploadDoc).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it("refuse a decision of another wave", async () => {
    gateway.getDecision.mockResolvedValue(decision({ waveId: OTHER }));
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: COMPETITION_UUID,
        consent: async () => null,
      })
    ).rejects.toThrow("isn't in this wave");
    expect(run).not.toHaveBeenCalled();
  });

  it("refuse a fresh read of another decision", async () => {
    gateway.getDecision
      .mockResolvedValueOnce(decision())
      .mockResolvedValueOnce(decision({ decisionId: OTHER }));
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: COMPETITION_UUID,
        consent: async () => null,
      })
    ).rejects.toThrow("answered for a different object");
    expect(run).not.toHaveBeenCalled();
  });

  it("refuse a wave that isn't the 6529.io wave's import, and skip other waves' decisions", async () => {
    gateway.getWave.mockResolvedValueOnce({ waveId: OTHER } as never);
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: null,
        consent: async () => null,
      })
    ).rejects.toThrow("answered for a different object");

    gateway.getWave.mockResolvedValue({ waveId: WAVE } as never);
    entries.getWaveDecisions.mockResolvedValue([
      decision({ decisionId: OTHER, waveId: OTHER }),
    ] as never);
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: null,
        consent: async () => null,
      })
    ).rejects.toThrow("no decision taking entries");
    expect(run).not.toHaveBeenCalled();
  });

  it("refuse an entry that isn't the drop's import", async () => {
    gateway.getEntry.mockResolvedValue({
      entryId: OTHER,
      decisionId: DECISION,
      author: VOTER,
      version: 1,
      status: "active",
    } as never);
    await expect(
      writeChainWithdrawal(config, WALLET, { dropId: DROP_UUID })
    ).rejects.toThrow("answered for a different object");
    expect(run).not.toHaveBeenCalled();
  });
});

describe("a write's progress", () => {
  const signingRun = (outcome: () => unknown) =>
    run.mockImplementation(
      async (
        _request: unknown,
        _primaryType: string,
        signer: { sign: (draft: { txId: Hex }) => Promise<Hex> }
      ) => {
        await signer.sign({ txId: TX });
        return outcome();
      }
    );

  it("says it is preparing, then waits for the wallet only while its prompt is open", async () => {
    signingRun(() => ({ draft: { txId: TX } }));
    const stages: string[] = [];
    await writeChainEntry(config, WALLET, {
      request: request(),
      competitionId: COMPETITION_UUID,
      consent: async () => null,
      onStage: (stage) => stages.push(stage),
    });
    expect(stages).toEqual(["preparing", "wallet", "sending"]);
  });

  it("waits for the wallet during the consent's prompt, and prepares again after it", async () => {
    signingRun(() => ({ draft: { txId: TX } }));
    const stages: string[] = [];
    let duringPrompt: string | undefined;
    await writeChainEntry(config, WALLET, {
      request: request(),
      competitionId: COMPETITION_UUID,
      consent: (_fields, prompt) =>
        prompt(async () => {
          duringPrompt = stages.at(-1);
          return null;
        }),
      onStage: (stage) => stages.push(stage),
    });
    expect(duringPrompt).toBe("wallet");
    expect(stages).toEqual([
      "preparing",
      "wallet",
      "preparing",
      "wallet",
      "sending",
    ]);
  });

  it("sends nothing when the consent's prompt is declined", async () => {
    const stages: string[] = [];
    const declined = Object.assign(new Error("User rejected"), { code: 4001 });
    const error = await writeChainEntry(config, WALLET, {
      request: request(),
      competitionId: COMPETITION_UUID,
      consent: (_fields, prompt) =>
        prompt(() => Promise.reject(new Error("wrapped", { cause: declined }))),
      onStage: (stage) => stages.push(stage),
    }).catch((caught: unknown) => caught);
    expect(error).toBe(declined);
    expect(stages).not.toContain("sending");
    expect(uploadDoc).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it("reads a wait that ends after the signature as sent, not failed", async () => {
    signingRun(() => {
      throw new ChainOperationError("timeout", "not final");
    });
    const error = await writeChainEntry(config, WALLET, {
      request: request(),
      competitionId: COMPETITION_UUID,
      consent: async () => null,
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ChainEntryPendingError);
    expect((error as ChainEntryPendingError).message).toContain(
      "before you send it again"
    );
    expect((error as ChainEntryPendingError).receipt).toMatchObject({
      entryId: createdEntryId(TX),
      txId: TX,
      decisionId: DECISION,
    });
  });

  it("keeps a timeout before any signature a plain failure", async () => {
    run.mockRejectedValue(new ChainOperationError("timeout", "not final"));
    const error = await writeChainEntry(config, WALLET, {
      request: request(),
      competitionId: COMPETITION_UUID,
      consent: async () => null,
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ChainOperationError);
    expect(error).not.toBeInstanceOf(ChainEntryPendingError);
  });

  it("reads a withdrawal's late wait as sent", async () => {
    gateway.getEntry.mockResolvedValue({
      entryId: ENTRY,
      decisionId: DECISION,
      author: VOTER,
      version: 1,
      status: "active",
    } as never);
    signingRun(() => {
      throw new ChainOperationError("timeout", "not final");
    });
    const error = await writeChainWithdrawal(config, WALLET, {
      dropId: DROP_UUID,
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ChainEntryPendingError);
    expect((error as ChainEntryPendingError).receipt).toBeNull();
  });

  it("surfaces a declined wallet prompt inside a wrapper error", async () => {
    const declined = Object.assign(new Error("User rejected"), { code: 4001 });
    run.mockRejectedValue(
      Object.assign(new Error("Signing failed"), { cause: declined })
    );
    await expect(
      writeChainEntry(config, WALLET, {
        request: request(),
        competitionId: COMPETITION_UUID,
        consent: async () => null,
      })
    ).rejects.toBe(declined);

    const consentDeclined = Object.assign(new Error("Declined"), {
      code: 4001,
    });
    const error = await writeChainEntry(config, WALLET, {
      request: request(),
      competitionId: COMPETITION_UUID,
      consent: async () => {
        throw Object.assign(new Error("Wrapped"), { cause: consentDeclined });
      },
    }).catch((caught: unknown) => caught);
    expect(isUserRejectedSigningError(error)).toBe(true);
  });
});
