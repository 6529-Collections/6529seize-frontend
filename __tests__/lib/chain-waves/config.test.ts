import {
  isChainWavesEnabled,
  isWavesWriteClosed,
} from "@/lib/chain-waves/config";
import {
  IDENTITY_SESSION_OPS,
  OP_POLL_BALLOT_SET,
  OP_RATING_SET,
  OP_VOTE_SET,
} from "@/lib/chain-identity/identityOps";
import { sessionKeyCanSign, sessionOpsFor } from "@/lib/chain-identity/session";
import { clearWavesFreeze } from "@/__tests__/helpers/wavesFreeze";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        ...(globalThis as { __wavesFreeze?: object }).__wavesFreeze,
        ...(globalThis as { __chainWaves?: object }).__chainWaves,
      };
    },
  };
});

const setChainWaves = (on: boolean) => {
  (globalThis as { __chainWaves?: object }).__chainWaves = on
    ? {
        NEXT_PUBLIC_FEATURE_CHAIN_WAVES: "true",
        NEXT_PUBLIC_CHAIN_GATEWAY_URL: "https://gateway.example.test",
        NEXT_PUBLIC_CHAIN_NETWORK_ID: `0x${"ab".repeat(32)}`,
      }
    : {};
};

afterEach(() => {
  clearWavesFreeze();
  setChainWaves(false);
});

describe("the chain flows for waves", () => {
  it("are off without the flag or a gateway", () => {
    expect(isChainWavesEnabled()).toBe(false);
    (globalThis as { __chainWaves?: object }).__chainWaves = {
      NEXT_PUBLIC_FEATURE_CHAIN_WAVES: "true",
    };
    expect(isChainWavesEnabled()).toBe(false);
    (globalThis as { __chainWaves?: object }).__chainWaves = {
      NEXT_PUBLIC_FEATURE_CHAIN_WAVES: "true",
      NEXT_PUBLIC_CHAIN_GATEWAY_URL: "https://gateway.example.test",
    };
    // No network id: drafts couldn't be checked against the network.
    expect(isChainWavesEnabled()).toBe(false);
    setChainWaves(true);
    expect(isChainWavesEnabled()).toBe(true);
  });

  it("open votes, ballots and wave REP after the switch-on, nothing else", () => {
    expect(isWavesWriteClosed("notice", "votes")).toBe(false);
    expect(isWavesWriteClosed("frozen", "votes")).toBe(true);
    expect(isWavesWriteClosed("moved", "votes")).toBe(true);

    setChainWaves(true);
    expect(isWavesWriteClosed("frozen", "votes")).toBe(true);
    expect(isWavesWriteClosed("moved", "votes")).toBe(false);
    expect(isWavesWriteClosed("moved", "polls")).toBe(false);
    expect(isWavesWriteClosed("moved", "waveRep")).toBe(false);
    expect(isWavesWriteClosed("moved")).toBe(true);
    expect(isWavesWriteClosed("none")).toBe(false);
  });
});

describe("the session key's operations", () => {
  it("add votes and ballots to the grant once the chain runs them", () => {
    expect(sessionOpsFor([0x0102, 0x0701])).toEqual(IDENTITY_SESSION_OPS);
    expect(sessionOpsFor([0x0102, 0x0606, 0x0608, 0x0701, 0x0604])).toEqual([
      0x0102, 0x0606, 0x0608, 0x0701,
    ]);
  });

  it("read a key kept before votes as the identity operations only", () => {
    const key = {
      principalId: "0x01",
      keyId: "0x02",
      publicKeyHex: "0x03",
      keyPair: {} as CryptoKeyPair,
      grantId: "0x04",
      expiresAtMs: 1,
    } as const;
    expect(sessionKeyCanSign(key, OP_RATING_SET)).toBe(true);
    expect(sessionKeyCanSign(key, OP_VOTE_SET)).toBe(false);
    expect(
      sessionKeyCanSign(
        { ...key, ops: [0x0102, OP_VOTE_SET, OP_POLL_BALLOT_SET, 0x0701] },
        OP_POLL_BALLOT_SET
      )
    ).toBe(true);
  });
});
