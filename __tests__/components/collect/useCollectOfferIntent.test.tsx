import { renderHook, waitFor } from "@testing-library/react";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { ApiMarketOperationStateEnum } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type {
  CollectTradeAction,
  CollectTradeDraft,
} from "@/components/collect/collect.types";
import { MARKET_WETH } from "@/components/collect/market-validation";
import { useCollectOfferIntent } from "@/components/collect/useCollectOfferIntent";

jest.mock("@/components/collect/market-validation", () => {
  const actual = jest.requireActual("@/components/collect/market-validation");

  return {
    ...actual,
    validatePublishedMarketOffer: (operation: {
      kind: string;
      state: string;
    }) => {
      if (
        operation.kind !== "OFFER" ||
        !["LIVE", "CONFIRMED"].includes(operation.state)
      ) {
        throw new Error("NOT_PUBLISHED");
      }
    },
    validateCommittedMarketOffer: (operation: {
      kind: string;
      state: string;
    }) => {
      if (
        operation.kind !== "OFFER" ||
        ![
          "AWAITING_SIGNATURE",
          "PUBLISHING",
          "UNKNOWN",
          "LIVE",
          "CONFIRMED",
        ].includes(operation.state)
      ) {
        throw new Error("NOT_COMMITTED");
      }
    },
  };
});

const WALLET = "0x1111111111111111111111111111111111111111";
const PROFILE_A = "profile-a";
const PROFILE_B = "profile-b";
const ASSET_KEY = "1:0x2222222222222222222222222222222222222222:7";
const ORDER_HASH =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

interface OfferIntentOptions {
  readonly action: CollectTradeAction;
  readonly assetKey: string;
  readonly draft: CollectTradeDraft;
  readonly profileId: string | undefined;
  readonly wallet: string | undefined;
  readonly authenticated: boolean;
  readonly proxy: boolean;
  readonly maximumOfferAmountWei: string | undefined;
  readonly fixedOfferQuantity?: string | undefined;
  readonly initialOperation: ApiMarketOperation | undefined;
  readonly operation: ApiMarketOperation | null;
  readonly expected: ApiMarketPrepareRequest | null;
  readonly onPublished: ((operation: ApiMarketOperation) => void) | undefined;
  readonly onCommitment?:
    | ((
        operation: ApiMarketOperation,
        expected: ApiMarketPrepareRequest
      ) => void)
    | undefined;
}

function draft(overrides: Partial<CollectTradeDraft> = {}): CollectTradeDraft {
  return {
    quantity: "2",
    unitPriceEth: "0.1",
    expiryHours: "168",
    recipient: WALLET,
    ...overrides,
  };
}

function request(
  overrides: Partial<ApiMarketPrepareRequest> = {}
): ApiMarketPrepareRequest {
  return {
    profile_id: PROFILE_A,
    wallet: WALLET,
    recipient: WALLET,
    asset_key: ASSET_KEY,
    kind: ApiMarketKind.Offer,
    quantity: "2",
    currency: MARKET_WETH,
    amount_wei: "200",
    expires_at: 1_900_000_000,
    acknowledge_external_recipient: false,
    ...overrides,
  };
}

function operation(
  overrides: Partial<ApiMarketOperation> = {}
): ApiMarketOperation {
  return {
    id: "operation-a",
    revision: "revision-a",
    state: ApiMarketOperationStateEnum.AwaitingSignature,
    profile_id: PROFILE_A,
    kind: ApiMarketKind.Offer,
    wallet: WALLET,
    recipient: WALLET,
    recipient_in_profile: true,
    asset_key: ASSET_KEY,
    quantity: "2",
    currency: MARKET_WETH,
    total_wei: "200",
    net_wei: "200",
    fees: [],
    approval_transactions: [],
    expires_at: 1_900_000_000_000,
    updated_at: 100,
    potential_liability_wei: "200",
    order_hash: ORDER_HASH,
    ...overrides,
  } as ApiMarketOperation;
}

function options(
  overrides: Partial<OfferIntentOptions> = {}
): OfferIntentOptions {
  return {
    action: "offer",
    assetKey: ASSET_KEY,
    draft: draft(),
    profileId: PROFILE_A,
    wallet: WALLET,
    authenticated: true,
    proxy: false,
    maximumOfferAmountWei: "200",
    fixedOfferQuantity: undefined,
    initialOperation: undefined,
    operation: null,
    expected: null,
    onPublished: undefined,
    onCommitment: undefined,
    ...overrides,
  };
}

function renderIntent(initialOptions: OfferIntentOptions) {
  return renderHook(
    ({ current }: { current: OfferIntentOptions }) =>
      useCollectOfferIntent(current),
    { initialProps: { current: initialOptions } }
  );
}

describe("useCollectOfferIntent", () => {
  it("guards and binds a matching active offer at the full cap", () => {
    const expected = request();
    const active = operation();
    const { result } = renderIntent(options());

    expect(() => result.current.guard(expected)).not.toThrow();
    expect(() => result.current.bind(active, expected)).not.toThrow();
    expect(() => result.current.guardReview(active, expected)).not.toThrow();
    expect(() =>
      result.current.guard({ ...expected, amount_wei: "201" })
    ).toThrow("MARKET_OFFER_LIMIT_EXCEEDED");
  });

  it("reserves the exact full offer total once", () => {
    const expected = request();
    const awaiting = operation({
      state: ApiMarketOperationStateEnum.AwaitingSignature,
    });
    const onCommitment = jest.fn();
    const { result } = renderIntent(
      options({
        initialOperation: awaiting,
        expected,
        onCommitment,
      })
    );

    expect(() => result.current.reserve(awaiting, expected)).not.toThrow();
    expect(() => result.current.reserve(awaiting, expected)).not.toThrow();
    expect(onCommitment).toHaveBeenCalledTimes(1);
    expect(onCommitment).toHaveBeenCalledWith(awaiting, expected);
  });

  it("only reserves an awaiting signature after explicit reserve", () => {
    const expected = request();
    const awaiting = operation({
      state: ApiMarketOperationStateEnum.AwaitingSignature,
    });
    const onCommitment = jest.fn();
    const onPublished = jest.fn();
    const { result } = renderIntent(
      options({
        initialOperation: awaiting,
        operation: awaiting,
        expected,
        onPublished,
        onCommitment,
      })
    );

    expect(onCommitment).not.toHaveBeenCalled();
    expect(onPublished).not.toHaveBeenCalled();
    result.current.reserve(awaiting, expected);
    expect(onCommitment).toHaveBeenCalledWith(awaiting, expected);
    expect(onPublished).not.toHaveBeenCalled();
  });

  it("reserves a recovered unknown operation without publishing it", async () => {
    const unknown = operation({ state: ApiMarketOperationStateEnum.Unknown });
    const onCommitment = jest.fn();
    const onPublished = jest.fn();

    renderIntent(
      options({
        initialOperation: unknown,
        operation: unknown,
        expected: request(),
        onPublished,
        onCommitment,
      })
    );

    await waitFor(() => expect(onCommitment).toHaveBeenCalledTimes(1));
    expect(onCommitment).toHaveBeenCalledWith(unknown, request());
    expect(onPublished).not.toHaveBeenCalled();
  });

  it.each([
    ["draft", { draft: draft({ unitPriceEth: "0.2" }) }],
    ["profile", { profileId: PROFILE_B }],
  ])("invalidates a captured guard when the %s changes", (_label, change) => {
    const { result, rerender } = renderIntent(options());
    const captured = result.current.guard;
    const changed = { ...options(), ...change };
    const changedRequest = request(
      "profileId" in change ? { profile_id: PROFILE_B } : {}
    );

    rerender({ current: changed });

    expect(() => captured(request())).toThrow("MARKET_CONNECTION_CHANGED");
    expect(() => result.current.guard(changedRequest)).not.toThrow();
  });

  it("invalidates both old captures across an A-to-B-to-A transition", () => {
    const first = options();
    const { result, rerender, unmount } = renderIntent(first);
    const guardA = result.current.guard;
    const second = {
      ...first,
      profileId: PROFILE_B,
      draft: draft({ unitPriceEth: "0.2" }),
    };

    rerender({ current: second });
    const guardB = result.current.guard;
    rerender({ current: { ...first } });

    expect(() => guardA(request())).toThrow("MARKET_CONNECTION_CHANGED");
    expect(() => guardB(request({ profile_id: PROFILE_B }))).toThrow(
      "MARKET_CONNECTION_CHANGED"
    );
    expect(() => result.current.guard(request())).not.toThrow();

    const guardAfterReturn = result.current.guard;
    unmount();
    expect(() => guardAfterReturn(request())).toThrow(
      "MARKET_CONNECTION_CHANGED"
    );
  });

  it("invalidates a captured guard when the fixed quantity changes", () => {
    const initial = options({ fixedOfferQuantity: "2" });
    const { result, rerender } = renderIntent(initial);
    const captured = result.current.guard;

    expect(() => captured(request())).not.toThrow();
    rerender({ current: { ...initial, fixedOfferQuantity: "3" } });

    expect(() => captured(request())).toThrow("MARKET_CONNECTION_CHANGED");
    expect(() =>
      result.current.guard(request({ quantity: "3" }))
    ).not.toThrow();
  });

  it("keeps the quantity guard optional", () => {
    const { result } = renderIntent(options({ fixedOfferQuantity: undefined }));

    expect(() =>
      result.current.guard(request({ quantity: "1" }))
    ).not.toThrow();
  });

  it("calls onPublished once when an operation moves from publishing to live", async () => {
    const expected = request();
    const publishing = operation({
      state: ApiMarketOperationStateEnum.Publishing,
    });
    const onPublished = jest.fn();
    const onCommitment = jest.fn();
    const initial = options({
      initialOperation: publishing,
      operation: publishing,
      expected,
      onPublished,
      onCommitment,
    });
    const { rerender } = renderIntent(initial);

    expect(onPublished).not.toHaveBeenCalled();
    const live = operation({
      state: ApiMarketOperationStateEnum.Live,
      updated_at: 101,
    });
    rerender({ current: { ...initial, operation: live } });

    await waitFor(() => expect(onPublished).toHaveBeenCalledTimes(1));
    expect(onCommitment).toHaveBeenCalledTimes(1);
    expect(onPublished).toHaveBeenCalledWith(live);
    rerender({ current: { ...initial, operation: live } });
    expect(onPublished).toHaveBeenCalledTimes(1);
  });

  it("does not consume a reservation when its callback throws", () => {
    const expected = request();
    const awaiting = operation({
      state: ApiMarketOperationStateEnum.AwaitingSignature,
    });
    const onCommitment = jest.fn().mockImplementationOnce(() => {
      throw new Error("COMMITMENT_STORAGE_UNAVAILABLE");
    });
    const { result } = renderIntent(
      options({
        initialOperation: awaiting,
        expected,
        onCommitment,
      })
    );

    expect(() => result.current.reserve(awaiting, expected)).toThrow(
      "COMMITMENT_STORAGE_UNAVAILABLE"
    );
    expect(() => result.current.reserve(awaiting, expected)).not.toThrow();
    expect(onCommitment).toHaveBeenCalledTimes(2);
  });

  it("blocks late actor and over-cap reservation attempts", () => {
    const expected = request();
    const awaiting = operation({
      state: ApiMarketOperationStateEnum.AwaitingSignature,
    });
    const onCommitment = jest.fn();
    const initial = options({
      initialOperation: awaiting,
      expected,
      onCommitment,
    });
    const { result, rerender } = renderIntent(initial);
    const reserve = result.current.reserve;

    expect(() => reserve(awaiting, { ...expected, amount_wei: "201" })).toThrow(
      "MARKET_OFFER_LIMIT_EXCEEDED"
    );
    rerender({
      current: {
        ...initial,
        profileId: PROFILE_B,
        draft: draft({ unitPriceEth: "0.2" }),
      },
    });
    expect(() => reserve(awaiting, expected)).toThrow(
      "MARKET_CONNECTION_CHANGED"
    );
    expect(onCommitment).not.toHaveBeenCalled();
  });

  it("invalidates a captured reserve when commitment is removed", () => {
    const expected = request();
    const awaiting = operation({
      state: ApiMarketOperationStateEnum.AwaitingSignature,
    });
    const onCommitment = jest.fn();
    const initial = options({
      initialOperation: awaiting,
      expected,
      onCommitment,
    });
    const { result, rerender } = renderIntent(initial);
    const reserve = result.current.reserve;

    rerender({ current: { ...initial, onCommitment: undefined } });

    expect(() => reserve(awaiting, expected)).toThrow(
      "MARKET_CONNECTION_CHANGED"
    );
    expect(onCommitment).not.toHaveBeenCalled();
  });

  it("publishes an initially recovered live operation once", async () => {
    const live = operation({ state: ApiMarketOperationStateEnum.Live });
    const onPublished = jest.fn();

    renderIntent(
      options({
        initialOperation: live,
        operation: live,
        expected: request(),
        onPublished,
      })
    );

    await waitFor(() => expect(onPublished).toHaveBeenCalledTimes(1));
  });

  it("does not publish without a binding or for a different operation id", () => {
    const expected = request();
    const onPublished = jest.fn();
    renderIntent(
      options({
        operation: operation({ state: ApiMarketOperationStateEnum.Live }),
        expected,
        onPublished,
      })
    );
    expect(onPublished).not.toHaveBeenCalled();

    const bound = operation();
    const wrongId = operation({
      id: "operation-b",
      state: ApiMarketOperationStateEnum.Live,
      updated_at: 101,
    });
    renderIntent(
      options({
        initialOperation: bound,
        operation: wrongId,
        expected,
        onPublished,
      })
    );
    expect(onPublished).not.toHaveBeenCalled();
  });

  it.each([
    ApiMarketOperationStateEnum.Review,
    ApiMarketOperationStateEnum.AwaitingSignature,
    ApiMarketOperationStateEnum.Publishing,
    ApiMarketOperationStateEnum.Submitted,
  ])("does not publish a %s operation", (state) => {
    const onPublished = jest.fn();
    const pending = operation({ state });

    renderIntent(
      options({
        initialOperation: pending,
        operation: pending,
        expected: request(),
        onPublished,
      })
    );

    expect(onPublished).not.toHaveBeenCalled();
  });

  it("accepts confirmed as published and ignores older or same-time revisions", async () => {
    const onPublished = jest.fn();
    const initial = options({
      initialOperation: operation(),
      operation: operation({
        state: ApiMarketOperationStateEnum.Confirmed,
        updated_at: 200,
        revision: "revision-new",
      }),
      expected: request(),
      onPublished,
    });
    const { rerender } = renderIntent(initial);

    await waitFor(() => expect(onPublished).toHaveBeenCalledTimes(1));
    rerender({
      current: {
        ...initial,
        operation: operation({
          state: ApiMarketOperationStateEnum.Confirmed,
          updated_at: 199,
          revision: "revision-old",
        }),
      },
    });
    rerender({
      current: {
        ...initial,
        operation: operation({
          state: ApiMarketOperationStateEnum.Confirmed,
          updated_at: 200,
          revision: "revision-other",
        }),
      },
    });

    expect(onPublished).toHaveBeenCalledTimes(1);
  });

  it("does not publish a snapshot from a changed draft or actor", async () => {
    const expected = request();
    const onPublished = jest.fn();
    const initial = options({
      initialOperation: operation(),
      operation: operation({ state: ApiMarketOperationStateEnum.Live }),
      expected,
      onPublished,
    });
    const { rerender } = renderIntent(initial);

    await waitFor(() => expect(onPublished).toHaveBeenCalledTimes(1));
    rerender({
      current: {
        ...initial,
        profileId: PROFILE_B,
        draft: draft({ unitPriceEth: "0.2" }),
        expected: request({ profile_id: PROFILE_B }),
        operation: operation({
          state: ApiMarketOperationStateEnum.Live,
          order_hash: `${ORDER_HASH.slice(0, -1)}b`,
          updated_at: 201,
        }),
      },
    });

    expect(onPublished).toHaveBeenCalledTimes(1);
  });

  it("returns no guards for non-offer actions", () => {
    const { result } = renderIntent(options({ action: "buy" }));
    const expected = request();
    const active = operation();

    expect(() => result.current.guard(expected)).not.toThrow();
    expect(() => result.current.bind(active, expected)).not.toThrow();
  });
});
