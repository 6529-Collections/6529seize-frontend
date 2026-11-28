import { BaseError, ContractFunctionRevertedError, encodeErrorResult, type Hex } from "viem";

import { packageRegistryAbi } from "@/lib/stream/abis";
import { CreateRunError } from "@/lib/stream/createErrors";
import { isRevert, nextMoveNonce, registerCuratedPackage, type CuratedWorkContext } from "@/lib/stream/curatedCreate";
import { StreamTxError } from "@/components/stream-sepolia/sendStreamTx";

const mockClient = { readContract: jest.fn(), simulateContract: jest.fn() };
jest.mock("@/lib/stream/client", () => ({
  getStreamClient: () => mockClient,
  getStreamLogClient: () => mockClient,
  STREAM_CHAIN: { id: 11_155_111 },
}));

const ROOT = `0x${"11".repeat(32)}` as Hex;
const ARTIST = "0x1e6078F7d688591823f77B0c1104D66aE1A442B5" as const;

function revert(errorName: "PackageExists" | "MoveNonceUsed", args: readonly unknown[]): BaseError {
  const data = encodeErrorResult({ abi: packageRegistryAbi, errorName, args } as never);
  const cause = new ContractFunctionRevertedError({ abi: packageRegistryAbi, data, functionName: "registerPackage" });
  return new BaseError("simulation reverted", { cause });
}

/** A run whose item and root are already built, so no file or gate read is needed. */
function preparedContext(): CuratedWorkContext {
  return {
    artist: ARTIST,
    media: {} as never,
    record: {} as never,
    collectionId: 1n,
    editionCap: null,
    item: {} as never,
    mediaList: [],
    itemHash: `0x${"22".repeat(32)}`,
    packageRoot: ROOT,
  };
}

function io() {
  return { account: ARTIST, send: jest.fn().mockResolvedValue({ logs: [] }) };
}

beforeEach(() => {
  mockClient.readContract.mockReset();
  mockClient.simulateContract.mockReset();
});

describe("isRevert", () => {
  it("sees a named simulation revert", () => {
    const error = revert("PackageExists", [ROOT]);
    expect(isRevert(error)).toBe(true);
    expect(isRevert(error, "PackageExists")).toBe(true);
    expect(isRevert(error, "MoveNonceUsed")).toBe(false);
  });
  it("is false for a failed send or a plain error", () => {
    expect(isRevert(new StreamTxError("failed", `0x${"33".repeat(32)}`))).toBe(false);
    expect(isRevert(new Error("network"))).toBe(false);
  });
});

describe("nextMoveNonce", () => {
  it("returns the first unused nonce", async () => {
    mockClient.readContract.mockImplementation(({ args }: { args: [bigint, bigint] }) => Promise.resolve(args[1] < 3n));
    await expect(nextMoveNonce(7n)).resolves.toBe(3n);
  });
  it("reads past the first batch", async () => {
    mockClient.readContract.mockImplementation(({ args }: { args: [bigint, bigint] }) => Promise.resolve(args[1] < 40n));
    await expect(nextMoveNonce(7n)).resolves.toBe(40n);
  });
});

describe("registerCuratedPackage", () => {
  function packageStatus(...statuses: number[]) {
    const queue = [...statuses];
    mockClient.readContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === "packageOf") return Promise.resolve([queue.shift() ?? 0, ROOT, ARTIST]);
      if (functionName === "attestationOf") return Promise.resolve([`0x${"44".repeat(32)}`, "0x"]);
      return Promise.reject(new Error(`unexpected read ${functionName}`));
    });
  }

  it("skips an approved package", async () => {
    packageStatus(1);
    const run = io();
    await expect(registerCuratedPackage(preparedContext(), run)).resolves.toBe(false);
    expect(run.send).not.toHaveBeenCalled();
  });

  it("reports a revoked package instead of skipping it", async () => {
    packageStatus(2);
    await expect(registerCuratedPackage(preparedContext(), io())).rejects.toMatchObject({ errorName: "packageRevoked" });
  });

  it("registers a new package", async () => {
    packageStatus(0);
    const run = io();
    await expect(registerCuratedPackage(preparedContext(), run)).resolves.toBe(true);
    expect(run.send).toHaveBeenCalledTimes(1);
  });

  it("treats a race lost to an approved registration as done", async () => {
    packageStatus(0, 1);
    const run = io();
    run.send.mockRejectedValue(revert("PackageExists", [ROOT]));
    await expect(registerCuratedPackage(preparedContext(), run)).resolves.toBe(false);
  });

  it("refuses another wallet", async () => {
    packageStatus(1);
    const other = { account: "0x625a35f75aB095D331b189B0DF59C46717fA1EA2" as const, send: jest.fn() };
    await expect(registerCuratedPackage(preparedContext(), other)).rejects.toBeInstanceOf(CreateRunError);
  });
});
