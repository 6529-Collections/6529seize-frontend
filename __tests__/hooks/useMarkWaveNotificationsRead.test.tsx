import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useMarkWaveNotificationsRead } from "@/hooks/useMarkWaveNotificationsRead";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { getAuthJwt } from "@/services/auth/auth.utils";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(),
}));

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
}

const createDeferred = (): Deferred => {
  let resolve: () => void = () => {};
  let reject: (error: unknown) => void = () => {};

  const promise = new Promise<void>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

const apiPostMock = commonApiPostWithoutBodyAndResponse as jest.MockedFunction<
  typeof commonApiPostWithoutBodyAndResponse
>;
const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;
const useSeizeConnectContextMock =
  useSeizeConnectContext as jest.MockedFunction<typeof useSeizeConnectContext>;
const getAuthJwtMock = getAuthJwt as jest.MockedFunction<typeof getAuthJwt>;

const createWrapper =
  (invalidateNotifications: jest.Mock) =>
  ({ children }: { readonly children: ReactNode }) => (
    <ReactQueryWrapperContext.Provider
      value={{ invalidateNotifications } as any}
    >
      {children}
    </ReactQueryWrapperContext.Provider>
  );

const setActiveIdentity = ({
  address,
  jwt,
  activeProfileProxyId,
}: {
  readonly address?: string | undefined;
  readonly jwt?: string | null | undefined;
  readonly activeProfileProxyId?: string | null | undefined;
}) => {
  useSeizeConnectContextMock.mockReturnValue({ address } as any);
  useAuthMock.mockReturnValue({
    activeProfileProxy: activeProfileProxyId
      ? { id: activeProfileProxyId }
      : null,
  } as any);
  getAuthJwtMock.mockReturnValue(jwt ?? null);
};

describe("useMarkWaveNotificationsRead", () => {
  beforeEach(() => {
    apiPostMock.mockReset();
    setActiveIdentity({});
  });

  it("sends one trailing read after two calls for the same wave", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const firstPromise = result.current("wave-1");
    const secondPromise = result.current("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
    });

    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(apiPostMock).toHaveBeenLastCalledWith({
      endpoint: "notifications/wave/wave-1/read",
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);

    trailingRequest.resolve();

    await expect(firstPromise).resolves.toBeUndefined();
    await expect(secondPromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });

  it("collapses repeated same-wave calls into one trailing read", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const promises = [
      result.current("wave-1"),
      result.current("wave-1"),
      result.current("wave-1"),
      result.current("wave-1"),
    ];

    expect(apiPostMock).toHaveBeenCalledTimes(1);

    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });

    trailingRequest.resolve();

    await Promise.all(promises);

    expect(apiPostMock).toHaveBeenCalledTimes(2);
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });

  it("keeps the callback stable across JWT refresh and uses the refreshed JWT", async () => {
    const invalidateNotifications = jest.fn();

    apiPostMock.mockResolvedValueOnce(undefined);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-old",
      activeProfileProxyId: "proxy-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const firstCallback = result.current;

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-new",
      activeProfileProxyId: "proxy-1",
    });
    rerender();

    expect(result.current).toBe(firstCallback);

    await result.current("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-new" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("uses a refreshed JWT for a trailing same-identity read", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-old",
      activeProfileProxyId: "proxy-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const firstCallback = result.current;

    const firstPromise = result.current("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-old" },
    });

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-new",
      activeProfileProxyId: "proxy-1",
    });
    rerender();

    expect(result.current).toBe(firstCallback);

    const secondPromise = result.current("wave-1");

    expect(secondPromise).toBe(firstPromise);
    expect(apiPostMock).toHaveBeenCalledTimes(1);

    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-new" },
    });

    trailingRequest.resolve();

    await expect(firstPromise).resolves.toBeUndefined();
    await expect(secondPromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });

  it("keeps same-wave read requests separate across active account switches", async () => {
    const firstAccountRequest = createDeferred();
    const secondAccountRequest = createDeferred();
    const firstAccountReplay = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstAccountRequest.promise)
      .mockReturnValueOnce(secondAccountRequest.promise)
      .mockReturnValueOnce(firstAccountReplay.promise);

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a-first" });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const firstAccountPromise = result.current("wave-1");

    setActiveIdentity({ address: "0xBBB", jwt: "jwt-b" });
    rerender();
    const secondAccountPromise = result.current("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(2);
    expect(apiPostMock).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a-first" },
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-b" },
    });

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a-later" });
    rerender();
    const firstAccountQueuedPromise = result.current("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(2);

    firstAccountRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(3);
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(3, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a-later" },
    });

    secondAccountRequest.resolve();
    firstAccountReplay.resolve();

    await expect(firstAccountPromise).resolves.toBeUndefined();
    await expect(firstAccountQueuedPromise).resolves.toBeUndefined();
    await expect(secondAccountPromise).resolves.toBeUndefined();
  });

  it("keeps same-wave read requests separate across active proxy switches", async () => {
    const firstProxyRequest = createDeferred();
    const secondProxyRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstProxyRequest.promise)
      .mockReturnValueOnce(secondProxyRequest.promise);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-1",
      activeProfileProxyId: "proxy-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const firstProxyCallback = result.current;

    const firstProxyPromise = result.current("wave-1");

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-2",
      activeProfileProxyId: "proxy-2",
    });
    rerender();

    expect(result.current).not.toBe(firstProxyCallback);

    const secondProxyPromise = result.current("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(2);
    expect(apiPostMock).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-1" },
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-2" },
    });

    firstProxyRequest.resolve();
    secondProxyRequest.resolve();

    await expect(firstProxyPromise).resolves.toBeUndefined();
    await expect(secondProxyPromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });

  it("uses the original active account auth header for a trailing read after switching accounts", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    setActiveIdentity({ address: "0xBBB", jwt: "jwt-b" });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const firstPromise = result.current("wave-1");
    const secondPromise = result.current("wave-1");

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();
    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-b" },
    });

    trailingRequest.resolve();

    await expect(firstPromise).resolves.toBeUndefined();
    await expect(secondPromise).resolves.toBeUndefined();
  });

  it("resolves queued same-wave calls when a failed first read is replayed successfully", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const firstPromise = result.current("wave-1");
    const secondPromise = result.current("wave-1");

    firstRequest.reject(new Error("first read failed"));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(invalidateNotifications).not.toHaveBeenCalled();

    trailingRequest.resolve();

    await expect(firstPromise).resolves.toBeUndefined();
    await expect(secondPromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("rejects a failed read when no replay is queued", async () => {
    const readError = new Error("read failed");
    const invalidateNotifications = jest.fn();

    apiPostMock.mockRejectedValueOnce(readError);

    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    await expect(result.current("wave-1")).rejects.toBe(readError);
    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("reads different waves independently", async () => {
    const waveOneRequest = createDeferred();
    const waveTwoRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock.mockImplementation(({ endpoint }) => {
      if (endpoint === "notifications/wave/wave-1/read") {
        return waveOneRequest.promise;
      }

      return waveTwoRequest.promise;
    });

    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const waveOnePromise = result.current("wave-1");
    const waveTwoPromise = result.current("wave-2");

    expect(apiPostMock).toHaveBeenCalledTimes(2);
    expect(apiPostMock).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-1/read",
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-2/read",
    });

    waveTwoRequest.resolve();

    await expect(waveTwoPromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);

    waveOneRequest.resolve();

    await expect(waveOnePromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });
});
