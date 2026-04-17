import { renderHook } from "@testing-library/react";

const useQueryMock = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: any) => useQueryMock(...args),
}));

const commonApiFetch = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: any) => commonApiFetch(...args),
}));

import { useWaveNotificationSubscription } from "@/hooks/useWaveNotificationSubscription";

describe("useWaveNotificationSubscription", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("configures useQuery with proper options", async () => {
    const wave: any = {
      id: "w1",
      metrics: { subscribers_count: 5 },
      subscribed_actions: ["DROP_CREATED"],
    };
    useQueryMock.mockReturnValue({ data: null });

    renderHook(() => useWaveNotificationSubscription(wave));

    const options = useQueryMock.mock.calls[0][0];
    expect(options.queryKey).toEqual(["wave-notification-subscription", "w1"]);
    await options.queryFn();
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "notifications/wave-subscription/w1",
    });
    expect(options.enabled).toBe(true);
    expect(options.retry(3, new Error())).toBe(false);
    expect(options.retry(2, new Error())).toBe(true);
    expect(options.retryDelay(2)).toBe(2000);
  });

  it("does not fetch preferences when the wave is not followed", () => {
    const wave: any = {
      id: "w1",
      metrics: { subscribers_count: 5 },
      subscribed_actions: [],
    };
    useQueryMock.mockReturnValue({ data: null });

    renderHook(() => useWaveNotificationSubscription(wave));

    const options = useQueryMock.mock.calls[0][0];
    expect(options.enabled).toBe(false);
  });

  it("fetches preferences even when all-drop notifications may be disabled by subscriber limits", () => {
    const wave: any = {
      id: "w1",
      metrics: { subscribers_count: 5000 },
      subscribed_actions: ["DROP_CREATED"],
    };
    useQueryMock.mockReturnValue({ data: null });

    renderHook(() => useWaveNotificationSubscription(wave));

    const options = useQueryMock.mock.calls[0][0];
    expect(options.enabled).toBe(true);
  });
});
