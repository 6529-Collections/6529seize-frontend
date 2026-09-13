import { act, renderHook, waitFor } from "@testing-library/react";
import { hashStruct, hashTypedData } from "viem";
import { useCollectRecipientUpdate } from "@/components/collect/useCollectRecipientUpdate";
import {
  readMarketIntent,
  saveMarketIntent,
} from "@/components/collect/market-operation-storage";
import {
  MARKET_CONDUIT_KEY,
  MARKET_ORDER_TYPES,
  MARKET_SEAPORT,
  MARKET_ZERO,
  MARKET_ZERO_HASH,
  marketTypedData,
} from "@/components/collect/market-validation";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import {
  ApiMarketOperationStateEnum,
  type ApiMarketOperation,
} from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";

const mockFetch = jest.fn();
const mockPrepare = jest.fn();
const mockLock = jest.fn();
jest.mock("@/services/api/market-api", () => ({
  fetchMarketOperation: (...args: unknown[]) => mockFetch(...args),
  prepareMarketOperation: (...args: unknown[]) => mockPrepare(...args),
}));
jest.mock("@/components/collect/market-operation-lock", () => ({
  withMarketOperationLock: (...args: unknown[]) => mockLock(...args),
}));

const payer = "0x1111111111111111111111111111111111111111";
const ownRecipient = "0x2222222222222222222222222222222222222222";
const fren = "0x3333333333333333333333333333333333333333";
const maker = "0x4444444444444444444444444444444444444444";
const fee = "0x5555555555555555555555555555555555555555";
const hash = `0x${"a".repeat(64)}` as const;
const families = [
  {
    family: "memes",
    contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
    type: 3,
    quantity: "2",
  },
  {
    family: "gradients",
    contract: "0x0c58ef43ff3032005e472cb5709f8908acb00205",
    type: 2,
    quantity: "1",
  },
  {
    family: "pebbles",
    contract: "0x45882f9bc325e14fbb298a1df930c43a874b83ae",
    type: 2,
    quantity: "1",
  },
];
const profile: ApiIdentity = {
  id: "profile",
  handle: null,
  normalised_handle: null,
  pfp: null,
  cic: 0,
  rep: 0,
  level: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  consolidation_key: "profile",
  display: "profile",
  primary_wallet: payer,
  banner1: null,
  banner2: null,
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
  wallets: [payer, ownRecipient].map((wallet) => ({
    wallet,
    display: wallet,
    tdh: 0,
  })),
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
};
let sequence = 0;
function fixture(family = families[0]!) {
  const now = Date.now();
  const operation: ApiMarketOperation = {
    id: `operation-${++sequence}`,
    revision: "r1",
    state: ApiMarketOperationStateEnum.Review,
    profile_id: "profile",
    kind: ApiMarketKind.Buy,
    wallet: payer,
    recipient: payer,
    recipient_in_profile: true,
    nft_recipient: payer,
    asset_key: `1:${family.contract}:1`,
    quantity: family.quantity,
    currency: MARKET_ZERO,
    total_wei: "1000",
    net_wei: "950",
    fees: [{ recipient: fee, amount_wei: "50" }],
    approval_transactions: [],
    potential_liability_wei: "0",
    expires_at: now + 60_000,
    updated_at: now,
    order: {
      protocol_address: MARKET_SEAPORT,
      order_hash: MARKET_ZERO_HASH,
      digest: MARKET_ZERO_HASH,
      components: {
        offerer: maker,
        zone: MARKET_ZERO,
        offer: [
          {
            item_type: family.type,
            token: family.contract,
            identifier_or_criteria: "1",
            start_amount: family.quantity,
            end_amount: family.quantity,
          },
        ],
        consideration: [
          {
            item_type: 0,
            token: MARKET_ZERO,
            identifier_or_criteria: "0",
            start_amount: "950",
            end_amount: "950",
            recipient: maker,
          },
          {
            item_type: 0,
            token: MARKET_ZERO,
            identifier_or_criteria: "0",
            start_amount: "50",
            end_amount: "50",
            recipient: fee,
          },
        ],
        order_type: 0,
        start_time: String(Math.floor(now / 1000) - 60),
        end_time: String(Math.floor(now / 1000) + 3600),
        zone_hash: MARKET_ZERO_HASH,
        salt: "1",
        conduit_key: MARKET_CONDUIT_KEY,
        counter: "0",
      },
    },
  };
  const typed = marketTypedData(operation.order!.components);
  operation.order!.order_hash = hashStruct({
    data: typed.message,
    primaryType: "OrderComponents",
    types: MARKET_ORDER_TYPES,
  });
  operation.order!.digest = hashTypedData(typed);
  const expected: ApiMarketPrepareRequest = {
    profile_id: operation.profile_id,
    wallet: payer,
    recipient: payer,
    asset_key: operation.asset_key,
    kind: ApiMarketKind.Buy,
    quantity: operation.quantity,
    currency: MARKET_ZERO,
    amount_wei: operation.total_wei,
    acknowledge_external_recipient: false,
    order: {
      protocol_address: MARKET_SEAPORT,
      order_hash: operation.order!.order_hash,
    },
  };
  saveMarketIntent(operation.profile_id, operation.id, { request: expected });
  const options = {
    operation,
    expected,
    profile,
    wallet: payer,
    enabled: true,
    onUpdated: jest.fn(),
    onError: jest.fn(),
  };
  mockFetch.mockResolvedValue(operation);
  mockPrepare.mockImplementation(async (request: ApiMarketPrepareRequest) => ({
    ...operation,
    id: `new-${operation.id}`,
    recipient: request.recipient,
    nft_recipient: request.recipient,
    recipient_in_profile: request.recipient === ownRecipient,
  }));
  return options;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}
beforeEach(() => {
  jest.resetAllMocks();
  mockLock.mockImplementation((_id: string, run: () => Promise<boolean>) =>
    run()
  );
});

it.each(families)(
  "reprepares exact $family signed terms for another profile wallet",
  async (family) => {
    const options = fixture(family);
    const { result } = renderHook(() => useCollectRecipientUpdate(options));
    expect(result.current.canEdit).toBe(true);
    await act(async () => {
      expect(await result.current.update(ownRecipient, false)).toBe(true);
    });
    const updatedRequest = { ...options.expected, recipient: ownRecipient };
    expect(mockPrepare).toHaveBeenCalledWith(
      updatedRequest,
      expect.any(String)
    );
    expect(mockLock).toHaveBeenCalledWith(
      options.operation.id,
      expect.any(Function)
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(options.onUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: ownRecipient,
        quantity: family.quantity,
      }),
      updatedRequest
    );
    expect(readMarketIntent("profile", options.operation.id)).toEqual({
      request: options.expected,
    });
    expect(
      readMarketIntent("profile", `new-${options.operation.id}`)?.request
    ).toEqual(updatedRequest);
  }
);

it("requires fresh address-bound consent for a fren", async () => {
  const options = fixture();
  const { result } = renderHook(() => useCollectRecipientUpdate(options));
  await act(async () => {
    expect(await result.current.update(fren, false)).toBe(false);
  });
  expect(mockPrepare).not.toHaveBeenCalled();
  await act(async () => {
    expect(await result.current.update(fren, true)).toBe(true);
  });
  expect(mockPrepare).toHaveBeenCalledWith(
    {
      ...options.expected,
      recipient: fren,
      acknowledge_external_recipient: true,
    },
    expect.any(String)
  );
});

it.each(["", "fren.eth", MARKET_ZERO, "0x1234"])(
  "rejects unresolved or invalid recipient %s",
  async (recipient) => {
    const options = fixture();
    const { result } = renderHook(() => useCollectRecipientUpdate(options));
    await act(() => result.current.update(recipient, true));
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(options.onUpdated).not.toHaveBeenCalled();
  }
);

it.each(["approvalHash", "transactionHash"] as const)(
  "blocks a saved %s without clearing it",
  async (field) => {
    const options = fixture();
    const saved = { request: options.expected, [field]: hash };
    saveMarketIntent("profile", options.operation.id, saved);
    const { result } = renderHook(() => useCollectRecipientUpdate(options));
    expect(result.current.canEdit).toBe(false);
    await act(() => result.current.update(ownRecipient, false));
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(readMarketIntent("profile", options.operation.id)).toEqual(saved);
  }
);

it.each([
  ApiMarketOperationStateEnum.Unknown,
  ApiMarketOperationStateEnum.Submitted,
  ApiMarketOperationStateEnum.Confirmed,
])("does not replace a %s purchase", async (state) => {
  const options = fixture();
  options.operation.state = state;
  const { result } = renderHook(() => useCollectRecipientUpdate(options));
  expect(result.current.canEdit).toBe(false);
  await act(() => result.current.update(ownRecipient, false));
  expect(mockPrepare).not.toHaveBeenCalled();
});

it("retains a server transaction hash even on a REVIEW row", async () => {
  const options = fixture();
  options.operation.transaction_hash = hash;
  const { result } = renderHook(() => useCollectRecipientUpdate(options));
  await act(() => result.current.update(ownRecipient, false));
  expect(mockPrepare).not.toHaveBeenCalled();
});

it("reuses the exact failed request key while a changed recipient gets a new key", async () => {
  const options = fixture();
  mockPrepare.mockRejectedValue(new Error("Response lost"));
  const { result } = renderHook(() => useCollectRecipientUpdate(options));
  await act(() => result.current.update(ownRecipient, false));
  await act(() => result.current.update(ownRecipient, false));
  await act(() => result.current.update(fren, true));
  expect(mockPrepare.mock.calls[1]).toEqual(mockPrepare.mock.calls[0]);
  expect(mockPrepare.mock.calls[2]![1]).not.toBe(mockPrepare.mock.calls[0]![1]);
  expect(readMarketIntent("profile", options.operation.id)).toEqual({
    request: options.expected,
  });
});

it.each([
  "profile",
  "membership",
  "wallet",
  "revision",
  "enabled",
  "expected",
  "unmount",
])("discards a pending response after %s changes", async (change) => {
  const options = fixture();
  const pending = deferred<ApiMarketOperation>();
  mockPrepare.mockReturnValue(pending.promise);
  const { result, rerender, unmount } = renderHook(
    (props) => useCollectRecipientUpdate(props),
    { initialProps: options }
  );
  let update!: Promise<boolean>;
  act(() => {
    update = result.current.update(ownRecipient, false);
  });
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
  if (change === "unmount") unmount();
  else
    rerender({
      ...options,
      ...(change === "profile"
        ? { profile: { ...profile, id: "other-profile" } }
        : {}),
      ...(change === "membership"
        ? {
            profile: {
              ...profile,
              wallets: [{ wallet: payer, display: payer, tdh: 0 }],
            },
          }
        : {}),
      ...(change === "wallet" ? { wallet: ownRecipient } : {}),
      ...(change === "revision"
        ? { operation: { ...options.operation, revision: "r2" } }
        : {}),
      ...(change === "enabled" ? { enabled: false } : {}),
      ...(change === "expected"
        ? { expected: { ...options.expected, recipient: ownRecipient } }
        : {}),
    });
  await act(async () => {
    pending.resolve({
      ...options.operation,
      id: `new-${options.operation.id}`,
      recipient: ownRecipient,
      nft_recipient: ownRecipient,
    });
    expect(await update).toBe(false);
  });
  expect(options.onUpdated).not.toHaveBeenCalled();
  expect(options.onError).not.toHaveBeenCalled();
  expect(readMarketIntent("profile", `new-${options.operation.id}`)).toBeNull();
});

it("keeps the execution guard valid across normal refresh revision and enabled changes", () => {
  const options = fixture();
  const { result, rerender } = renderHook(
    (props) => useCollectRecipientUpdate(props),
    { initialProps: options }
  );
  const guard = result.current.assertIdle;
  rerender({
    ...options,
    enabled: false,
    operation: {
      ...options.operation,
      revision: "r2",
      expires_at: Date.now() + 90_000,
    },
  });
  expect(guard).not.toThrow();
  rerender({
    ...options,
    expected: { ...options.expected, recipient: ownRecipient },
  });
  expect(guard).toThrow("MARKET_CONNECTION_CHANGED");
});

it("excludes confirmation and a second recipient update synchronously", async () => {
  const options = fixture();
  const pending = deferred<ApiMarketOperation>();
  mockPrepare.mockReturnValue(pending.promise);
  const { result } = renderHook(() => useCollectRecipientUpdate(options));
  let update!: Promise<boolean>;
  act(() => {
    update = result.current.update(ownRecipient, false);
  });
  expect(result.current.assertIdle).toThrow("MARKET_CONNECTION_CHANGED");
  await act(async () => {
    expect(await result.current.update(fren, true)).toBe(false);
  });
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
  await act(async () => {
    pending.resolve({
      ...options.operation,
      id: `new-${options.operation.id}`,
      recipient: ownRecipient,
      nft_recipient: ownRecipient,
    });
    await update;
  });
});

it.each<{ label: string; patch: Partial<ApiMarketOperation> }>([
  { label: "recipient", patch: { recipient: fren } },
  { label: "quantity", patch: { quantity: "9" } },
  { label: "amount", patch: { total_wei: "1001" } },
  { label: "profile", patch: { profile_id: "other-profile" } },
  { label: "expired", patch: { expires_at: 0 } },
])(
  "rejects a fresh response with mismatched $label using the real validator",
  async ({ patch }) => {
    const options = fixture();
    mockPrepare.mockResolvedValue({
      ...options.operation,
      id: `new-${options.operation.id}`,
      recipient: ownRecipient,
      nft_recipient: ownRecipient,
      ...patch,
    });
    const { result } = renderHook(() => useCollectRecipientUpdate(options));
    await act(async () => {
      expect(await result.current.update(ownRecipient, false)).toBe(false);
    });
    expect(options.onUpdated).not.toHaveBeenCalled();
    expect(
      readMarketIntent("profile", `new-${options.operation.id}`)
    ).toBeNull();
  }
);

it("rechecks original recovery after preparation before replacing the review", async () => {
  const options = fixture();
  mockPrepare.mockImplementation(async (request: ApiMarketPrepareRequest) => {
    saveMarketIntent("profile", options.operation.id, {
      request: options.expected,
      approvalHash: hash,
    });
    return {
      ...options.operation,
      id: `new-${options.operation.id}`,
      recipient: request.recipient,
      nft_recipient: request.recipient,
    };
  });
  const { result } = renderHook(() => useCollectRecipientUpdate(options));
  await act(async () => {
    expect(await result.current.update(ownRecipient, false)).toBe(false);
  });
  expect(options.onUpdated).not.toHaveBeenCalled();
  expect(readMarketIntent("profile", options.operation.id)?.approvalHash).toBe(
    hash
  );
});

it("fails closed when the old operation is locked by another tab", async () => {
  const options = fixture();
  mockLock.mockRejectedValue(new Error("MARKET_EXECUTION_ALREADY_ACTIVE"));
  const { result } = renderHook(() => useCollectRecipientUpdate(options));
  await act(() => result.current.update(ownRecipient, false));
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockFetch).not.toHaveBeenCalled();
});

it("preserves a replacement hash recorded during the final original-operation read", async () => {
  const options = fixture();
  const request = { ...options.expected, recipient: ownRecipient };
  mockFetch
    .mockResolvedValueOnce(options.operation)
    .mockImplementationOnce(async () => {
      saveMarketIntent("profile", `new-${options.operation.id}`, {
        request,
        transactionHash: hash,
      });
      return options.operation;
    });
  const { result } = renderHook(() => useCollectRecipientUpdate(options));
  await act(async () => {
    expect(await result.current.update(ownRecipient, false)).toBe(false);
  });
  expect(options.onUpdated).not.toHaveBeenCalled();
  expect(
    readMarketIntent("profile", `new-${options.operation.id}`)?.transactionHash
  ).toBe(hash);
});

it("does not overwrite a replacement while another tab holds its execution lock", async () => {
  const options = fixture();
  mockLock.mockImplementation((id: string, run: () => Promise<boolean>) => {
    if (id !== options.operation.id)
      throw new Error("MARKET_EXECUTION_ALREADY_ACTIVE");
    return run();
  });
  const { result } = renderHook(() => useCollectRecipientUpdate(options));
  await act(async () => {
    expect(await result.current.update(ownRecipient, false)).toBe(false);
  });
  expect(options.onUpdated).not.toHaveBeenCalled();
  expect(readMarketIntent("profile", `new-${options.operation.id}`)).toBeNull();
});

it("keeps a local not-yet-requested send attempt fenced until authoritative resolution", async () => {
  const options = fixture();
  const saved = {
    request: options.expected,
    sendAttempt: {
      id: "attempt",
      purpose: "TRANSACTION" as const,
      digest: "a".repeat(64),
      snapshotBlock: 1,
      walletRequested: false,
      expectedRevision: "r1",
    },
  };
  saveMarketIntent("profile", options.operation.id, saved);
  const { result } = renderHook(() => useCollectRecipientUpdate(options));
  expect(result.current.canEdit).toBe(false);
  await act(() => result.current.update(ownRecipient, false));
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(readMarketIntent("profile", options.operation.id)).toEqual(saved);
});
