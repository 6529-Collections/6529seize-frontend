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
  submit.mockResolvedValue({
    ...f.operation,
    state: ApiMarketBatchOperationStateEnum.Submitted,
  });
  send.mockResolvedValue({
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
it("refreshes and simulates the complete exact transaction before one journaled wallet call", async () => {
  const f = setup();
  await confirmMarketBatch(f.options);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(f.client.call).toHaveBeenCalledWith(
    expect.objectContaining({
      data: f.operation.transaction!.data,
      value: 140n,
    })
  );
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
        transaction: { ...f.operation.transaction!, max_fee_per_gas: "9" },
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
      f.client.call.mockRejectedValue(new Error("one leg unavailable"));
      break;
    case "gas overflow":
      f.client.estimateGas.mockResolvedValue(600001n);
      break;
    case "fee cap":
      f.client.estimateFeesPerGas.mockResolvedValue({
        maxFeePerGas: 11n,
        maxPriorityFeePerGas: 1n,
      });
      break;
    case "connection changed":
      f.client.estimateGas.mockImplementation(async () => {
        f.options.assertConnection.mockImplementation(() => {
          throw new Error("MARKET_CONNECTION_CHANGED");
        });
        return 400000n;
      });
      break;
  }
  await confirmMarketBatch(f.options).catch(() => undefined);
  expect(send).not.toHaveBeenCalled();
  expect(f.wallet.sendTransaction).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
});
it("requires a new visible confirmation when a refreshed gas cap changes", async () => {
  const f = setup(),
    changed = {
      ...f.operation,
      transaction: { ...f.operation.transaction!, max_fee_per_gas: "9" },
    };
  refresh.mockResolvedValue(changed);
  expect(await confirmMarketBatch(f.options)).toBe("UPDATED_REVIEW");
  expect(f.options.onOperation).toHaveBeenCalledWith(changed);
  expect(send).not.toHaveBeenCalled();
});
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
    transaction: { ...f.operation.transaction!, max_fee_per_gas: "9" },
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
