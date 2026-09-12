import { act, renderHook, waitFor } from "@testing-library/react";
import { useMarketExecution } from "@/components/collect/useMarketExecution";
import {
  ApiMarketOperationStateEnum,
  type ApiMarketOperation,
} from "@/generated/models/ApiMarketOperation";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import type { ApiMarketSendAttemptRequest } from "@/generated/models/ApiMarketSendAttemptRequest";
import { createMarketSendAttempt } from "@/components/collect/market-send-attempt";

const walletAddress = "0x1111111111111111111111111111111111111111";
const hash = `0x${"a".repeat(64)}`;
const mockWallet = {
  getChainId: jest.fn(),
  getAddresses: jest.fn(),
  signTypedData: jest.fn(),
  sendTransaction: jest.fn(),
};
const mockClient = {
  getChainId: jest.fn(),
  getTransaction: jest.fn(),
  getCode: jest.fn(),
  call: jest.fn(),
  estimateGas: jest.fn(),
  estimateFeesPerGas: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
};
const mockCapabilities = jest.fn();
const mockFetch = jest.fn();
const mockSignature = jest.fn();
const mockSubmission = jest.fn();
const mockContinue = jest.fn();
const mockBegin = jest.fn();
const mockReject = jest.fn();
const mockRead = jest.fn();
const mockValidate = jest.fn();
const mockValidateForRefresh = jest.fn();
const mockSave = jest.fn();
const mockLock = jest.fn();
const mockAuth = {
  isAuthenticated: true,
  activeProfileProxy: null as object | null,
  connectedProfile: { id: "profile-one" },
};
const mockConnection = {
  canSignActiveWallet: true,
  isSafeWallet: false,
  address: walletAddress,
};
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockConnection,
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("wagmi", () => ({
  useWalletClient: () => ({ data: mockWallet }),
  usePublicClient: () => mockClient,
}));
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectCapabilities: (...args: unknown[]) => mockCapabilities(...args),
}));
jest.mock("@/services/api/market-api", () => ({
  beginMarketTransactionAttempt: (...args: unknown[]) => mockBegin(...args),
  rejectMarketTransactionAttempt: (...args: unknown[]) => mockReject(...args),
  fetchMarketOperation: (...args: unknown[]) => mockFetch(...args),
  continueMarketOperation: (...args: unknown[]) => mockContinue(...args),
  submitMarketSignature: (...args: unknown[]) => mockSignature(...args),
  submitMarketTransaction: (...args: unknown[]) => mockSubmission(...args),
}));
jest.mock("@/components/collect/market-operation-storage", () => ({
  readMarketIntent: (...args: unknown[]) => mockRead(...args),
  saveMarketIntent: (...args: unknown[]) => mockSave(...args),
}));
jest.mock("@/components/collect/market-operation-lock", () => ({
  withMarketOperationLock: (...args: unknown[]) => mockLock(...args),
}));
jest.mock("@/components/collect/market-validation", () => ({
  validateMarketOperation: (...args: unknown[]) => mockValidate(...args),
  validateMarketOperationForRefresh: (...args: unknown[]) =>
    mockValidateForRefresh(...args),
  validateMarketTransaction: jest.fn(),
  marketTypedData: () => ({
    domain: { chainId: 1 },
    types: {},
    primaryType: "OrderComponents",
    message: {},
  }),
}));

const expected = {
  profile_id: "profile-one",
  wallet: walletAddress,
  kind: "LIST",
} as ApiMarketPrepareRequest;
const operation: ApiMarketOperation = {
  id: "operation-1",
  profile_id: "profile-one",
  revision: "revision-1",
  state: ApiMarketOperationStateEnum.AwaitingSignature,
  kind: ApiMarketKind.List,
  wallet: walletAddress,
  recipient: walletAddress,
  recipient_in_profile: true,
  asset_key: "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:1",
  quantity: "1",
  currency: "0x0000000000000000000000000000000000000000",
  total_wei: "1000",
  net_wei: "1000",
  fees: [],
  approval_transactions: [],
  order: {
    protocol_address: "0x0000000000000068f116a894984e2db1123eb395",
    order_hash: hash,
    digest: hash,
    components: {
      offerer: walletAddress,
      zone: "0x0000000000000000000000000000000000000000",
      offer: [],
      consideration: [],
      order_type: 0,
      start_time: "1",
      end_time: "2",
      zone_hash: `0x${"0".repeat(64)}`,
      salt: "0",
      conduit_key: `0x${"0".repeat(64)}`,
      counter: "0",
    },
  },
  expires_at: Date.now() + 600_000,
  updated_at: 1,
  potential_liability_wei: "0",
};
let persisted: Record<string, unknown> | null = null;

function offerSignature() {
  const offerExpected = {
    ...expected,
    kind: ApiMarketKind.Offer,
  } as ApiMarketPrepareRequest;
  const offerOperation = {
    ...operation,
    kind: ApiMarketKind.Offer,
  } as ApiMarketOperation;
  mockCapabilities.mockResolvedValue({
    actions: [{ action: "OFFER", enabled: true }],
  });
  mockFetch.mockResolvedValue(offerOperation);
  mockSignature.mockResolvedValue({
    ...offerOperation,
    state: ApiMarketOperationStateEnum.Live,
  });
  return { offerExpected, offerOperation };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.isAuthenticated = true;
  mockAuth.activeProfileProxy = null;
  mockAuth.connectedProfile.id = "profile-one";
  mockConnection.canSignActiveWallet = true;
  mockConnection.isSafeWallet = false;
  mockConnection.address = walletAddress;
  mockCapabilities.mockResolvedValue({
    actions: [{ action: "LIST", enabled: true }],
  });
  mockFetch.mockResolvedValue(operation);
  persisted = null;
  mockRead.mockImplementation(() => persisted);
  mockSave.mockImplementation(
    (_profile: string, _id: string, value: Record<string, unknown>) => {
      persisted = value;
      return true;
    }
  );
  mockLock.mockImplementation((_id: string, execute: () => Promise<void>) =>
    execute()
  );
  mockValidate.mockImplementation(() => undefined);
  mockValidateForRefresh.mockImplementation(() => undefined);
  mockWallet.getChainId.mockResolvedValue(1);
  mockWallet.getAddresses.mockResolvedValue([walletAddress]);
  mockWallet.signTypedData.mockResolvedValue("0x1234");
  mockClient.getCode.mockResolvedValue("0x");
  mockClient.getChainId.mockResolvedValue(1);
  mockSignature.mockResolvedValue({ ...operation, state: "LIVE" });
  mockClient.call.mockResolvedValue({});
  mockClient.estimateGas.mockResolvedValue(80n);
  mockClient.estimateFeesPerGas.mockResolvedValue({
    maxFeePerGas: 2n,
    maxPriorityFeePerGas: 1n,
  });
  mockWallet.sendTransaction.mockResolvedValue(hash);
  mockReject.mockReset();
});

it("requires durable recovery storage before opening the wallet", async () => {
  mockSave.mockReturnValue(false);
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});
it("blocks a second tab before opening the wallet", async () => {
  mockLock.mockRejectedValue(new Error("LOCKED"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("continues an already-approved order into wallet signing when its reviewed terms are unchanged", async () => {
  const review = { ...operation, state: "REVIEW" } as ApiMarketOperation;
  mockFetch.mockResolvedValue(review);
  mockContinue.mockResolvedValue(operation);
  const onOperation = jest.fn();
  const { result } = renderHook(() => useMarketExecution(onOperation));
  await act(() => result.current.confirm(review, expected));
  expect(mockContinue).toHaveBeenCalledWith(operation.id);
  expect(onOperation).toHaveBeenCalledWith(operation);
  expect(mockWallet.signTypedData).toHaveBeenCalledTimes(1);
});
it.each([
  ApiMarketOperationStateEnum.Review,
  ApiMarketOperationStateEnum.AwaitingSignature,
])(
  "compares fresh %s signing terms against the displayed review, even when GET keeps the revision",
  async (state) => {
    const reviewed = { ...operation, state };
    const changed = {
      ...operation,
      order: { ...operation.order!, digest: `0x${"b".repeat(64)}` },
    };
    mockFetch.mockResolvedValue({ ...changed, state });
    mockContinue.mockResolvedValue(changed);
    const onOperation = jest.fn();
    const { result } = renderHook(() => useMarketExecution(onOperation));
    await act(() => result.current.confirm(reviewed, expected));
    expect(onOperation).toHaveBeenCalledWith(changed);
    expect(result.current.message).toBe(
      "Terms changed. Review the updated details before continuing."
    );
    expect(mockWallet.signTypedData).not.toHaveBeenCalled();
    expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  }
);
it("requires review of changed same-revision approval gas before opening the wallet", async () => {
  const { buyOperation } = buyReview();
  const reviewed = {
    ...operation,
    state: ApiMarketOperationStateEnum.Approval,
    approval_transactions: [buyOperation.transaction!],
  };
  const changed = {
    ...reviewed,
    approval_transactions: [
      {
        ...buyOperation.transaction!,
        gas_limit: "200",
        gas_reserve_wei: "400",
      },
    ],
  };
  mockCapabilities.mockResolvedValue({
    actions: [{ action: "LIST", enabled: true }],
  });
  mockFetch.mockResolvedValue(changed);
  const onOperation = jest.fn();
  const { result } = renderHook(() => useMarketExecution(onOperation));
  await act(() => result.current.confirm(reviewed, expected));
  expect(onOperation).toHaveBeenCalledWith(changed);
  expect(mockBegin).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("clears a mined reverted legacy approval without advancing the operation", async () => {
  mockRead.mockReturnValue({ request: expected, approvalHash: hash });
  mockClient.waitForTransactionReceipt.mockResolvedValue({
    status: "reverted",
  });
  mockContinue.mockResolvedValue(operation);
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockSave).toHaveBeenCalledWith(expected.profile_id, operation.id, {
    request: expected,
  });
  expect(mockContinue).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it.each(["revision-1", "revision-2"])(
  "continues a successful legacy approval at %s without requesting another wallet transaction",
  async (revision) => {
    const current = { ...operation, revision };
    mockFetch.mockResolvedValue(current);
    mockRead.mockReturnValue({ request: expected, approvalHash: hash });
    mockClient.waitForTransactionReceipt.mockResolvedValue({
      status: "success",
    });
    mockContinue.mockResolvedValue(current);
    const onOperation = jest.fn();
    const { result } = renderHook(() => useMarketExecution(onOperation));
    await act(() => result.current.confirm(operation, expected));
    expect(mockContinue).toHaveBeenCalledWith(operation.id);
    expect(onOperation).toHaveBeenCalledWith(current);
    expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
    expect(mockWallet.signTypedData).not.toHaveBeenCalled();
  }
);
it("retains a legacy approval hash when its receipt is unavailable", async () => {
  mockRead.mockReturnValue({ request: expected, approvalHash: hash });
  mockClient.waitForTransactionReceipt.mockRejectedValue(
    new Error("RPC unavailable")
  );
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockSave).not.toHaveBeenCalled();
  expect(mockContinue).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});

it("never opens a wallet prompt when the server capability is disabled", async () => {
  mockCapabilities.mockResolvedValue({
    actions: [{ action: "LIST", enabled: false }],
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});
it("signs a newer metadata revision only after validating the unchanged displayed terms", async () => {
  const changed = { ...operation, revision: "revision-2" };
  mockFetch.mockResolvedValue(changed);
  const onOperation = jest.fn();
  const { result } = renderHook(() => useMarketExecution(onOperation));
  await act(() => result.current.confirm(operation, expected));
  expect(mockValidate).toHaveBeenCalledWith(changed, expected);
  expect(mockWallet.signTypedData).toHaveBeenCalledTimes(1);
  expect(result.current.message).toBeUndefined();
});
it("never signs in profile proxy mode", async () => {
  mockAuth.activeProfileProxy = {};
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockCapabilities).not.toHaveBeenCalled();
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("rejects contract-wallet execution before requesting a signature", async () => {
  mockClient.getCode.mockResolvedValue("0x1234");
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("rejects another chain before requesting a signature", async () => {
  mockWallet.getChainId.mockResolvedValue(8453);
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("checks the payload before the wallet is invoked", async () => {
  mockValidate.mockImplementation(() => {
    throw new Error("MISMATCH");
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("publishes only the exact signature returned for the reviewed operation", async () => {
  const assertIntent = jest.fn();
  const onCommitment = jest.fn();
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() =>
    result.current.confirm(operation, expected, assertIntent, onCommitment)
  );
  expect(mockSignature).toHaveBeenCalledWith("operation-1", {
    signature: "0x1234",
  });
  expect(mockWallet.signTypedData).toHaveBeenCalledTimes(1);
  expect(assertIntent).toHaveBeenCalled();
  expect(onCommitment).not.toHaveBeenCalled();
});
it("records an offer commitment after validation and before signature publication", async () => {
  const { offerExpected, offerOperation } = offerSignature();
  const onCommitment = jest.fn();
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() =>
    result.current.confirm(
      offerOperation,
      offerExpected,
      undefined,
      onCommitment
    )
  );
  expect(onCommitment).toHaveBeenCalledWith(offerOperation, offerExpected);
  expect(onCommitment).toHaveBeenCalledTimes(1);
  const validations = mockValidate.mock.invocationCallOrder;
  const signOrder = mockWallet.signTypedData.mock.invocationCallOrder[0];
  const validationOrder = validations[validations.length - 1];
  const commitmentOrder = onCommitment.mock.invocationCallOrder[0];
  const publicationOrder = mockSignature.mock.invocationCallOrder[0];
  if (
    signOrder === undefined ||
    validationOrder === undefined ||
    commitmentOrder === undefined ||
    publicationOrder === undefined
  )
    throw new Error("Expected the offer publication sequence");
  expect(signOrder).toBeLessThan(validationOrder);
  expect(validationOrder).toBeLessThan(commitmentOrder);
  expect(commitmentOrder).toBeLessThan(publicationOrder);
});
it("does not publish an offer signature when commitment recording fails", async () => {
  const { offerExpected, offerOperation } = offerSignature();
  const onCommitment = jest.fn(() => {
    throw new Error("COMMITMENT_STORAGE_UNAVAILABLE");
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() =>
    result.current.confirm(
      offerOperation,
      offerExpected,
      undefined,
      onCommitment
    )
  );
  expect(mockWallet.signTypedData).toHaveBeenCalledTimes(1);
  expect(onCommitment).toHaveBeenCalledTimes(1);
  expect(mockSignature).not.toHaveBeenCalled();
});
it("keeps the commitment recorded when signature publication is lost", async () => {
  const { offerExpected, offerOperation } = offerSignature();
  mockSignature.mockRejectedValue(new Error("response lost"));
  const onCommitment = jest.fn();
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() =>
    result.current.confirm(
      offerOperation,
      offerExpected,
      undefined,
      onCommitment
    )
  );
  expect(onCommitment).toHaveBeenCalledWith(offerOperation, offerExpected);
  expect(mockSignature).toHaveBeenCalledTimes(1);
});
it("does not record a commitment when offer signing is rejected", async () => {
  const { offerExpected, offerOperation } = offerSignature();
  mockWallet.signTypedData.mockRejectedValue({ code: 4001 });
  const onCommitment = jest.fn();
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() =>
    result.current.confirm(
      offerOperation,
      offerExpected,
      undefined,
      onCommitment
    )
  );
  expect(onCommitment).not.toHaveBeenCalled();
  expect(mockSignature).not.toHaveBeenCalled();
});
it("discards a signed payload when the current intent changes during signing", async () => {
  const { offerExpected, offerOperation } = offerSignature();
  const signing = deferred<string>();
  mockWallet.signTypedData.mockReturnValue(signing.promise);
  let intentIsCurrent = true;
  const assertIntent = jest.fn(() => {
    if (!intentIsCurrent) throw new Error("MARKET_REVIEW_MISMATCH");
  });
  const onCommitment = jest.fn();
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  let confirmation!: Promise<void>;
  act(() => {
    confirmation = result.current.confirm(
      offerOperation,
      offerExpected,
      assertIntent,
      onCommitment
    );
  });
  await waitFor(() => expect(mockWallet.signTypedData).toHaveBeenCalled());
  intentIsCurrent = false;
  await act(async () => {
    signing.resolve("0x1234");
    await confirmation;
  });
  expect(mockSignature).not.toHaveBeenCalled();
  expect(onCommitment).not.toHaveBeenCalled();
});
it("discards a signed payload when the active profile changes during signing", async () => {
  const { offerExpected, offerOperation } = offerSignature();
  const signing = deferred<string>();
  mockWallet.signTypedData.mockReturnValue(signing.promise);
  const onCommitment = jest.fn();
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  let confirmation!: Promise<void>;
  act(() => {
    confirmation = result.current.confirm(
      offerOperation,
      offerExpected,
      undefined,
      onCommitment
    );
  });
  await waitFor(() => expect(mockWallet.signTypedData).toHaveBeenCalled());
  mockAuth.connectedProfile.id = "profile-two";
  await act(async () => {
    signing.resolve("0x1234");
    await confirmation;
  });
  expect(mockSignature).not.toHaveBeenCalled();
  expect(onCommitment).not.toHaveBeenCalled();
});
it.each(["revision-1", "revision-2"])(
  "retries attachment of an already-sent hash at %s without sending a new transaction",
  async (revision) => {
    mockFetch.mockResolvedValue({ ...operation, revision });
    mockRead.mockReturnValue({ request: expected, transactionHash: hash });
    mockSubmission.mockResolvedValue({ ...operation, state: "SUBMITTED" });
    const { result } = renderHook(() => useMarketExecution(jest.fn()));
    await act(() => result.current.confirm(operation, expected));
    expect(mockSubmission).toHaveBeenCalledWith(operation.id, {
      transaction_hash: hash,
    });
    expect(mockWallet.signTypedData).not.toHaveBeenCalled();
    expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
    expect(mockContinue).not.toHaveBeenCalled();
    expect(mockBegin).not.toHaveBeenCalled();
  }
);
it("attaches an already-sent hash even when intent changes during recovery fetch", async () => {
  mockRead.mockReturnValue({ request: expected, transactionHash: hash });
  mockSubmission.mockResolvedValue({ ...operation, state: "SUBMITTED" });
  const fetching = deferred<ApiMarketOperation>();
  mockFetch.mockReturnValue(fetching.promise);
  let intentIsCurrent = true;
  const assertIntent = jest.fn(() => {
    if (!intentIsCurrent) throw new Error("MARKET_REVIEW_MISMATCH");
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  let confirmation!: Promise<void>;
  act(() => {
    confirmation = result.current.confirm(operation, expected, assertIntent);
  });
  await waitFor(() => expect(mockFetch).toHaveBeenCalled());
  intentIsCurrent = false;
  await act(async () => {
    fetching.resolve(operation);
    await confirmation;
  });
  expect(mockSubmission).toHaveBeenCalledWith(operation.id, {
    transaction_hash: hash,
  });
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});

function buyReview() {
  const buyExpected = { ...expected, kind: "BUY" } as ApiMarketPrepareRequest;
  const buyOperation = {
    ...operation,
    kind: "BUY",
    state: "REVIEW",
    block_number: 100,
    wallet: walletAddress,
    transaction: {
      chain_id: 1,
      sender: walletAddress,
      to: walletAddress,
      value: "1000",
      data: "0x",
      purpose: "FULFILL",
      gas_limit: "100",
      max_fee_per_gas: "2",
      gas_reserve_wei: "200",
    },
  } as ApiMarketOperation;
  mockCapabilities.mockResolvedValue({
    actions: [{ action: "BUY", enabled: true }],
  });
  mockFetch.mockResolvedValue(buyOperation);
  mockContinue.mockResolvedValue(buyOperation);
  mockSubmission.mockResolvedValue({ ...buyOperation, state: "SUBMITTED" });
  mockBegin.mockImplementation(
    (_id: string, body: ApiMarketSendAttemptRequest) => ({
      ...buyOperation,
      state: "UNKNOWN",
      send_attempt: {
        attempt_id: body.attempt_id,
        purpose: body.purpose,
        transaction_digest: body.transaction_digest,
        snapshot_block: buyOperation.block_number,
        transaction:
          buyOperation.approval_transactions[0] ?? buyOperation.transaction,
        status: "ACTIVE",
        transaction_hash: null,
      },
    })
  );
  mockReject.mockImplementation(
    (_id: string, body: { attempt_id: string }) => ({
      ...buyOperation,
      send_attempt: { attempt_id: body.attempt_id, status: "REJECTED" },
    })
  );
  return { buyExpected, buyOperation };
}

describe("refreshing purchase intent before execution", () => {
  let now: number;
  let clock: jest.SpyInstance;

  beforeEach(() => {
    now = 1_900_000_000_000;
    clock = jest.spyOn(Date, "now").mockImplementation(() => now);
    mockValidate.mockImplementation((value: ApiMarketOperation) => {
      if (value.expires_at <= Date.now()) {
        throw new Error("MARKET_REVIEW_REFRESH_REQUIRED");
      }
    });
  });

  afterEach(() => clock.mockRestore());

  function purchaseWithFreshContinuation() {
    const { buyExpected, buyOperation } = buyReview();
    buyOperation.expires_at = now + 1000;
    const refreshed = {
      ...buyOperation,
      expires_at: now + 60_000,
      revision: "revision-2",
    };
    mockContinue.mockResolvedValue(refreshed);
    mockBegin.mockImplementation(
      (_id: string, body: ApiMarketSendAttemptRequest) => ({
        ...refreshed,
        state: ApiMarketOperationStateEnum.Unknown,
        send_attempt: {
          attempt_id: body.attempt_id,
          purpose: body.purpose,
          transaction_digest: body.transaction_digest,
          snapshot_block: refreshed.block_number,
          transaction: refreshed.transaction,
          status: "ACTIVE",
          transaction_hash: null,
        },
      })
    );
    return { buyExpected, buyOperation, refreshed };
  }

  it("waits for mandatory fresh validation after GET changes only the displayed revision metadata", async () => {
    const { buyExpected, buyOperation, refreshed } =
      purchaseWithFreshContinuation();
    const observed = {
      ...buyOperation,
      revision: "metadata-revision",
      updated_at: now,
    };
    mockFetch.mockResolvedValue(observed);
    const continuation = deferred<ApiMarketOperation>();
    mockContinue.mockReturnValue(continuation.promise);
    const onOperation = jest.fn();
    const { result } = renderHook(() => useMarketExecution(onOperation));
    let confirmation!: Promise<void>;
    act(() => {
      confirmation = result.current.confirm(buyOperation, buyExpected);
    });
    await waitFor(() => expect(mockContinue).toHaveBeenCalledTimes(1));
    expect(mockValidateForRefresh).toHaveBeenCalledWith(observed, buyExpected);
    expect(mockValidate).not.toHaveBeenCalled();
    expect(mockBegin).not.toHaveBeenCalled();
    expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
    await act(async () => {
      continuation.resolve(refreshed);
      await confirmation;
    });
    expect(mockValidate).toHaveBeenCalledWith(refreshed, buyExpected);
    expect(mockBegin).toHaveBeenCalledWith(
      buyOperation.id,
      expect.objectContaining({ expected_revision: refreshed.revision })
    );
    expect(mockValidate.mock.invocationCallOrder[0]!).toBeLessThan(
      mockBegin.mock.invocationCallOrder[0]!
    );
    expect(mockBegin.mock.invocationCallOrder[0]!).toBeLessThan(
      mockWallet.sendTransaction.mock.invocationCallOrder[0]!
    );
    expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
    expect(onOperation).toHaveBeenCalledWith(refreshed);
    expect(result.current.message).toBeUndefined();
  });

  it.each(["capability", "operation fetch"])(
    "continues once with fresh unchanged terms after the old deadline passes during %s",
    async (awaitedStep) => {
      const { buyExpected, buyOperation, refreshed } =
        purchaseWithFreshContinuation();
      const pending = deferred<unknown>();
      const request =
        awaitedStep === "capability" ? mockCapabilities : mockFetch;
      request.mockReturnValueOnce(pending.promise);
      const onOperation = jest.fn();
      const { result } = renderHook(() => useMarketExecution(onOperation));
      let confirmation!: Promise<void>;
      act(() => {
        confirmation = result.current.confirm(buyOperation, buyExpected);
      });
      await waitFor(() => expect(request).toHaveBeenCalled());
      now += 2000;
      await act(async () => {
        pending.resolve(
          awaitedStep === "capability"
            ? { actions: [{ action: "BUY", enabled: true }] }
            : buyOperation
        );
        await confirmation;
      });
      expect(mockValidateForRefresh).toHaveBeenCalledWith(
        buyOperation,
        buyExpected
      );
      expect(mockContinue).toHaveBeenCalledTimes(1);
      expect(mockValidate).toHaveBeenCalledWith(refreshed, buyExpected);
      expect(onOperation).toHaveBeenCalledWith(refreshed);
      expect(mockBegin).toHaveBeenCalledWith(
        buyOperation.id,
        expect.objectContaining({ expected_revision: refreshed.revision })
      );
      expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
      expect(mockWallet.signTypedData).not.toHaveBeenCalled();
      expect(result.current.message).toBeUndefined();
    }
  );

  it("refreshes an already-expired purchase intent before asking the wallet", async () => {
    const { buyExpected, buyOperation } = purchaseWithFreshContinuation();
    buyOperation.expires_at = now - 1000;
    const { result } = renderHook(() => useMarketExecution(jest.fn()));
    await act(() => result.current.confirm(buyOperation, buyExpected));
    expect(mockContinue).toHaveBeenCalledTimes(1);
    expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
  });

  it("requires another review if fresh continuation changes the reviewed gas terms", async () => {
    const { buyExpected, buyOperation, refreshed } =
      purchaseWithFreshContinuation();
    buyOperation.expires_at = now - 1000;
    const changed = {
      ...refreshed,
      transaction: { ...refreshed.transaction!, gas_reserve_wei: "201" },
    };
    mockFetch.mockResolvedValue({ ...changed, revision: "metadata-revision" });
    mockContinue.mockResolvedValue(changed);
    const onOperation = jest.fn();
    const { result } = renderHook(() => useMarketExecution(onOperation));
    await act(() => result.current.confirm(buyOperation, buyExpected));
    expect(onOperation).toHaveBeenCalledWith(changed);
    expect(result.current.message).toBe(
      "Terms changed. Review the updated details before continuing."
    );
    expect(mockBegin).not.toHaveBeenCalled();
    expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  });

  it("rejects a continuation that is still expired with an actionable refresh message", async () => {
    const { buyExpected, buyOperation, refreshed } =
      purchaseWithFreshContinuation();
    mockContinue.mockResolvedValue({ ...refreshed, expires_at: now });
    const { result } = renderHook(() => useMarketExecution(jest.fn()));
    await act(() => result.current.confirm(buyOperation, buyExpected));
    expect(result.current.message).toBe(
      "Current terms could not be verified. Please try again."
    );
    expect(mockBegin).not.toHaveBeenCalled();
    expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
    expect(mockWallet.signTypedData).not.toHaveBeenCalled();
  });

  it("still validates the old intent bindings before requesting continuation", async () => {
    const { buyExpected, buyOperation } = purchaseWithFreshContinuation();
    buyOperation.expires_at = now - 1000;
    mockValidateForRefresh.mockImplementation(() => {
      throw new Error("MARKET_REVIEW_MISMATCH");
    });
    const { result } = renderHook(() => useMarketExecution(jest.fn()));
    await act(() => result.current.confirm(buyOperation, buyExpected));
    expect(mockContinue).not.toHaveBeenCalled();
    expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  });
  it("preserves an active send returned by continuation without replacing its journal or requesting another send", async () => {
    const { buyExpected, buyOperation, refreshed } =
      purchaseWithFreshContinuation();
    const attempt = createMarketSendAttempt(
      refreshed.transaction!,
      refreshed.block_number,
      refreshed.revision
    );
    mockContinue.mockResolvedValue({
      ...refreshed,
      state: ApiMarketOperationStateEnum.Unknown,
      send_attempt: {
        attempt_id: attempt.id,
        purpose: attempt.purpose,
        transaction_digest: attempt.digest,
        snapshot_block: attempt.snapshotBlock,
        transaction: refreshed.transaction,
        status: "ACTIVE",
      },
    });
    const { result } = renderHook(() => useMarketExecution(jest.fn()));
    await act(() => result.current.confirm(buyOperation, buyExpected));
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockBegin).not.toHaveBeenCalled();
    expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
    expect(mockWallet.signTypedData).not.toHaveBeenCalled();
  });
  it.each(["fetch", "continuation"])(
    "rejects a replacement operation identity returned by %s before changing a journal or opening the wallet",
    async (source) => {
      const { buyExpected, buyOperation, refreshed } =
        purchaseWithFreshContinuation();
      const response = source === "fetch" ? mockFetch : mockContinue;
      response.mockResolvedValue({ ...refreshed, id: "another-operation" });
      const onOperation = jest.fn();
      const { result } = renderHook(() => useMarketExecution(onOperation));
      await act(() => result.current.confirm(buyOperation, buyExpected));
      expect(onOperation).not.toHaveBeenCalled();
      expect(mockSave).not.toHaveBeenCalled();
      expect(mockBegin).not.toHaveBeenCalled();
      expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
      expect(mockWallet.signTypedData).not.toHaveBeenCalled();
    }
  );

  it.each([ApiMarketKind.List, ApiMarketKind.Offer])(
    "automatically renews %s signature reviews and validates the fresh payload before signing",
    async (kind) => {
      const value = { ...operation, kind, expires_at: now - 1000 };
      mockCapabilities.mockResolvedValue({
        actions: [{ action: kind, enabled: true }],
      });
      mockFetch.mockResolvedValue(value);
      const refreshed = {
        ...value,
        expires_at: now + 60_000,
        revision: "fresh-signature-review",
      };
      mockContinue.mockResolvedValue(refreshed);
      const { result } = renderHook(() => useMarketExecution(jest.fn()));
      await act(() => result.current.confirm(value, { ...expected, kind }));
      expect(mockValidateForRefresh).toHaveBeenCalledWith(value, {
        ...expected,
        kind,
      });
      expect(mockContinue).toHaveBeenCalledWith(value.id);
      expect(mockValidate).toHaveBeenCalledWith(refreshed, {
        ...expected,
        kind,
      });
      expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
      expect(mockWallet.signTypedData).toHaveBeenCalledTimes(1);
    }
  );
});

it("checks paused rule continuation before opening a purchase wallet prompt", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockContinue.mockRejectedValue(new Error("RULE_PAUSED"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});
it("requires a new review when refreshed gas terms change", async () => {
  const { buyExpected, buyOperation } = buyReview();
  const changed = {
    ...buyOperation,
    transaction: { ...buyOperation.transaction, gas_limit: "200" },
  };
  mockContinue.mockResolvedValue(changed);
  const onOperation = jest.fn();
  const { result } = renderHook(() => useMarketExecution(onOperation));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(onOperation).toHaveBeenCalledWith(changed);
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});
it("sends the reviewed gas ceilings without silently increasing them", async () => {
  const { buyExpected, buyOperation } = buyReview();
  const onCommitment = jest.fn();
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() =>
    result.current.confirm(buyOperation, buyExpected, undefined, onCommitment)
  );
  expect(mockWallet.sendTransaction).toHaveBeenCalledWith(
    expect.objectContaining({
      gas: 100n,
      maxFeePerGas: 2n,
      maxPriorityFeePerGas: 1n,
    })
  );
  expect(mockSave).toHaveBeenCalledWith(
    expected.profile_id,
    operation.id,
    expect.objectContaining({
      request: buyExpected,
      transactionHash: hash,
    })
  );
  expect(onCommitment).not.toHaveBeenCalled();
});
it("never sends when simulation exceeds the reviewed gas limit", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockClient.estimateGas.mockResolvedValue(101n);
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});

it("rechecks the current intent after transaction preparation awaits", async () => {
  const { buyExpected, buyOperation } = buyReview();
  const simulation = deferred<object>();
  mockClient.call.mockReturnValue(simulation.promise);
  let intentIsCurrent = true;
  const assertIntent = jest.fn(() => {
    if (!intentIsCurrent) throw new Error("MARKET_REVIEW_MISMATCH");
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  let confirmation!: Promise<void>;
  act(() => {
    confirmation = result.current.confirm(
      buyOperation,
      buyExpected,
      assertIntent
    );
  });
  await waitFor(() => expect(mockClient.call).toHaveBeenCalled());
  intentIsCurrent = false;
  await act(async () => {
    simulation.resolve({});
    await confirmation;
  });
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockBegin).not.toHaveBeenCalled();
});

it("journals the attempt before the wallet and blocks retry after a lost broadcast response", async () => {
  const { buyExpected, buyOperation } = buyReview();
  let markerAtWallet: unknown;
  let beginCountAtWallet = 0;
  mockWallet.sendTransaction.mockImplementation(async () => {
    markerAtWallet = persisted;
    beginCountAtWallet = mockBegin.mock.calls.length;
    throw new Error("RPC response lost after broadcast");
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(markerAtWallet).toEqual(
    expect.objectContaining({
      sendAttempt: expect.objectContaining({ walletRequested: true }),
    })
  );
  expect(beginCountAtWallet).toBe(1);
  expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
  expect(mockReject).not.toHaveBeenCalled();
  expect(persisted).toHaveProperty("sendAttempt.walletRequested", true);
});

it("clears a prior error without changing the stage or releasing an unresolved send", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockWallet.sendTransaction.mockRejectedValue(
    new Error("RPC response lost after broadcast")
  );
  const onOperation = jest.fn();
  const { result } = renderHook(() => useMarketExecution(onOperation));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(result.current.message).toBeTruthy();
  expect(persisted).toHaveProperty("sendAttempt.walletRequested", true);
  const priorStage = result.current.stage;
  const priorIntent = persisted;
  const saveCount = mockSave.mock.calls.length;
  const operationCount = onOperation.mock.calls.length;

  act(() => result.current.clearMessage());

  expect(result.current.message).toBeUndefined();
  expect(result.current.stage).toBe(priorStage);
  expect(persisted).toBe(priorIntent);
  expect(mockSave).toHaveBeenCalledTimes(saveCount);
  expect(onOperation).toHaveBeenCalledTimes(operationCount);
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
  expect(mockBegin).toHaveBeenCalledTimes(1);
  expect(mockReject).not.toHaveBeenCalled();
});

it("journals approval hashes on the server without clearing the fence after one confirmation", async () => {
  const { buyExpected, buyOperation } = buyReview();
  const onCommitment = jest.fn();
  buyOperation.approval_transactions = [
    {
      ...buyOperation.transaction!,
      value: "0",
      purpose: "APPROVE_CURRENCY",
    },
  ] as ApiMarketOperation["approval_transactions"];
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() =>
    result.current.confirm(buyOperation, buyExpected, undefined, onCommitment)
  );
  expect(mockSubmission).toHaveBeenCalledWith(buyOperation.id, {
    transaction_hash: hash,
  });
  expect(persisted).toHaveProperty("approvalHash", hash);
  expect(persisted).toHaveProperty("sendAttempt.purpose", "APPROVAL");
  expect(mockClient.waitForTransactionReceipt).not.toHaveBeenCalled();
  expect(onCommitment).not.toHaveBeenCalled();
});

it("retains an ambiguous approval send and never requests its approval again", async () => {
  const { buyExpected, buyOperation } = buyReview();
  buyOperation.approval_transactions = [
    {
      ...buyOperation.transaction!,
      value: "0",
      purpose: "APPROVE_CURRENCY",
    },
  ] as ApiMarketOperation["approval_transactions"];
  mockWallet.sendTransaction.mockRejectedValue(
    new Error("RPC response lost after approval broadcast")
  );
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
  expect(mockReject).not.toHaveBeenCalled();
  expect(persisted).toHaveProperty("sendAttempt.purpose", "APPROVAL");
});

it("blocks a fresh browser from an active server attempt even with no local intent", async () => {
  const { buyExpected, buyOperation } = buyReview();
  const active = activeAttempt(buyOperation);
  mockRead.mockReturnValue(null);
  mockFetch.mockResolvedValue(active);
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(active, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockBegin).not.toHaveBeenCalled();
});

it("clears only an explicitly rejected wallet request after server acknowledgement", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockWallet.sendTransaction.mockRejectedValue({ cause: { code: 4001 } });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockReject).toHaveBeenCalledWith(buyOperation.id, {
    attempt_id: expect.any(String),
    reason: "USER_REJECTED",
  });
  expect(persisted).toEqual({ request: buyExpected });
});

it("keeps a rejected attempt pending when its server acknowledgement is lost", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockWallet.sendTransaction.mockRejectedValue({ code: 4001 });
  mockReject.mockRejectedValue(new Error("offline"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
  expect(persisted).toHaveProperty(
    "sendAttempt.rejectionReason",
    "USER_REJECTED"
  );
});

it("never requests the wallet if the server attempt acknowledgement is lost", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockBegin.mockRejectedValueOnce(new Error("offline"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockReject).toHaveBeenCalledWith(buyOperation.id, {
    attempt_id: expect.any(String),
    reason: "WALLET_NOT_REQUESTED",
    expected_revision: buyOperation.revision,
  });
  expect(mockBegin).toHaveBeenCalledTimes(1);
  expect(persisted).toEqual({ request: buyExpected });
});

it("clears a never-persisted begin only after the server tombstones its original revision", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockBegin.mockRejectedValue(new Error("stale revision"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockReject).toHaveBeenCalledWith(buyOperation.id, {
    attempt_id: expect.any(String),
    reason: "WALLET_NOT_REQUESTED",
    expected_revision: buyOperation.revision,
  });
  expect(persisted).toEqual({ request: buyExpected });
});

it("does not clear a never-requested attempt while another server attempt is active", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockBegin.mockRejectedValue(new Error("stale revision"));
  mockReject.mockRejectedValue(new Error("Another attempt is ACTIVE"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(persisted).toHaveProperty(
    "sendAttempt.rejectionReason",
    "WALLET_NOT_REQUESTED"
  );
});

it("rechecks the active wallet after the server attempt acknowledgement", async () => {
  const { buyExpected, buyOperation } = buyReview();
  const implementation = mockBegin.getMockImplementation()!;
  mockBegin.mockImplementation((...args: unknown[]) => {
    mockConnection.address = "0x2222222222222222222222222222222222222222";
    return implementation(...args);
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockReject).toHaveBeenCalledWith(buyOperation.id, {
    attempt_id: expect.any(String),
    reason: "WALLET_NOT_REQUESTED",
    expected_revision: buyOperation.revision,
  });
});

it("rechecks the current intent after an approval attempt acknowledgement", async () => {
  const { buyExpected, buyOperation } = buyReview();
  buyOperation.approval_transactions = [
    {
      ...buyOperation.transaction!,
      value: "0",
      purpose: "APPROVE_CURRENCY",
    },
  ] as ApiMarketOperation["approval_transactions"];
  const implementation = mockBegin.getMockImplementation()!;
  const acknowledgement = deferred<ApiMarketOperation>();
  let response!: ApiMarketOperation;
  mockBegin.mockImplementation((...args: unknown[]) => {
    response = implementation(...args) as ApiMarketOperation;
    return acknowledgement.promise;
  });
  let intentIsCurrent = true;
  const assertIntent = jest.fn(() => {
    if (!intentIsCurrent) throw new Error("MARKET_REVIEW_MISMATCH");
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  let confirmation!: Promise<void>;
  act(() => {
    confirmation = result.current.confirm(
      buyOperation,
      buyExpected,
      assertIntent
    );
  });
  await waitFor(() => expect(mockBegin).toHaveBeenCalled());
  intentIsCurrent = false;
  await act(async () => {
    acknowledgement.resolve(response);
    await confirmation;
  });
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockReject).toHaveBeenCalledWith(buyOperation.id, {
    attempt_id: expect.any(String),
    reason: "WALLET_NOT_REQUESTED",
    expected_revision: buyOperation.revision,
  });
});

function activeAttempt(review: ApiMarketOperation): ApiMarketOperation {
  const attempt = createMarketSendAttempt(
    review.transaction!,
    review.block_number
  );
  return {
    ...review,
    state: "UNKNOWN",
    send_attempt: {
      attempt_id: attempt.id,
      purpose: attempt.purpose,
      status: "ACTIVE",
      transaction_digest: attempt.digest,
      snapshot_block: attempt.snapshotBlock,
      transaction: review.transaction!,
      transaction_hash: null,
    },
  } as ApiMarketOperation;
}

function recoveryFixture() {
  const { buyOperation } = buyReview();
  const active = activeAttempt(buyOperation);
  mockRead.mockReturnValue(null);
  mockFetch.mockResolvedValue(active);
  mockClient.getTransaction.mockResolvedValue({
    hash,
    chainId: 1,
    from: walletAddress,
    to: walletAddress,
    value: 1000n,
    input: "0x",
    blockNumber: 101n,
  });
  return active;
}

it("recovers the exact transaction without a local request or active trading capability", async () => {
  const active = recoveryFixture();
  mockAuth.connectedProfile.id = "new-profile";
  mockCapabilities.mockResolvedValue({ actions: [] });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.recoverTransaction(active, hash));
  expect(mockSubmission).toHaveBeenCalledWith(active.id, {
    transaction_hash: hash,
  });
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
  expect(mockCapabilities).not.toHaveBeenCalled();
});

it("journals an exact pending recovery hash while leaving settlement to the server", async () => {
  const active = recoveryFixture();
  mockClient.getTransaction.mockResolvedValue({
    hash,
    chainId: 1,
    from: walletAddress,
    to: walletAddress,
    value: 1000n,
    input: "0x",
    blockNumber: null,
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.recoverTransaction(active, hash));
  expect(mockSubmission).toHaveBeenCalledWith(active.id, {
    transaction_hash: hash,
  });
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});

it.each([
  { value: 1001n },
  { input: "0x1234" },
  { from: "0x2222222222222222222222222222222222222222" },
  { to: "0x2222222222222222222222222222222222222222" },
  { chainId: 8453 },
  { chainId: undefined },
  { blockNumber: 100n },
])("rejects a substituted recovery transaction %s", async (change) => {
  const active = recoveryFixture();
  mockClient.getTransaction.mockResolvedValue({
    hash,
    chainId: 1,
    from: walletAddress,
    to: walletAddress,
    value: 1000n,
    input: "0x",
    blockNumber: 101n,
    ...change,
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.recoverTransaction(active, hash));
  expect(mockSubmission).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});
