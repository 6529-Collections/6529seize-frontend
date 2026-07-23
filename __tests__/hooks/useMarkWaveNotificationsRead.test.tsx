import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  useMarkWaveNotificationsRead,
  useWaveNotificationsReadMarkerState,
} from "@/hooks/useMarkWaveNotificationsRead";
import {
  getWaveReadIdentityKey,
  getWaveReadProxyRoleIdentityKey,
  getWaveReadProxyRoleRequestKey,
  getWaveReadRequestKey,
} from "@/hooks/useMarkWaveNotificationsRead.identity";
import type { WaveReadVerifiedIdentity } from "@/hooks/useMarkWaveNotificationsRead.identity";
import {
  clearAllWaveReadState,
  enqueuePendingWaveReadRequest,
  flushPendingClearedWaveReadRequests,
  flushPendingWaveReadRequests,
  markWaveReadIdentityCleared,
} from "@/hooks/useMarkWaveNotificationsRead.requests";
import type { WaveReadAddressEpoch } from "@/hooks/useMarkWaveNotificationsRead.types";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { getAuthJwt } from "@/services/auth/auth.utils";
import { act, renderHook, waitFor } from "@testing-library/react";
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
  readonly exp?: number | undefined;
}

const getCurrentJwtSecond = (): number => Math.floor(Date.now() / 1000);

const getFutureJwtExp = (): number => getCurrentJwtSecond() + 60;

const mockCurrentJwtSecond = (currentSecond: number) =>
  jest.spyOn(Date, "now").mockReturnValue(currentSecond * 1000);

const createDeferred = (): Deferred => {
  let resolve: () => void = () => {};
  let reject: (error: unknown) => void = () => {};

  const promise = new Promise<void>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

const flushMicrotasks = async (): Promise<void> => {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
};

const trackPromiseSettlement = (
  promise: Promise<unknown>
): { readonly isSettled: () => boolean } => {
  let settled = false;
  void promise.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    }
  );

  return {
    isSettled: () => settled,
  };
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
      value={{ invalidateWaveReadState: invalidateNotifications } as any}
    >
      {children}
    </ReactQueryWrapperContext.Provider>
  );

const setActiveIdentity = ({
  address,
  jwt,
  connectedProfileId,
  activeProfileProxyId,
  activeProfileProxyCreatorId,
  jwtAddress,
  jwtRole,
  jwtExp,
  jwtHasExp,
}: {
  readonly address?: string | undefined;
  readonly jwt?: string | null | undefined;
  readonly connectedProfileId?: string | null | undefined;
  readonly activeProfileProxyId?: string | null | undefined;
  readonly activeProfileProxyCreatorId?: string | null | undefined;
  readonly jwtAddress?: string | undefined;
  readonly jwtRole?: string | null | undefined;
  readonly jwtExp?: number | undefined;
  readonly jwtHasExp?: boolean | undefined;
}) => {
  const proxyCreatorId =
    activeProfileProxyId != null
      ? (activeProfileProxyCreatorId ?? activeProfileProxyId)
      : null;

  if (jwt && address) {
    const payload: JwtPayload = {
      sub: jwtAddress ?? address,
      role: jwtRole !== undefined ? jwtRole : proxyCreatorId,
      ...((jwtHasExp ?? true) ? { exp: jwtExp ?? getFutureJwtExp() } : {}),
    };
    jwtPayloadsByToken.set(jwt, payload);
  }

  useSeizeConnectContextMock.mockReturnValue({ address } as any);
  useAuthMock.mockReturnValue({
    connectedProfile: connectedProfileId ? { id: connectedProfileId } : null,
    activeProfileProxy: activeProfileProxyId
      ? { id: activeProfileProxyId, created_by: { id: proxyCreatorId } }
      : null,
  } as any);
  getAuthJwtMock.mockReturnValue(jwt ?? null);
};

const createAddressEpochState = (): {
  readonly addressEpoch: WaveReadAddressEpoch;
  readonly latestAddressEpochRef: { current: WaveReadAddressEpoch };
} => {
  const addressEpoch = {};
  return {
    addressEpoch,
    latestAddressEpochRef: { current: addressEpoch },
  };
};

const createVerifiedIdentity = ({
  addressKey = "0xaaa",
  activeProfileProxyId = null,
  activeProfileProxyCreatorId = null,
  identityKey = getWaveReadIdentityKey({ addressKey, activeProfileProxyId }),
  jwt = "jwt-a",
}: {
  readonly addressKey?: string | undefined;
  readonly activeProfileProxyId?: string | null | undefined;
  readonly activeProfileProxyCreatorId?: string | null | undefined;
  readonly identityKey?: string | undefined;
  readonly jwt?: string | undefined;
} = {}): WaveReadVerifiedIdentity => ({
  addressKey,
  activeProfileProxyId,
  activeProfileProxyCreatorId,
  identityKey,
  jwtExpiresAt: getFutureJwtExp(),
  authHeaders: { Authorization: `Bearer ${jwt}` },
});

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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("treats a missing active profile proxy as no proxy", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    useAuthMock.mockReturnValue({} as any);

    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    await expect(result.current("wave-1")).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
  });

  it("treats the connected profile's own JWT role as primary auth when no proxy is active", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-own-role",
      connectedProfileId: "profile-1",
      jwtRole: "profile-1",
    });

    const { result } = renderHook(() => useWaveNotificationsReadMarkerState(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    expect(result.current.proxyRoleIdentityKey).toBeNull();

    await expect(
      result.current.markWaveNotificationsRead("wave-own-role")
    ).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-own-role/read",
      headers: { Authorization: "Bearer jwt-own-role" },
    });
  });

  it("does not treat a different JWT role as primary auth when no proxy is active", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-other-role",
      connectedProfileId: "profile-1",
      jwtRole: "creator-1",
    });

    const { result } = renderHook(() => useWaveNotificationsReadMarkerState(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    expect(result.current.proxyRoleIdentityKey).toBe(
      getWaveReadProxyRoleIdentityKey({
        addressKey: "0xaaa",
        proxyCreatorId: "creator-1",
      })
    );

    await expect(
      result.current.markWaveNotificationsRead("wave-other-role", {
        queueIfBlocked: false,
      })
    ).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();
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

    await expect(noAddressPromise).resolves.toBe("skipped");
    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();

    await expect(result.current("wave-1")).resolves.toBe("sent");

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

    await expect(firstPromise).resolves.toBe("sent");
    await expect(secondPromise).resolves.toBe("sent");
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

    await expect(Promise.all(promises)).resolves.toEqual([
      "sent",
      "sent",
      "sent",
      "sent",
    ]);

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

    await expect(result.current("wave-1")).resolves.toBe("sent");

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

    await expect(firstPromise).resolves.toBe("sent");
    await expect(secondPromise).resolves.toBe("sent");
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });

  it("skips an old cached account callback after switching accounts", async () => {
    const invalidateNotifications = jest.fn();

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

    await expect(accountCallback("wave-1")).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("skips an old cached account callback after switching accounts when queueing is disabled", async () => {
    const invalidateNotifications = jest.fn();

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

    await expect(
      accountCallback("wave-1", { queueIfBlocked: false })
    ).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("keeps same-wave read requests separate across active account switches", async () => {
    const firstAccountRequest = createDeferred();
    const secondAccountRequest = createDeferred();
    const firstAccountLaterRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstAccountRequest.promise)
      .mockReturnValueOnce(secondAccountRequest.promise)
      .mockReturnValueOnce(firstAccountLaterRequest.promise);

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

    expect(apiPostMock).toHaveBeenCalledTimes(3);
    expect(apiPostMock).toHaveBeenNthCalledWith(3, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a-later" },
    });

    firstAccountRequest.resolve();
    secondAccountRequest.resolve();
    firstAccountLaterRequest.resolve();

    await expect(firstAccountPromise).resolves.toBe("sent");
    await expect(firstAccountQueuedPromise).resolves.toBe("sent");
    await expect(secondAccountPromise).resolves.toBe("sent");
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

    await expect(firstProxyPromise).resolves.toBe("sent");
    await expect(secondProxyPromise).resolves.toBe("sent");
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

    await expect(firstProxyPromise).resolves.toBe("sent");
    await expect(queuedProxyPromise).resolves.toBe("sent");
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

    await expect(queuedPromise).resolves.toBe("sent");

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

    await expect(queuedPromise).resolves.toBe("sent");

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

    await expect(queuedPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-1-new" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("skips a cleared queued proxy read on wallet address switch", async () => {
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
    const skipped = expect(firstAccountPromise).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xBBB",
      jwt: "jwt-b-proxy-2",
      activeProfileProxyId: "proxy-2",
      activeProfileProxyCreatorId: "creator-2",
    });
    rerender();

    await skipped;

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

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
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

    await expect(firstProxyPromise).resolves.toBe("sent");
    await expect(queuedProxyPromise).resolves.toBe("sent");
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

    await expect(queuedPromise).resolves.toBe("sent");

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

    await expect(queuedPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("does not send a read with a JWT that is missing exp", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-missing-exp",
      jwtHasExp: false,
    });
    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    await expect(
      result.current("wave-missing-exp", { queueIfBlocked: false })
    ).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("does not send a read with an expired JWT", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-expired",
      jwtExp: getCurrentJwtSecond(),
    });
    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    await expect(
      result.current("wave-expired", { queueIfBlocked: false })
    ).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("sends a queued read after an expired JWT is replaced by a fresh JWT", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-expired",
      jwtExp: getCurrentJwtSecond(),
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const queuedPromise = result.current("wave-expired-replaced");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-fresh" });
    rerender();

    await expect(queuedPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-expired-replaced/read",
      headers: { Authorization: "Bearer jwt-fresh" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("skips an account read when cached JWT expires and queueing is disabled", async () => {
    const invalidateNotifications = jest.fn();
    const currentSecond = 1_700_000_000;
    const jwtExpiresAt = currentSecond + 10;
    const dateNowSpy = mockCurrentJwtSecond(currentSecond);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-cached",
      jwtExp: jwtExpiresAt,
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    dateNowSpy.mockReturnValue(jwtExpiresAt * 1000);

    await expect(
      result.current("wave-cached-expired", { queueIfBlocked: false })
    ).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-fresh",
      jwtExp: jwtExpiresAt + 60,
    });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("queues an account read after cached JWT expiry and flushes it with a fresh JWT", async () => {
    const invalidateNotifications = jest.fn();
    const currentSecond = 1_700_000_100;
    const jwtExpiresAt = currentSecond + 10;
    const dateNowSpy = mockCurrentJwtSecond(currentSecond);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-old",
      jwtExp: jwtExpiresAt,
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    dateNowSpy.mockReturnValue(jwtExpiresAt * 1000);

    const queuedPromise = result.current("wave-cached-refresh");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-fresh",
      jwtExp: jwtExpiresAt + 60,
    });
    rerender();

    await expect(queuedPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-cached-refresh/read",
      headers: { Authorization: "Bearer jwt-fresh" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("queues a proxy-role read after cached proxy JWT expiry and flushes it with a fresh proxy JWT", async () => {
    const invalidateNotifications = jest.fn();
    const currentSecond = 1_700_000_200;
    const jwtExpiresAt = currentSecond + 10;
    const dateNowSpy = mockCurrentJwtSecond(currentSecond);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-old",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
      jwtExp: jwtExpiresAt,
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    dateNowSpy.mockReturnValue(jwtExpiresAt * 1000);
    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-role-fresh",
      jwtRole: "creator-1",
      jwtExp: jwtExpiresAt + 60,
    });
    rerender();

    const queuedPromise = result.current("wave-proxy-cached-expired");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-fresh",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
      jwtExp: jwtExpiresAt + 60,
    });
    rerender();

    await expect(queuedPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-proxy-cached-expired/read",
      headers: { Authorization: "Bearer jwt-proxy-fresh" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("skips a queued read when the wallet disconnects", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: "0xAAA", jwt: null });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const queuedPromise = result.current("wave-disconnect");
    const skipped = expect(queuedPromise).resolves.toBe("skipped");

    setActiveIdentity({ address: undefined, jwt: null });
    rerender();

    await skipped;

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("skips a queued read when the wallet address switches", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: "0xAAA", jwt: null });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const queuedPromise = result.current("wave-address-switch");
    const skipped = expect(queuedPromise).resolves.toBe("skipped");

    setActiveIdentity({ address: "0xBBB", jwt: "jwt-b" });
    rerender();

    await skipped;

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("skips queued reads when the last marker hook unmounts", async () => {
    jest.useFakeTimers();
    const invalidateNotifications = jest.fn();

    try {
      setActiveIdentity({ address: "0xAAA", jwt: null });
      const { result, unmount } = renderHook(
        () => useMarkWaveNotificationsRead(),
        {
          wrapper: createWrapper(invalidateNotifications),
        }
      );

      const queuedPromise = result.current("wave-last-unmount");
      const queuedSettlement = trackPromiseSettlement(queuedPromise);
      const skipped = expect(queuedPromise).resolves.toBe("skipped");

      unmount();
      await flushMicrotasks();

      expect(queuedSettlement.isSettled()).toBe(false);

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await skipped;

      expect(apiPostMock).not.toHaveBeenCalled();
      expect(invalidateNotifications).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps queued reads when one marker hook unmounts and another remains mounted", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: "0xAAA", jwt: null });
    const firstHook = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });
    const secondHook = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const queuedPromise = firstHook.result.current("wave-one-unmount");
    const resolved = expect(queuedPromise).resolves.toBe("sent");

    firstHook.unmount();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    secondHook.rerender();

    await resolved;

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-one-unmount/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("keeps queued reads when a marker hook remounts before deferred cleanup runs", async () => {
    jest.useFakeTimers();
    const invalidateNotifications = jest.fn();

    try {
      setActiveIdentity({ address: "0xAAA", jwt: null });
      const firstHook = renderHook(() => useMarkWaveNotificationsRead(), {
        wrapper: createWrapper(invalidateNotifications),
      });

      const queuedPromise = firstHook.result.current("wave-remount");
      const queuedSettlement = trackPromiseSettlement(queuedPromise);
      const resolved = expect(queuedPromise).resolves.toBe("sent");

      firstHook.unmount();

      const secondHook = renderHook(() => useMarkWaveNotificationsRead(), {
        wrapper: createWrapper(invalidateNotifications),
      });

      act(() => {
        jest.runOnlyPendingTimers();
      });
      await flushMicrotasks();

      expect(queuedSettlement.isSettled()).toBe(false);
      expect(apiPostMock).not.toHaveBeenCalled();

      setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
      secondHook.rerender();

      await resolved;

      expect(apiPostMock).toHaveBeenCalledTimes(1);
      expect(apiPostMock).toHaveBeenCalledWith({
        endpoint: "notifications/wave/wave-remount/read",
        headers: { Authorization: "Bearer jwt-a" },
      });
      expect(invalidateNotifications).toHaveBeenCalledTimes(1);

      secondHook.unmount();
      act(() => {
        jest.runOnlyPendingTimers();
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it("skips queued reads when a different wallet remounts before deferred cleanup runs", async () => {
    jest.useFakeTimers();
    const invalidateNotifications = jest.fn();

    try {
      setActiveIdentity({ address: "0xAAA", jwt: null });
      const firstHook = renderHook(() => useMarkWaveNotificationsRead(), {
        wrapper: createWrapper(invalidateNotifications),
      });

      const queuedPromise = firstHook.result.current(
        "wave-remount-address-switch"
      );
      const skipped = expect(queuedPromise).resolves.toBe("skipped");

      firstHook.unmount();

      setActiveIdentity({ address: "0xBBB", jwt: null });
      const secondHook = renderHook(() => useMarkWaveNotificationsRead(), {
        wrapper: createWrapper(invalidateNotifications),
      });

      await skipped;

      act(() => {
        jest.runOnlyPendingTimers();
      });
      await flushMicrotasks();

      expect(apiPostMock).not.toHaveBeenCalled();

      setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
      secondHook.rerender();
      await flushMicrotasks();

      expect(apiPostMock).not.toHaveBeenCalled();
      expect(invalidateNotifications).not.toHaveBeenCalled();

      secondHook.unmount();
      act(() => {
        jest.runOnlyPendingTimers();
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it("drops a queued missing-JWT read when its guard becomes false before replay", async () => {
    const invalidateNotifications = jest.fn();
    let shouldSend = true;

    setActiveIdentity({ address: "0xAAA", jwt: null });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const queuedPromise = result.current("wave-guard-missing-jwt", {
      shouldSend: () => shouldSend,
    });

    expect(apiPostMock).not.toHaveBeenCalled();

    shouldSend = false;
    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    await expect(queuedPromise).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("sends one merged queued read when at least one guard still allows it", async () => {
    const invalidateNotifications = jest.fn();
    let firstShouldSend = true;
    let secondShouldSend = true;

    setActiveIdentity({ address: "0xAAA", jwt: null });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const firstPromise = result.current("wave-guard-merged", {
      shouldSend: () => firstShouldSend,
    });
    const secondPromise = result.current("wave-guard-merged", {
      shouldSend: () => secondShouldSend,
    });

    expect(secondPromise).toBe(firstPromise);
    expect(apiPostMock).not.toHaveBeenCalled();

    firstShouldSend = false;
    secondShouldSend = true;
    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    await expect(firstPromise).resolves.toBe("sent");
    await expect(secondPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-guard-merged/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("drops a trailing same-wave replay when its guard becomes false", async () => {
    const firstRequest = createDeferred();
    const invalidateNotifications = jest.fn();
    let shouldSendReplay = true;

    apiPostMock.mockReturnValueOnce(firstRequest.promise);

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const firstPromise = result.current("wave-guard-trailing");
    const trailingPromise = result.current("wave-guard-trailing", {
      shouldSend: () => shouldSendReplay,
    });

    expect(trailingPromise).toBe(firstPromise);
    expect(apiPostMock).toHaveBeenCalledTimes(1);

    shouldSendReplay = false;
    firstRequest.resolve();

    await expect(firstPromise).resolves.toBe("sent");
    await expect(trailingPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("does not queue a blocked read when queueIfBlocked is false", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: "0xAAA", jwt: null });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const blockedPromise = result.current("wave-no-queue", {
      queueIfBlocked: false,
    });

    await expect(blockedPromise).resolves.toBe("skipped");
    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
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

    await expect(queuedPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-loading" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("waits for fresh auth when proxy data loads after the role JWT expires", async () => {
    const invalidateNotifications = jest.fn();
    const currentSecond = 1_700_000_300;
    const jwtExpiresAt = currentSecond + 10;
    const dateNowSpy = mockCurrentJwtSecond(currentSecond);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-loading-old",
      jwtRole: "creator-1",
      jwtExp: jwtExpiresAt,
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const queuedPromise = result.current("wave-proxy-load-after-expiry");
    const queuedSettlement = trackPromiseSettlement(queuedPromise);

    expect(apiPostMock).not.toHaveBeenCalled();

    dateNowSpy.mockReturnValue(jwtExpiresAt * 1000);
    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-loading-old",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
      jwtExp: jwtExpiresAt,
    });
    rerender();
    await flushMicrotasks();

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(queuedSettlement.isSettled()).toBe(false);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-loading-fresh",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
      jwtExp: jwtExpiresAt + 60,
    });
    rerender();

    await expect(queuedPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-proxy-load-after-expiry/read",
      headers: { Authorization: "Bearer jwt-proxy-loading-fresh" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("flushes a requeued trailing same-wave read when fresh auth is already cached", async () => {
    const firstRequest = createDeferred();
    const invalidateNotifications = jest.fn();
    const currentSecond = 1_700_000_350;
    const oldJwtExpiresAt = currentSecond + 10;
    const freshJwtExpiresAt = oldJwtExpiresAt + 60;
    const dateNowSpy = mockCurrentJwtSecond(currentSecond);

    apiPostMock.mockReturnValueOnce(firstRequest.promise);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-requeued-old",
      jwtExp: oldJwtExpiresAt,
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const firstPromise = result.current("wave-requeued-cached-auth");
    const firstSettlement = trackPromiseSettlement(firstPromise);

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-requeued-cached-auth/read",
      headers: { Authorization: "Bearer jwt-requeued-old" },
    });

    const queuedPromise = result.current("wave-requeued-cached-auth");
    const queuedSettlement = trackPromiseSettlement(queuedPromise);

    expect(apiPostMock).toHaveBeenCalledTimes(1);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-requeued-fresh",
      jwtExp: freshJwtExpiresAt,
    });
    rerender();
    await flushMicrotasks();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(firstSettlement.isSettled()).toBe(false);
    expect(queuedSettlement.isSettled()).toBe(false);

    dateNowSpy.mockReturnValue(oldJwtExpiresAt * 1000);
    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-requeued-cached-auth/read",
      headers: { Authorization: "Bearer jwt-requeued-fresh" },
    });

    await expect(firstPromise).resolves.toBe("sent");
    await expect(queuedPromise).resolves.toBe("sent");
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });

  it("requeues a trailing same-wave read when fresh auth expires before the trailing send", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();
    const currentSecond = 1_700_000_400;
    const oldJwtExpiresAt = currentSecond + 10;
    const temporaryJwtExpiresAt = oldJwtExpiresAt + 10;
    const dateNowSpy = mockCurrentJwtSecond(currentSecond);

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-trailing-old",
      jwtExp: oldJwtExpiresAt,
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const firstPromise = result.current("wave-trailing-expiry");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-trailing-expiry/read",
      headers: { Authorization: "Bearer jwt-trailing-old" },
    });

    dateNowSpy.mockReturnValue(oldJwtExpiresAt * 1000);
    const queuedPromise = result.current("wave-trailing-expiry");
    const firstSettlement = trackPromiseSettlement(firstPromise);
    const queuedSettlement = trackPromiseSettlement(queuedPromise);

    expect(apiPostMock).toHaveBeenCalledTimes(1);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-trailing-temporary",
      jwtExp: temporaryJwtExpiresAt,
    });
    rerender();
    await flushMicrotasks();

    expect(apiPostMock).toHaveBeenCalledTimes(1);

    dateNowSpy.mockReturnValue(temporaryJwtExpiresAt * 1000);
    firstRequest.resolve();
    await flushMicrotasks();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(firstSettlement.isSettled()).toBe(false);
    expect(queuedSettlement.isSettled()).toBe(false);

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-trailing-newest",
      jwtExp: temporaryJwtExpiresAt + 60,
    });
    rerender();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-trailing-expiry/read",
      headers: { Authorization: "Bearer jwt-trailing-newest" },
    });

    trailingRequest.resolve();

    await expect(firstPromise).resolves.toBe("sent");
    await expect(queuedPromise).resolves.toBe("sent");
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });

  it("does not create a proxy-role identity from an expired JWT role", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-expired-role",
      jwtRole: "creator-1",
      jwtExp: getCurrentJwtSecond(),
    });
    const { result } = renderHook(() => useWaveNotificationsReadMarkerState(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    expect(result.current.proxyRoleIdentityKey).toBeNull();
    await expect(
      result.current.markWaveNotificationsRead("wave-expired-role", {
        queueIfBlocked: false,
      })
    ).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("drops a queued proxy-role read when its guard becomes stale before the proxy loads", async () => {
    const invalidateNotifications = jest.fn();
    let shouldSend = true;

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

    const queuedPromise = result.current("wave-proxy-guard-stale", {
      shouldSend: () => shouldSend,
    });

    expect(apiPostMock).not.toHaveBeenCalled();

    shouldSend = false;
    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-loading",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    await expect(queuedPromise).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("keeps a queued proxy-role read tied to the JWT role that created its callback", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-role-1",
      jwtRole: "creator-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const creatorOneCallback = result.current;

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-role-2",
      jwtRole: "creator-2",
    });
    rerender();

    expect(result.current).not.toBe(creatorOneCallback);

    const queuedPromise = creatorOneCallback("wave-1");

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
      jwt: "jwt-proxy-1",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    await expect(queuedPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-1" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("skips an old temporary proxy-role callback after wallet address switch", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-role-1",
      jwtRole: "creator-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const oldRoleCallback = result.current;

    setActiveIdentity({ address: "0xBBB", jwt: "jwt-b" });
    rerender();

    expect(result.current).not.toBe(oldRoleCallback);

    await expect(oldRoleCallback("wave-1")).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-1",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("flushes queued proxy-role and loaded-proxy reads for the same wave with one request", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-role-1",
      jwtRole: "creator-1",
    });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const roleQueuedPromise = result.current("wave-1");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: null,
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    const proxyQueuedPromise = result.current("wave-1");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({
      address: "0xAAA",
      jwt: "jwt-proxy-1",
      activeProfileProxyId: "proxy-1",
      activeProfileProxyCreatorId: "creator-1",
    });
    rerender();

    await expect(roleQueuedPromise).resolves.toBe("sent");
    await expect(proxyQueuedPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-1" },
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

    await expect(firstPromise).resolves.toBe("sent");
    await expect(secondPromise).resolves.toBe("sent");
    await expect(thirdPromise).resolves.toBe("sent");

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

    await expect(firstPromise).resolves.toBe("sent");
    await expect(secondPromise).resolves.toBe("sent");
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

    await expect(queuedPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-a" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("skips an old missing-auth account callback after wallet address switch", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: "0xAAA", jwt: null });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );
    const oldAccountCallback = result.current;

    setActiveIdentity({ address: "0xBBB", jwt: "jwt-b" });
    rerender();

    expect(result.current).not.toBe(oldAccountCallback);

    await expect(oldAccountCallback("wave-1")).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("does not replay a queued account read after the wallet address switches back", async () => {
    const invalidateNotifications = jest.fn();

    setActiveIdentity({ address: "0xAAA", jwt: null });
    const { result, rerender } = renderHook(
      () => useMarkWaveNotificationsRead(),
      {
        wrapper: createWrapper(invalidateNotifications),
      }
    );

    const firstAccountPromise = result.current("wave-1");
    const skipped = expect(firstAccountPromise).resolves.toBe("skipped");

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xBBB", jwt: "jwt-b" });
    rerender();

    await skipped;

    expect(apiPostMock).not.toHaveBeenCalled();

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    rerender();

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
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

    await expect(firstPromise).resolves.toBe("sent");
    await expect(secondPromise).resolves.toBe("sent");
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

    await expect(queuedPromise).resolves.toBe("sent");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer jwt-proxy-1" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("does not send a trailing same-wave read after switching accounts", async () => {
    const firstRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock.mockReturnValueOnce(firstRequest.promise);

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

    await expect(firstPromise).resolves.toBe("sent");
    await expect(secondPromise).resolves.toBe("sent");
    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
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

    await expect(firstPromise).resolves.toBe("sent");
    await expect(secondPromise).resolves.toBe("sent");
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("rejects a failed read when its queued replay is skipped", async () => {
    const firstRequest = createDeferred();
    const readError = new Error("first read failed");
    const invalidateNotifications = jest.fn();
    let shouldSend = true;

    apiPostMock.mockReturnValueOnce(firstRequest.promise);

    setActiveIdentity({ address: "0xAAA", jwt: "jwt-a" });
    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const firstPromise = result.current("wave-1");
    const secondPromise = result.current("wave-1", {
      shouldSend: () => shouldSend,
    });
    const rejection = expect(firstPromise).rejects.toBe(readError);

    expect(secondPromise).toBe(firstPromise);
    expect(apiPostMock).toHaveBeenCalledTimes(1);

    shouldSend = false;
    firstRequest.reject(readError);

    await rejection;
    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(invalidateNotifications).not.toHaveBeenCalled();
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

  it("skips a queued missing-JWT read that becomes stale before JWT verification", async () => {
    const invalidateNotifications = jest.fn();
    const addressKey = "0xaaa";
    const waveId = "wave-stale-missing-jwt";
    const identityKey = getWaveReadIdentityKey({
      addressKey,
      activeProfileProxyId: null,
    });
    const requestKey = getWaveReadRequestKey({
      addressKey,
      activeProfileProxyId: null,
      waveId,
    });
    const { addressEpoch, latestAddressEpochRef } = createAddressEpochState();

    try {
      const queuedPromise = enqueuePendingWaveReadRequest({
        addressKey,
        activeProfileProxyId: null,
        proxyCreatorId: null,
        identityKey,
        requestKey,
        waveId,
        addressEpoch,
        latestAddressEpochRef,
        shouldSend: undefined,
        queueIfBlocked: true,
      });
      const skipped = expect(queuedPromise).resolves.toBe("skipped");

      latestAddressEpochRef.current = {};
      flushPendingWaveReadRequests({
        verifiedIdentity: createVerifiedIdentity({ addressKey, identityKey }),
        invalidateNotificationsRef: { current: invalidateNotifications },
      });

      await skipped;
      expect(apiPostMock).not.toHaveBeenCalled();
      expect(invalidateNotifications).not.toHaveBeenCalled();
    } finally {
      clearAllWaveReadState();
    }
  });

  it("sends a fresh queued read when a stale same-wave proxy-role read is dropped", async () => {
    const invalidateNotifications = jest.fn();
    const addressKey = "0xaaa";
    const waveId = "wave-mixed-stale-fresh";
    const proxyCreatorId = "creator-1";
    const activeProfileProxyId = "proxy-1";
    const proxyRoleIdentityKey = getWaveReadProxyRoleIdentityKey({
      addressKey,
      proxyCreatorId,
    });
    const proxyRoleRequestKey = getWaveReadProxyRoleRequestKey({
      addressKey,
      proxyCreatorId,
      waveId,
    });
    const verifiedIdentity = createVerifiedIdentity({
      addressKey,
      activeProfileProxyId,
      activeProfileProxyCreatorId: proxyCreatorId,
      jwt: "jwt-proxy-1",
    });
    const loadedProxyRequestKey = getWaveReadRequestKey({
      addressKey,
      activeProfileProxyId,
      waveId,
    });
    const staleEpochState = createAddressEpochState();
    const freshEpochState = createAddressEpochState();

    try {
      const stalePromise = enqueuePendingWaveReadRequest({
        addressKey,
        activeProfileProxyId: null,
        proxyCreatorId,
        identityKey: proxyRoleIdentityKey,
        requestKey: proxyRoleRequestKey,
        waveId,
        addressEpoch: staleEpochState.addressEpoch,
        latestAddressEpochRef: staleEpochState.latestAddressEpochRef,
        shouldSend: undefined,
        queueIfBlocked: true,
      });
      const freshPromise = enqueuePendingWaveReadRequest({
        addressKey,
        activeProfileProxyId,
        proxyCreatorId: null,
        identityKey: verifiedIdentity.identityKey,
        requestKey: loadedProxyRequestKey,
        waveId,
        addressEpoch: freshEpochState.addressEpoch,
        latestAddressEpochRef: freshEpochState.latestAddressEpochRef,
        shouldSend: undefined,
        queueIfBlocked: true,
      });
      const staleSkipped = expect(stalePromise).resolves.toBe("skipped");

      staleEpochState.latestAddressEpochRef.current = {};
      flushPendingWaveReadRequests({
        verifiedIdentity,
        invalidateNotificationsRef: { current: invalidateNotifications },
      });

      await staleSkipped;
      await expect(freshPromise).resolves.toBe("sent");
      expect(apiPostMock).toHaveBeenCalledTimes(1);
      expect(apiPostMock).toHaveBeenCalledWith({
        endpoint: "notifications/wave/wave-mixed-stale-fresh/read",
        headers: { Authorization: "Bearer jwt-proxy-1" },
      });
      expect(invalidateNotifications).toHaveBeenCalledTimes(1);
    } finally {
      clearAllWaveReadState();
    }
  });

  it("skips a stale queued read on the cleared-auth flush path", async () => {
    const invalidateNotifications = jest.fn();
    const addressKey = "0xaaa";
    const waveId = "wave-stale-cleared-auth";
    const verifiedIdentity = createVerifiedIdentity({ addressKey });
    const requestKey = getWaveReadRequestKey({
      addressKey,
      activeProfileProxyId: null,
      waveId,
    });
    const { addressEpoch, latestAddressEpochRef } = createAddressEpochState();

    try {
      markWaveReadIdentityCleared(verifiedIdentity);
      const queuedPromise = enqueuePendingWaveReadRequest({
        addressKey,
        activeProfileProxyId: null,
        proxyCreatorId: null,
        identityKey: verifiedIdentity.identityKey,
        requestKey,
        waveId,
        addressEpoch,
        latestAddressEpochRef,
        shouldSend: undefined,
        queueIfBlocked: true,
      });
      const skipped = expect(queuedPromise).resolves.toBe("skipped");

      latestAddressEpochRef.current = {};
      flushPendingClearedWaveReadRequests({
        verifiedIdentity,
        invalidateNotificationsRef: { current: invalidateNotifications },
      });

      await skipped;
      expect(apiPostMock).not.toHaveBeenCalled();
      expect(invalidateNotifications).not.toHaveBeenCalled();
    } finally {
      clearAllWaveReadState();
    }
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

    await expect(waveTwoPromise).resolves.toBe("sent");
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);

    waveOneRequest.resolve();

    await expect(waveOnePromise).resolves.toBe("sent");
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });
});
