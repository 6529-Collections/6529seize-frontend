import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useMarkWaveNotificationsRead } from "@/hooks/useMarkWaveNotificationsRead";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { getAuthJwt } from "@/services/auth/auth.utils";
import { renderHook, waitFor } from "@testing-library/react";
import { jwtDecode } from "jwt-decode";
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

jest.mock("jwt-decode", () => ({
  jwtDecode: jest.fn(),
}));

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
}

interface JwtPayload {
  readonly sub: string;
  readonly role: string | null;
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
const jwtDecodeMock = jwtDecode as jest.MockedFunction<typeof jwtDecode>;
const jwtPayloadsByToken = new Map<string, JwtPayload>();

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
  activeProfileProxyCreatorId,
  jwtAddress,
  jwtRole,
}: {
  readonly address?: string | undefined;
  readonly jwt?: string | null | undefined;
  readonly activeProfileProxyId?: string | null | undefined;
  readonly activeProfileProxyCreatorId?: string | null | undefined;
  readonly jwtAddress?: string | undefined;
  readonly jwtRole?: string | null | undefined;
}) => {
  const proxyCreatorId =
    activeProfileProxyId != null
      ? (activeProfileProxyCreatorId ?? activeProfileProxyId)
      : null;

  if (jwt && address) {
    jwtPayloadsByToken.set(jwt, {
      sub: jwtAddress ?? address,
      role: jwtRole !== undefined ? jwtRole : proxyCreatorId,
    });
  }

  useSeizeConnectContextMock.mockReturnValue({ address } as any);
  useAuthMock.mockReturnValue({
    activeProfileProxy: activeProfileProxyId
      ? { id: activeProfileProxyId, created_by: { id: proxyCreatorId } }
      : null,
  } as any);
  getAuthJwtMock.mockReturnValue(jwt ?? null);
};

describe("useMarkWaveNotificationsRead", () => {
  beforeEach(() => {
    apiPostMock.mockReset();
    jwtPayloadsByToken.clear();
    jwtDecodeMock.mockReset();
    jwtDecodeMock.mockImplementation((token) => {
      const payload = jwtPayloadsByToken.get(token);
      if (!payload) {
        throw new Error(`Unexpected JWT decode for ${token}`);
      }
      return payload as any;
    });
    setActiveIdentity({});
  });

  it("treats a missing active profile proxy as no proxy", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    useAuthMock.mockReturnValue({} as any);

    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    await expect(result.current("wave-1")).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
  });

  it("does not queue a read before the wallet address is known", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: undefined, jwt: null });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const noAddressPromise = result.current("wave-1");

    await expect(noAddressPromise).resolves.toBeUndefined();
    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();

    await expect(result.current("wave-1")).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("sends one trailing read after two calls for the same wave", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const firstPromise = result.current("wave-1");
    const secondPromise = result.current("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });

    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(apiPostMock).toHaveBeenLastCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
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

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
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

  it("uses the old account JWT when an old account callback runs after switching accounts", async () => {
    const invalidateNotifications = jest.fn();

    apiPostMock.mockResolvedValueOnce(undefined);

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const accountCallback = result.current;

    setActiveIdentity({ address: "0xBBB", jwt: "jwt-b" });
    rerender();

    expect(result.current).not.toBe(accountCallback);

    await accountCallback("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
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

  it("uses the old proxy JWT when an old proxy callback queues a trailing read after switching proxies", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

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

    const firstProxyPromise = firstProxyCallback("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-1" },
    });

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-2",
      activeProfileProxyId: "proxy-2",
    });
    rerender();

    expect(result.current).not.toBe(firstProxyCallback);

    const queuedProxyPromise = firstProxyCallback("wave-1");

    expect(queuedProxyPromise).toBe(firstProxyPromise);
    expect(apiPostMock).toHaveBeenCalledTimes(1);

    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-1" },
    });

    trailingRequest.resolve();

    await expect(firstProxyPromise).resolves.toBeUndefined();
    await expect(queuedProxyPromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });

  it("does not flush a cleared primary read with proxy auth", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-primary-old",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    setActiveIdentity({
      address: "0xAAA",
      jwt: null,
    });
    rerender();

    const queuedPromise = result.current("wave-1");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-1",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-primary-new",
    });
    rerender();

    await expect(queuedPromise).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-primary-new" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("flushes a cleared proxy read only when the same proxy is verified", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-1",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    setActiveIdentity({
      address: "0xAAA",
      jwt: null,
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    const queuedPromise = result.current("wave-1");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-2",
      activeProfileProxyId: "proxy-2",
      activeProfileProxyCreatorId: "creator-2",
    });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-1-new",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    await expect(queuedPromise).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-1-new" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("does not use another proxy auth for a stale callback from a cleared proxy", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-1",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const firstProxyCallback = result.current;

    setActiveIdentity({
      address: "0xAAA",
      jwt: null,
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-2",
      activeProfileProxyId: "proxy-2",
      activeProfileProxyCreatorId: "creator-2",
    });
    rerender();

    expect(result.current).not.toBe(firstProxyCallback);

    const queuedPromise = firstProxyCallback("wave-1");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-1-new",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    await expect(queuedPromise).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-1-new" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("does not move a cleared queued proxy read to another wallet address or proxy", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-a-proxy-1",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    setActiveIdentity({
      address: "0xAAA",
      jwt: null,
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    const firstAccountPromise = result.current("wave-1");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xBBB",
      jwt: "jwt-b-proxy-2",
      activeProfileProxyId: "proxy-2",
      activeProfileProxyCreatorId: "creator-2",
    });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-a-proxy-2",
      activeProfileProxyId: "proxy-2",
      activeProfileProxyCreatorId: "creator-2",
    });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-a-proxy-1-new",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    await expect(firstAccountPromise).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a-proxy-1-new" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("queues a trailing read after auth is cleared and uses the next verified JWT", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-old",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const firstProxyCallback = result.current;

    const firstProxyPromise = firstProxyCallback("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-old" },
    });

    setActiveIdentity({
      address: "0xAAA",
      jwt: null,
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    expect(result.current).toBe(firstProxyCallback);

    const queuedProxyPromise = firstProxyCallback("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(1);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-new",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    expect(apiPostMock).toHaveBeenCalledTimes(1);

    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-new" },
    });

    trailingRequest.resolve();

    await expect(firstProxyPromise).resolves.toBeUndefined();
    await expect(queuedProxyPromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });

  it("does not use cached headers after auth is cleared", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-old",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
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
      jwt: null,
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    expect(result.current).toBe(firstCallback);

    const queuedPromise = result.current("wave-1");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-new",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    await expect(queuedPromise).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-new" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("queues a read while the JWT is missing and sends it when the JWT is verified", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: "0xAAA", jwt: null });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const firstCallback = result.current;

    const queuedPromise = result.current("wave-1");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    expect(result.current).toBe(firstCallback);

    await expect(queuedPromise).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("queues a proxy read by JWT role until the matching proxy loads", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-loading",
      jwtRole: "creator-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const queuedPromise = result.current("wave-1");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-other",
      activeProfileProxyId: "proxy-2",
      activeProfileProxyCreatorId: "creator-2",
    });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-loading",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    await expect(queuedPromise).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-loading" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("collapses repeated queued same-wave reads into one request", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: "0xAAA", jwt: null });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const firstPromise = result.current("wave-1");
    const secondPromise = result.current("wave-1");
    const thirdPromise = result.current("wave-1");

    expect(secondPromise).toBe(firstPromise);
    expect(thirdPromise).toBe(firstPromise);
    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    await expect(firstPromise).resolves.toBeUndefined();
    await expect(secondPromise).resolves.toBeUndefined();
    await expect(thirdPromise).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("does not replace a cached account header with another account token", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const firstPromise = result.current("wave-1");

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-b",
      jwtAddress: "0xBBB",
    });
    rerender();

    const secondPromise = result.current("wave-1");

    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });

    trailingRequest.resolve();

    await expect(firstPromise).resolves.toBeUndefined();
    await expect(secondPromise).resolves.toBeUndefined();
  });

  it("queues a read when the JWT belongs to another account and sends it after the matching JWT appears", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-b",
      jwtAddress: "0xBBB",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const firstCallback = result.current;

    const queuedPromise = result.current("wave-1");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    expect(result.current).toBe(firstCallback);

    await expect(queuedPromise).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("keeps a queued account read separate when another account is verified first", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: "0xAAA", jwt: null });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const firstAccountPromise = result.current("wave-1");
    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xBBB", jwt: "jwt-b" });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    await expect(firstAccountPromise).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("does not replace a cached proxy header with another proxy token", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-1",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const firstPromise = result.current("wave-1");

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-2",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
      jwtRole: "creator-2",
    });
    rerender();

    const secondPromise = result.current("wave-1");

    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-1" },
    });

    trailingRequest.resolve();

    await expect(firstPromise).resolves.toBeUndefined();
    await expect(secondPromise).resolves.toBeUndefined();
  });

  it("queues a read when the JWT belongs to another proxy and sends it after the matching JWT appears", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-2",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
      jwtRole: "creator-2",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const firstCallback = result.current;

    const queuedPromise = result.current("wave-1");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-1",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    expect(result.current).toBe(firstCallback);

    await expect(queuedPromise).resolves.toBeUndefined();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-1" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
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

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
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

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
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

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const waveOnePromise = result.current("wave-1");
    const waveTwoPromise = result.current("wave-2");

    expect(apiPostMock).toHaveBeenCalledTimes(2);
    expect(apiPostMock).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-2/read",
      headers: { Authorization: "Bearer jwt-a" },
    });

    waveTwoRequest.resolve();

    await expect(waveTwoPromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);

    waveOneRequest.resolve();

    await expect(waveOnePromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });
});
