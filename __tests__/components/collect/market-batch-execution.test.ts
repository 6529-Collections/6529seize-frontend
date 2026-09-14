import {
  confirmMarketBatch,
  recoverMarketBatch,
} from "@/components/collect/market-batch-execution";
import * as api from "@/services/api/market-batch-api";
import { sendReviewedMarketBatch } from "@/components/collect/market-batch-send";
import {
  readMarketBatch,
  saveMarketBatch,
} from "@/components/collect/market-batch-storage";
import { batchFixture, PAYER, FREN, NOW } from "./market-batch.fixture";
import { createMarketSendAttempt } from "@/components/collect/market-send-attempt";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";
import type { PublicClient, WalletClient } from "viem";
import * as BatchCapabilities from "@/generated/models/ApiMarketBatchCapabilities";
import { findResumableMarketBatch } from "@/components/collect/market-batch-resume";
import { marketExecutionError } from "@/components/collect/market-execution-errors";
import { t } from "@/i18n/messages";
import {
  ApiMarketBatchSendAttemptStatusEnum,
  ApiMarketBatchSendAttemptPurposeEnum,
} from "@/generated/models/ApiMarketBatchSendAttempt";

const enabledCapability: BatchCapabilities.ApiMarketBatchCapabilities = {
  available: true,
  execution_policy:
    BatchCapabilities.ApiMarketBatchCapabilitiesExecutionPolicyEnum.AllOrRevert,
  currency:
    BatchCapabilities.ApiMarketBatchCapabilitiesCurrencyEnum
      ._0x0000000000000000000000000000000000000000,
  payer_type: BatchCapabilities.ApiMarketBatchCapabilitiesPayerTypeEnum.Eoa,
  max_orders:
    BatchCapabilities.ApiMarketBatchCapabilitiesMaxOrdersEnum.NUMBER_128,
  max_allocations:
    BatchCapabilities.ApiMarketBatchCapabilitiesMaxAllocationsEnum.NUMBER_256,
  max_calldata_bytes:
    BatchCapabilities.ApiMarketBatchCapabilitiesMaxCalldataBytesEnum
      .NUMBER_1048576,
  restricted_erc1155_max_order_quantity:
    BatchCapabilities
      .ApiMarketBatchCapabilitiesRestrictedErc1155MaxOrderQuantityEnum._1,
  requires_complete_simulation: true,
};

jest.mock("@/services/api/market-batch-api", () => ({
  fetchMarketBatchCapabilities: jest.fn(),
  fetchMarketBatch: jest.fn(),
  continueMarketBatch: jest.fn(),
  preflightMarketBatch: jest.fn(),
  beginMarketBatchAttempt: jest.fn(),
  rejectMarketBatchAttempt: jest.fn(),
  submitMarketBatchTransaction: jest.fn(),
}));
jest.mock("@/components/collect/market-batch-send", () => ({
  ...jest.requireActual("@/components/collect/market-batch-send"),
  sendReviewedMarketBatch: jest.fn(),
}));
jest.mock("@/components/collect/market-operation-lock", () => ({
  withMarketOperationLock: (_id: string, callback: () => Promise<unknown>) =>
    callback(),
}));
jest.mock("@/components/collect/market-batch-resume", () => ({
  marketBatchProfileLock: (profile: string) => `batch-profile:${profile}`,
  findResumableMarketBatch: jest.fn(),
}));
const send = jest.mocked(sendReviewedMarketBatch),
  fetch = jest.mocked(api.fetchMarketBatch),
  refresh = jest.mocked(api.continueMarketBatch),
  preflight = jest.mocked(api.preflightMarketBatch),
  capability = jest.mocked(api.fetchMarketBatchCapabilities),
  submit = jest.mocked(api.submitMarketBatchTransaction);
let serial = 0;
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.mocked(findResumableMarketBatch).mockResolvedValue(null);
  jest.spyOn(Date, "now").mockReturnValue(NOW);
});
afterEach(() => jest.restoreAllMocks());
function setup() {
  const f = batchFixture();
  f.operation.id = `execution-${++serial}`;
  const wallet = {
    getChainId: jest.fn().mockResolvedValue(1),
    getAddresses: jest.fn().mockResolvedValue([PAYER]),
    sendTransaction: jest.fn(),
  };
  const client = {
    getChainId: jest.fn().mockResolvedValue(1),
    getCode: jest.fn().mockResolvedValue("0x"),
    getBlock: jest.fn().mockImplementation(async () => ({
      number: BigInt(f.operation.block_number!),
      hash: f.operation.block_hash,
      timestamp: BigInt(f.operation.block_timestamp!),
      baseFeePerGas: 8n,
    })),
    call: jest.fn().mockResolvedValue({}),
    estimateGas: jest.fn().mockResolvedValue(400000n),
    estimateFeesPerGas: jest
      .fn()
      .mockResolvedValue({ maxFeePerGas: 9n, maxPriorityFeePerGas: 1n }),
    getTransaction: jest.fn(),
  };
  capability.mockResolvedValue(enabledCapability);
  fetch.mockResolvedValue(f.operation);
  refresh.mockResolvedValue(f.operation);
  preflight.mockReset().mockImplementation(async (id, body) => ({
    operation_id: id,
    revision: body.expected_revision,
    transaction_digest: body.transaction_digest,
    estimated_gas: "400000",
    block_number: f.operation.block_number!,
    block_hash: f.operation.block_hash!,
    block_timestamp: f.operation.block_timestamp!,
  }));
  submit.mockResolvedValue({
    ...f.operation,
    state: ApiMarketBatchOperationStateEnum.Submitted,
  });
  send.mockReset().mockResolvedValue({
    hash: `0x${"a".repeat(64)}`,
    attempt: createMarketSendAttempt(f.operation.transaction!, 12, "1"),
  });
  const options = {
    operation: f.operation,
    expected: f.request,
    profileWallets: [PAYER],
    wallet: wallet as unknown as WalletClient,
    client: client as unknown as PublicClient,
    assertConnection: jest.fn(),
    onOperation: jest.fn(),
  };
  return { ...f, wallet, client, options };
}
it("refreshes and preflights the complete exact transaction before one journaled wallet call", async () => {
  const f = setup();
  await confirmMarketBatch(f.options);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(preflight).toHaveBeenCalledWith(f.operation.id, {
    expected_revision: f.operation.revision,
    transaction_digest: createMarketSendAttempt(f.operation.transaction!, 12)
      .digest,
  });
  expect(f.client.call).not.toHaveBeenCalled();
  expect(f.client.estimateGas).not.toHaveBeenCalled();
  expect(send).toHaveBeenCalledTimes(1);
  expect(submit).toHaveBeenCalledTimes(1);
});
it.each(["execution_policy", "currency"] as const)(
  "rejects array-valued capability %s before preparing a wallet request",
  async (field) => {
    const f = setup();
    capability.mockResolvedValue(
      Object.assign({}, enabledCapability, {
        [field]: [enabledCapability[field]],
      })
    );
    await expect(confirmMarketBatch(f.options)).rejects.toThrow(
      "MARKET_ACTION_DISABLED"
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(f.client.call).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(f.wallet.sendTransaction).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  }
);
it.each(["kind", "execution_policy", "purpose"] as const)(
  "rejects array-valued operation %s before the send journal or wallet",
  async (field) => {
    const f = setup();
    if (field === "purpose")
      Object.assign(f.operation.transaction!, { purpose: ["FULFILL"] });
    else Object.assign(f.operation, { [field]: [f.operation[field]] });
    await expect(confirmMarketBatch(f.options)).rejects.toThrow(
      "MARKET_REVIEW_MISMATCH"
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(f.client.call).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(f.wallet.sendTransaction).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  }
);
it.each(["current", "refreshed"] as const)(
  "does not send when the %s operation state is an array instead of REVIEW",
  async (phase) => {
    const f = setup();
    const malformed = Object.assign({}, f.operation, { state: ["REVIEW"] });
    if (phase === "current") fetch.mockResolvedValue(malformed);
    else refresh.mockResolvedValue(malformed);
    await expect(confirmMarketBatch(f.options)).resolves.toBe("COMPLETE");
    expect(f.client.call).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(f.wallet.sendTransaction).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  }
);
it("never sends a second operation while an overlapping seller order has an unresolved purchase", async () => {
  const f = setup();
  jest.mocked(findResumableMarketBatch).mockResolvedValue({
    operation: {
      ...f.operation,
      id: "prior-purchase",
      state: ApiMarketBatchOperationStateEnum.Unknown,
    },
    request: f.request,
  });
  await expect(confirmMarketBatch(f.options)).rejects.toThrow(
    "MARKET_BROADCAST_UNKNOWN"
  );
  expect(send).not.toHaveBeenCalled();
  expect(f.client.call).not.toHaveBeenCalled();
  expect(jest.mocked(findResumableMarketBatch)).toHaveBeenCalledWith(
    f.request.profile_id,
    f.request.items,
    { excludeId: f.operation.id, includeReview: false }
  );
});
it.each([
  "disabled",
  "changed fee",
  "wrong chain",
  "wrong signer",
  "contract payer",
  "failed simulation",
  "gas overflow",
  "fee cap",
  "connection changed",
])("never requests a wallet when %s", async (condition) => {
  const f = setup();
  switch (condition) {
    case "disabled":
      capability.mockResolvedValue({ ...enabledCapability, available: false });
      break;
    case "changed fee":
      refresh.mockResolvedValue({
        ...f.operation,
        transaction: {
          ...f.operation.transaction!,
          gas_limit: "500000",
          max_fee_per_gas: "11",
        },
      });
      break;
    case "wrong chain":
      f.client.getChainId.mockResolvedValue(10);
      break;
    case "wrong signer":
      f.wallet.getAddresses.mockResolvedValue([FREN]);
      break;
    case "contract payer":
      f.client.getCode.mockResolvedValue("0x01");
      break;
    case "failed simulation":
      preflight.mockRejectedValue(new Error("one leg unavailable"));
      break;
    case "gas overflow":
      preflight.mockImplementation(async (id, body) => ({
        operation_id: id,
        revision: body.expected_revision,
        transaction_digest: body.transaction_digest,
        estimated_gas: "600001",
        block_number: 12,
        block_hash: f.operation.block_hash!,
        block_timestamp: NOW / 1000,
      }));
      break;
    case "fee cap":
      f.client.getBlock.mockResolvedValue({
        number: 12n,
        hash: f.operation.block_hash,
        timestamp: BigInt(NOW / 1000),
        baseFeePerGas: 10n,
      });
      break;
    case "connection changed":
      f.client.estimateFeesPerGas.mockImplementation(async () => {
        f.options.assertConnection.mockImplementation(() => {
          throw new Error("MARKET_CONNECTION_CHANGED");
        });
        return { maxFeePerGas: 9n, maxPriorityFeePerGas: 1n };
      });
      break;
  }
  await confirmMarketBatch(f.options).catch(() => undefined);
  expect(send).not.toHaveBeenCalled();
  expect(f.wallet.sendTransaction).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
});
it("continues when refreshed gas caps decrease", async () => {
  const f = setup(),
    changed = {
      ...f.operation,
      transaction: { ...f.operation.transaction!, max_fee_per_gas: "9" },
    };
  refresh.mockResolvedValue(changed);
  expect(await confirmMarketBatch(f.options)).toBe("COMPLETE");
  expect(f.options.onOperation).toHaveBeenCalledWith(changed);
  expect(send).toHaveBeenCalledTimes(1);
});

it("opens the wallet once with retained caps despite a higher padded RPC fee suggestion", async () => {
  const f = setup();
  const hash = `0x${"b".repeat(64)}` as const;
  const onReviewChange = jest.fn();
  f.wallet.sendTransaction.mockResolvedValue(hash);
  f.client.estimateFeesPerGas.mockResolvedValue({
    maxFeePerGas: 20n,
    maxPriorityFeePerGas: 1n,
  });
  refresh.mockResolvedValue({ ...f.operation, revision: "fresh-revision" });
  send.mockImplementationOnce(async (options) => ({
    hash: await options.send(),
    attempt: createMarketSendAttempt(
      options.operation.transaction!,
      12,
      "fresh-revision"
    ),
  }));
  await expect(
    confirmMarketBatch({ ...f.options, onReviewChange })
  ).resolves.toBe("COMPLETE");
  expect(onReviewChange).not.toHaveBeenCalled();
  expect(f.wallet.sendTransaction).toHaveBeenCalledTimes(1);
  expect(f.wallet.sendTransaction).toHaveBeenCalledWith(
    expect.objectContaining({
      gas: 600000n,
      maxFeePerGas: 10n,
      maxPriorityFeePerGas: 1n,
      data: f.operation.transaction!.data,
    })
  );
});

it("arms and sends once without the oversized public RPC calls that return HTTP 403", async () => {
  const f = setup();
  // Synthetic signature bytes reproduce the oversized transport shape.
  f.orders[0]!.signature = `0x${"11".repeat(9000)}`;
  f.reencode();
  expect(f.operation.transaction!.data.length).toBeGreaterThan(16_384);
  f.client.call.mockRejectedValue(new Error("HTTP 403"));
  f.client.estimateGas.mockRejectedValue(new Error("HTTP 403"));
  const hash = `0x${"d".repeat(64)}` as const;
  f.wallet.sendTransaction.mockResolvedValue(hash);
  jest
    .mocked(api.beginMarketBatchAttempt)
    .mockImplementation(async (_id, body) => ({
      ...f.operation,
      send_attempt: {
        attempt_id: body.attempt_id,
        purpose: ApiMarketBatchSendAttemptPurposeEnum.Transaction,
        status: ApiMarketBatchSendAttemptStatusEnum.Active,
        transaction_digest: body.transaction_digest,
        snapshot_block: 12,
        transaction: f.operation.transaction!,
        transaction_hash: null,
      },
    }));
  send.mockImplementationOnce(
    jest.requireActual<typeof import("@/components/collect/market-batch-send")>(
      "@/components/collect/market-batch-send"
    ).sendReviewedMarketBatch
  );
  await expect(confirmMarketBatch(f.options)).resolves.toBe("COMPLETE");
  expect(preflight).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(preflight.mock.calls[0]?.[1]).length).toBeLessThan(256);
  expect(api.beginMarketBatchAttempt).toHaveBeenCalledTimes(1);
  expect(f.wallet.sendTransaction).toHaveBeenCalledTimes(1);
  expect(f.wallet.sendTransaction).toHaveBeenCalledWith(
    expect.objectContaining({
      data: f.operation.transaction!.data,
      value: 140n,
      gas: 600000n,
      maxFeePerGas: 10n,
      maxPriorityFeePerGas: 1n,
    })
  );
  expect(readMarketBatch("profile", f.operation.id)?.transactionHash).toBe(
    hash
  );
  expect(f.client.call).not.toHaveBeenCalled();
  expect(f.client.estimateGas).not.toHaveBeenCalled();
});

it.each(["getCode", "getBlock", "estimateFeesPerGas"] as const)(
  "reports a %s RPC failure as a preflight error without requesting any transaction",
  async (method) => {
    const f = setup();
    f.client[method].mockRejectedValueOnce(new Error("private RPC failure"));
    let failure: unknown;
    try {
      await confirmMarketBatch(f.options);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect(marketExecutionError(failure, "en-US")).toBe(
      t("en-US", "collect.trade.preflightFailed")
    );
    expect(send).not.toHaveBeenCalled();
    expect(f.wallet.sendTransaction).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  }
);

it.each([
  ["operation", { operation_id: "other" }],
  ["revision", { revision: "other" }],
  ["digest", { transaction_digest: "0".repeat(64) }],
  ["snapshot hash", { block_hash: `0x${"b".repeat(64)}` }],
  ["snapshot time", { block_timestamp: NOW / 1000 + 1 }],
  ["old snapshot", { block_number: 11 }],
  ["fractional snapshot", { block_number: 12.5 }],
  ["invalid gas", { estimated_gas: "400000junk" }],
  ["numeric gas", { estimated_gas: 400000 }],
  ["unbounded gas", { estimated_gas: "9".repeat(79) }],
] as const)(
  "rejects a mismatched preflight %s before arming or requesting the wallet",
  async (_label, changes) => {
    const f = setup();
    const original = preflight.getMockImplementation()!;
    preflight.mockImplementation(async (id, body) =>
      Object.assign(await original(id, body), changes)
    );
    await expect(confirmMarketBatch(f.options)).rejects.toThrow(
      "MARKET_REVIEW_MISMATCH"
    );
    expect(send).not.toHaveBeenCalled();
    expect(api.beginMarketBatchAttempt).not.toHaveBeenCalled();
    expect(f.wallet.sendTransaction).not.toHaveBeenCalled();
  }
);

it.each(["block_number", "block_timestamp"] as const)(
  "rejects a review missing %s instead of treating it as an unbounded snapshot",
  async (field) => {
    const f = setup();
    preflight.mockResolvedValue({
      operation_id: f.operation.id,
      revision: f.operation.revision,
      transaction_digest: createMarketSendAttempt(f.operation.transaction!, 12)
        .digest,
      estimated_gas: "400000",
      block_number: 12,
      block_hash: f.operation.block_hash!,
      block_timestamp: NOW / 1000,
    });
    delete f.operation[field];
    await expect(confirmMarketBatch(f.options)).rejects.toThrow(
      "MARKET_REVIEW_MISMATCH"
    );
    expect(preflight).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
    expect(api.beginMarketBatchAttempt).not.toHaveBeenCalled();
    expect(f.wallet.sendTransaction).not.toHaveBeenCalled();
  }
);

it.each([-121, 121])(
  "rejects a simulation snapshot differing from the independently read chain by %s seconds",
  async (difference) => {
    const f = setup();
    f.client.getBlock.mockImplementation(
      async (request: { blockTag?: string }) => ({
        number: 12n,
        hash: f.operation.block_hash,
        timestamp: BigInt(
          NOW / 1000 + (request.blockTag === "latest" ? difference : 0)
        ),
        baseFeePerGas: 8n,
      })
    );
    await expect(confirmMarketBatch(f.options)).rejects.toThrow(
      "MARKET_REVIEW_MISMATCH"
    );
    expect(send).not.toHaveBeenCalled();
    expect(api.beginMarketBatchAttempt).not.toHaveBeenCalled();
    expect(f.wallet.sendTransaction).not.toHaveBeenCalled();
  }
);

it.each([-120, -12, 12, 120])(
  "allows a bounded %s-second provider timestamp difference",
  async (difference) => {
    const f = setup();
    f.client.getBlock.mockImplementation(
      async (request: { blockTag?: string }) => ({
        number: 12n,
        hash: f.operation.block_hash,
        timestamp: BigInt(
          NOW / 1000 + (request.blockTag === "latest" ? difference : 0)
        ),
        baseFeePerGas: 8n,
      })
    );
    f.wallet.sendTransaction.mockResolvedValue(`0x${"e".repeat(64)}`);
    send.mockImplementationOnce(async (options) => ({
      hash: await options.send(),
      attempt: createMarketSendAttempt(options.operation.transaction!, 12),
    }));
    await expect(confirmMarketBatch(f.options)).resolves.toBe("COMPLETE");
    expect(send).toHaveBeenCalledTimes(1);
    expect(f.wallet.sendTransaction).toHaveBeenCalledTimes(1);
  }
);

it.each(["lost API response", "wallet changed", "review expired"])(
  "does not arm or send after preflight when %s",
  async (condition) => {
    const f = setup();
    const original = preflight.getMockImplementation()!;
    preflight.mockImplementation(async (id, body) => {
      if (condition === "lost API response")
        throw new Error("Network request failed");
      if (condition === "wallet changed")
        f.options.assertConnection.mockImplementation(() => {
          throw new Error("MARKET_CONNECTION_CHANGED");
        });
      if (condition === "review expired")
        jest.spyOn(Date, "now").mockReturnValue(NOW + 61_000);
      return original(id, body);
    });
    await expect(confirmMarketBatch(f.options)).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
    expect(api.beginMarketBatchAttempt).not.toHaveBeenCalled();
    expect(f.wallet.sendTransaction).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    expect(
      readMarketBatch("profile", f.operation.id)?.sendAttempt
    ).toBeUndefined();
  }
);

it("retries only the known transaction acknowledgement after an earlier submission failed", async () => {
  const f = setup();
  const hash = `0x${"c".repeat(64)}` as const;
  f.wallet.sendTransaction.mockResolvedValue(hash);
  send.mockImplementationOnce(async (options) => {
    const attempt = {
      ...createMarketSendAttempt(options.operation.transaction!, 12, "1"),
      walletRequested: true,
    };
    const sentHash = await options.send();
    saveMarketBatch(f.request.profile_id, f.operation.id, {
      request: f.request,
      sendAttempt: attempt,
      transactionHash: sentHash,
    });
    return { hash: sentHash, attempt };
  });
  submit
    .mockRejectedValueOnce(new Error("unavailable"))
    .mockRejectedValueOnce(new Error("unavailable"));
  await expect(confirmMarketBatch(f.options)).rejects.toThrow(
    "MARKET_SUBMISSION_PENDING"
  );
  f.client.getTransaction.mockResolvedValue({
    hash,
    chainId: 1,
    from: PAYER,
    to: f.operation.transaction!.to,
    input: f.operation.transaction!.data,
    value: 140n,
    blockNumber: 13n,
  });
  await expect(confirmMarketBatch(f.options)).resolves.toBe("COMPLETE");
  expect(f.wallet.sendTransaction).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledTimes(1);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(preflight).toHaveBeenCalledTimes(1);
  expect(submit).toHaveBeenCalledTimes(3);
  expect(
    submit.mock.calls.every(([, body]) => body.transaction_hash === hash)
  ).toBe(true);
});

it.each([false, true])(
  "never sends again when a known hash acknowledgement fails (persistent=%s)",
  async (persistent) => {
    const f = setup();
    const onStage = jest.fn(),
      onKnownHash = jest.fn();
    if (persistent)
      submit.mockRejectedValue(new Error("acknowledgement unavailable"));
    else submit.mockRejectedValueOnce(new Error("acknowledgement unavailable"));
    const confirming = confirmMarketBatch({
      ...f.options,
      onStage,
      onKnownHash,
    });
    if (persistent)
      await expect(confirming).rejects.toThrow("MARKET_SUBMISSION_PENDING");
    else await expect(confirming).resolves.toBe("COMPLETE");
    expect(send).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledTimes(2);
    expect(submit.mock.calls[0]).toEqual(submit.mock.calls[1]);
    expect(onKnownHash).toHaveBeenCalledWith(`0x${"a".repeat(64)}`);
    expect(onStage.mock.calls.map(([stage]) => stage)).toEqual([
      "submitted",
      "reconciling",
    ]);
  }
);
it.each([0, NOW - 1])(
  "refreshes the stored review deadline %s before one exact wallet request",
  async (deadline) => {
    const f = setup();
    const shown = { ...f.operation, expires_at: deadline };
    f.options.operation = shown;
    fetch.mockResolvedValue({ ...shown, revision: "2" });
    refresh.mockResolvedValue({ ...f.operation, revision: "3" });
    await expect(confirmMarketBatch(f.options)).resolves.toBe("COMPLETE");
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: expect.objectContaining({
          revision: "3",
          expires_at: f.operation.expires_at,
        }),
      })
    );
  }
);
it("refreshes an expired mirror window while retaining every approved economic term", async () => {
  const f = setup();
  const shown = {
    ...f.operation,
    transaction: { ...f.operation.transaction! },
    mirror_terms: { ...f.operation.mirror_terms! },
  };
  f.options.operation = shown;
  fetch.mockResolvedValue(shown);
  jest.spyOn(Date, "now").mockReturnValue(NOW + 61_000);
  f.operation.expires_at = NOW + 120_000;
  f.operation.mirror_terms!.end_time = String(NOW / 1000 + 120);
  f.orders[2]!.parameters.endTime = BigInt(NOW / 1000 + 120);
  f.reencode();
  await expect(confirmMarketBatch(f.options)).resolves.toBe("COMPLETE");
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0]?.[0].operation.transaction?.data).toBe(
    f.operation.transaction!.data
  );
});
it("compares refreshed economics against the shown review even when the GET has the same revision", async () => {
  const f = setup();
  const changed = {
    ...f.operation,
    transaction: {
      ...f.operation.transaction!,
      gas_limit: "500000",
      max_fee_per_gas: "11",
    },
  };
  fetch.mockResolvedValue(changed);
  refresh.mockResolvedValue(changed);
  await expect(confirmMarketBatch(f.options)).resolves.toBe("UPDATED_REVIEW");
  expect(f.options.onOperation).toHaveBeenCalledWith(changed);
  expect(send).not.toHaveBeenCalled();
});
it("rejects altered historical calldata before requesting a refresh", async () => {
  const f = setup();
  f.options.operation = {
    ...f.operation,
    expires_at: 0,
    transaction: { ...f.operation.transaction!, data: "0x" },
  };
  await expect(confirmMarketBatch(f.options)).rejects.toThrow();
  expect(refresh).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});
it("never sends a fresh continuation that still has an expired review", async () => {
  const f = setup();
  refresh.mockResolvedValue({ ...f.operation, expires_at: 0 });
  await expect(confirmMarketBatch(f.options)).rejects.toThrow(
    "MARKET_REVIEW_MISMATCH"
  );
  expect(send).not.toHaveBeenCalled();
  expect(f.client.call).not.toHaveBeenCalled();
});
it("checks the current actor again after continuation before publishing or simulating the review", async () => {
  const f = setup();
  refresh.mockImplementation(async () => {
    f.options.assertConnection.mockImplementation(() => {
      throw new Error("MARKET_CONNECTION_CHANGED");
    });
    return f.operation;
  });
  await expect(confirmMarketBatch(f.options)).rejects.toThrow(
    "MARKET_CONNECTION_CHANGED"
  );
  expect(f.options.onOperation).not.toHaveBeenCalled();
  expect(f.client.call).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});
it("never refreshes or resends when a local unresolved wallet request exists", async () => {
  const f = setup();
  f.operation.expires_at = 0;
  saveMarketBatch("profile", f.operation.id, {
    request: f.request,
    sendAttempt: {
      ...createMarketSendAttempt(f.operation.transaction!, 12, "1"),
      walletRequested: true,
    },
  });
  await expect(confirmMarketBatch(f.options)).rejects.toThrow(
    "MARKET_BROADCAST_UNKNOWN"
  );
  expect(refresh).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});
it("rejects substituted recovered transactions without resending", async () => {
  const f = setup(),
    hash = `0x${"a".repeat(64)}`;
  const attempt = {
    ...createMarketSendAttempt(f.operation.transaction!, 12, "1"),
    walletRequested: true,
  };
  saveMarketBatch("profile", f.operation.id, {
    request: f.request,
    sendAttempt: attempt,
  });
  f.client.getTransaction.mockResolvedValue({
    hash,
    chainId: 1,
    from: PAYER,
    to: FREN,
    input: f.operation.transaction!.data,
    value: 140n,
    blockNumber: 13n,
  });
  await expect(
    recoverMarketBatch({
      client: f.options.client,
      operation: f.operation,
      hash,
      assertConnection: f.options.assertConnection,
      onOperation: f.options.onOperation,
    })
  ).rejects.toThrow("MARKET_REVIEW_MISMATCH");
  expect(send).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
  expect(readMarketBatch("profile", f.operation.id)?.sendAttempt).toBeDefined();
});
