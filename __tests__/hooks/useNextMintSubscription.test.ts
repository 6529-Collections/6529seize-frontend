import { act, renderHook } from "@testing-library/react";

const useQueryMock = jest.fn();
const invalidateQueriesMock = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: any[]) => useQueryMock(...args),
  useQueryClient: () => ({
    invalidateQueries: invalidateQueriesMock,
  }),
}));

const commonApiFetchMock = jest.fn();
const commonApiPostMock = jest.fn();

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: any[]) => commonApiFetchMock(...args),
  commonApiPost: (...args: any[]) => commonApiPostMock(...args),
}));

const useAuthMock = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => useAuthMock(),
}));

import { useNextMintSubscription } from "@/hooks/useNextMintSubscription";

describe("useNextMintSubscription", () => {
  const defaultSubscription = {
    consolidation_key: "test-key",
    contract: "0x123",
    token_id: 101,
    subscribed: true,
    subscribed_count: 1,
  };

  const requestAuthMock = jest.fn();
  const setToastMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    requestAuthMock.mockResolvedValue({ success: true });
    useAuthMock.mockReturnValue({
      connectedProfile: {
        consolidation_key: "test-key",
        wallets: [{ wallet: "0xabc" }],
      },
      activeProfileProxy: null,
      requestAuth: requestAuthMock,
      setToast: setToastMock,
    });
    useQueryMock.mockReturnValue({
      data: defaultSubscription,
      isLoading: false,
    });
  });

  it("configures query and fetches next upcoming subscription", async () => {
    commonApiFetchMock.mockResolvedValue([defaultSubscription]);

    renderHook(() => useNextMintSubscription());

    const queryConfig = useQueryMock.mock.calls[0][0];
    expect(queryConfig.queryKey).toEqual([
      "next-mint-subscription",
      "test-key",
    ]);
    expect(queryConfig.enabled).toBe(true);

    const data = await queryConfig.queryFn();
    expect(data).toEqual(defaultSubscription);
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint:
        "subscriptions/consolidation/upcoming-memes/test-key?card_count=1",
    });
  });

  it("toggles subscription and invalidates query on success", async () => {
    commonApiPostMock.mockResolvedValue({
      consolidation_key: "test-key",
      contract: "0x123",
      token_id: 101,
      subscribed: false,
      subscribed_count: 1,
    });

    const { result } = renderHook(() => useNextMintSubscription());

    await act(async () => {
      await result.current.toggleSubscription();
    });

    expect(requestAuthMock).toHaveBeenCalledTimes(1);
    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: "subscriptions/test-key/subscription",
      body: {
        contract: "0x123",
        token_id: 101,
        subscribed: false,
      },
    });
    expect(setToastMock).toHaveBeenCalledWith({
      message: "Unsubscribed from The Memes #101",
      type: "success",
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["next-mint-subscription", "test-key"],
    });
  });

  it("fetches upcoming subscription during toggle when query data is missing", async () => {
    useQueryMock.mockReturnValue({
      data: null,
      isLoading: false,
    });
    commonApiFetchMock.mockResolvedValue([
      {
        ...defaultSubscription,
        subscribed: false,
      },
    ]);
    commonApiPostMock.mockResolvedValue({
      consolidation_key: "test-key",
      contract: "0x123",
      token_id: 101,
      subscribed: true,
      subscribed_count: 1,
    });

    const { result } = renderHook(() => useNextMintSubscription());

    await act(async () => {
      await result.current.toggleSubscription();
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint:
        "subscriptions/consolidation/upcoming-memes/test-key?card_count=1",
    });
    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: "subscriptions/test-key/subscription",
      body: {
        contract: "0x123",
        token_id: 101,
        subscribed: true,
      },
    });
  });

  it("ignores concurrent toggles while a mutation is in flight", async () => {
    let resolveAuth: (value: { success: boolean }) => void = () => {};
    requestAuthMock.mockReturnValue(
      new Promise<{ success: boolean }>((resolve) => {
        resolveAuth = resolve;
      })
    );
    commonApiPostMock.mockResolvedValue({
      consolidation_key: "test-key",
      contract: "0x123",
      token_id: 101,
      subscribed: false,
      subscribed_count: 1,
    });

    const { result } = renderHook(() => useNextMintSubscription());

    let firstTogglePromise = Promise.resolve();
    let secondTogglePromise = Promise.resolve();

    act(() => {
      firstTogglePromise = result.current.toggleSubscription();
      secondTogglePromise = result.current.toggleSubscription();
    });

    expect(requestAuthMock).toHaveBeenCalledTimes(1);

    resolveAuth({ success: true });

    await act(async () => {
      await Promise.all([firstTogglePromise, secondTogglePromise]);
    });

    expect(commonApiPostMock).toHaveBeenCalledTimes(1);
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(1);
  });

  it("does not mutate when authentication fails", async () => {
    requestAuthMock.mockResolvedValue({ success: false });

    const { result } = renderHook(() => useNextMintSubscription());

    await act(async () => {
      await result.current.toggleSubscription();
    });

    expect(commonApiPostMock).not.toHaveBeenCalled();
    expect(invalidateQueriesMock).not.toHaveBeenCalled();
  });
});
