import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useWaveDropsNotificationRead } from "@/components/waves/drops/wave-drops-all/hooks/useWaveDropsNotificationRead";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { act, render, waitFor } from "@testing-library/react";
import { jwtDecode } from "jwt-decode";
import React from "react";

jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0xAAA" }),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(() => "test-jwt"),
}));

jest.mock("jwt-decode", () => ({
  jwtDecode: jest.fn(),
}));

interface Deferred {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
  readonly reject: (error: unknown) => void;
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
const { getAuthJwt } = jest.requireMock("@/services/auth/auth.utils") as {
  readonly getAuthJwt: jest.Mock;
};
const getAuthJwtMock = getAuthJwt;
const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;
const jwtDecodeMock = jwtDecode as jest.MockedFunction<typeof jwtDecode>;
const mockJwtExp = 4102444800;
type AuthValue = ReturnType<typeof useAuth>;

const createAuthValue = (
  activeProfileProxy: AuthValue["activeProfileProxy"]
): AuthValue =>
  ({
    activeProfileProxy,
  }) as AuthValue;

const createActiveProfileProxy = ({
  id,
  creatorId,
}: {
  readonly id: string;
  readonly creatorId: string;
}): AuthValue["activeProfileProxy"] =>
  ({
    id,
    created_by: { id: creatorId },
  }) as AuthValue["activeProfileProxy"];

const mockJwtRole = (role: string | null) => {
  jwtDecodeMock.mockImplementation(<T,>(token: string): T => {
    if (token !== "test-jwt") {
      throw new Error(`Unexpected JWT decode for ${token}`);
    }

    return { sub: "0xAAA", role, exp: mockJwtExp } as T;
  });
};

const createReactQueryContextValue = (
  invalidateWaveReadState: jest.Mock
): React.ContextType<typeof ReactQueryWrapperContext> =>
  ({
    invalidateWaveReadState,
  }) as React.ContextType<typeof ReactQueryWrapperContext>;

let documentVisibilityState: DocumentVisibilityState = "visible";

const setDocumentVisibilityState = (state: DocumentVisibilityState) => {
  documentVisibilityState = state;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => documentVisibilityState,
  });
};

const dispatchVisibilityChange = () => {
  document.dispatchEvent(new Event("visibilitychange"));
};

function TestComponent({
  enabled,
  removeWaveDeliveredNotifications,
  waveId,
}: {
  readonly enabled?: boolean;
  readonly removeWaveDeliveredNotifications: (
    waveId: string
  ) => Promise<unknown> | void;
  readonly waveId: string;
}) {
  useWaveDropsNotificationRead({
    waveId,
    enabled,
    removeWaveDeliveredNotifications,
  });

  return null;
}

describe("useWaveDropsNotificationRead", () => {
  const invalidateNotifications = jest.fn();
  const removeWaveDeliveredNotifications = jest
    .fn()
    .mockResolvedValue(undefined);

  beforeEach(() => {
    setDocumentVisibilityState("visible");
    invalidateNotifications.mockClear();
    removeWaveDeliveredNotifications.mockClear();
    apiPostMock.mockReset();
    apiPostMock.mockResolvedValue(undefined);
    getAuthJwtMock.mockReset();
    getAuthJwtMock.mockReturnValue("test-jwt");
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue(createAuthValue(null));
    jwtDecodeMock.mockReset();
    mockJwtRole(null);
  });

  it("skips read-sync when disabled", () => {
    render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateWaveReadState: invalidateNotifications } as any}
      >
        <TestComponent
          waveId="wave-1"
          enabled={false}
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("does not mark the wave as read while hidden", async () => {
    setDocumentVisibilityState("hidden");

    render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateWaveReadState: invalidateNotifications } as any}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("marks the wave as read after a hidden tab becomes visible", async () => {
    setDocumentVisibilityState("hidden");

    render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateWaveReadState: invalidateNotifications } as any}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();

    await act(async () => {
      setDocumentVisibilityState("visible");
      dispatchVisibilityChange();
    });

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledWith("wave-1");
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
        endpoint: "notifications/wave/wave-1/read",
        headers: { Authorization: "Bearer test-jwt" },
      });
      expect(invalidateNotifications).toHaveBeenCalled();
    });
  });

  it("marks the wave as read when enabled", async () => {
    render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateWaveReadState: invalidateNotifications } as any}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledWith("wave-1");
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
        endpoint: "notifications/wave/wave-1/read",
        headers: { Authorization: "Bearer test-jwt" },
      });
      expect(invalidateNotifications).toHaveBeenCalled();
    });
  });

  it("uses the latest delivered-notification remover on visibility sync", async () => {
    const firstRemoveWaveDeliveredNotifications = jest
      .fn()
      .mockResolvedValue(undefined);
    const nextRemoveWaveDeliveredNotifications = jest
      .fn()
      .mockResolvedValue(undefined);

    const renderTestComponent = (
      currentRemoveWaveDeliveredNotifications: (
        waveId: string
      ) => Promise<unknown> | void
    ) => (
      <ReactQueryWrapperContext.Provider
        value={createReactQueryContextValue(invalidateNotifications)}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={
            currentRemoveWaveDeliveredNotifications
          }
        />
      </ReactQueryWrapperContext.Provider>
    );

    const { rerender } = render(
      renderTestComponent(firstRemoveWaveDeliveredNotifications)
    );

    await waitFor(() => {
      expect(firstRemoveWaveDeliveredNotifications).toHaveBeenCalledWith(
        "wave-1"
      );
    });

    rerender(renderTestComponent(nextRemoveWaveDeliveredNotifications));

    await act(async () => {
      dispatchVisibilityChange();
    });

    await waitFor(() => {
      expect(nextRemoveWaveDeliveredNotifications).toHaveBeenCalledWith(
        "wave-1"
      );
    });
    expect(firstRemoveWaveDeliveredNotifications).toHaveBeenCalledTimes(1);
  });

  it("keeps the initial read marker when auth changes while removal is pending", async () => {
    const firstRemove = createDeferred();
    const nextRemove = createDeferred();
    const pendingRemoveWaveDeliveredNotifications = jest
      .fn()
      .mockReturnValueOnce(firstRemove.promise)
      .mockReturnValueOnce(nextRemove.promise);

    getAuthJwtMock.mockReturnValue("wallet-a-jwt");
    jwtDecodeMock.mockImplementation(<T,>(token: string): T => {
      if (token === "wallet-a-jwt") {
        return { sub: "0xAAA", role: null, exp: mockJwtExp } as T;
      }

      if (token === "proxy-b-jwt") {
        return { sub: "0xAAA", role: "creator-b", exp: mockJwtExp } as T;
      }

      throw new Error(`Unexpected JWT decode for ${token}`);
    });

    const renderTestComponent = () => (
      <ReactQueryWrapperContext.Provider
        value={createReactQueryContextValue(invalidateNotifications)}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={
            pendingRemoveWaveDeliveredNotifications
          }
        />
      </ReactQueryWrapperContext.Provider>
    );

    const { rerender } = render(renderTestComponent());

    await waitFor(() => {
      expect(pendingRemoveWaveDeliveredNotifications).toHaveBeenCalledTimes(1);
    });
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();

    getAuthJwtMock.mockReturnValue("proxy-b-jwt");
    useAuthMock.mockReturnValue(
      createAuthValue(
        createActiveProfileProxy({
          id: "proxy-b",
          creatorId: "creator-b",
        })
      )
    );

    rerender(renderTestComponent());

    await waitFor(() => {
      expect(pendingRemoveWaveDeliveredNotifications).toHaveBeenCalledTimes(2);
    });
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();

    await act(async () => {
      firstRemove.resolve();
      await firstRemove.promise;
    });

    await waitFor(() => {
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(1);
    });
    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer wallet-a-jwt" },
    });

    await act(async () => {
      nextRemove.resolve();
      await nextRemove.promise;
    });

    await waitFor(() => {
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(2);
    });
    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer proxy-b-jwt" },
    });
  });

  it("drops a delayed read after unmount", async () => {
    getAuthJwtMock.mockReturnValue(null);

    const { unmount } = render(
      <ReactQueryWrapperContext.Provider
        value={createReactQueryContextValue(invalidateNotifications)}
      >
        <TestComponent
          waveId="wave-delayed-unmount"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledWith(
        "wave-delayed-unmount"
      );
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();

    unmount();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    getAuthJwtMock.mockReturnValue("test-jwt");

    render(
      <ReactQueryWrapperContext.Provider
        value={createReactQueryContextValue(invalidateNotifications)}
      >
        <TestComponent
          waveId="wave-delayed-flush"
          enabled={false}
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("drops a delayed read after the visible wave changes", async () => {
    getAuthJwtMock.mockReturnValue(null);

    const renderTestComponent = (waveId: string) => (
      <ReactQueryWrapperContext.Provider
        value={createReactQueryContextValue(invalidateNotifications)}
      >
        <TestComponent
          waveId={waveId}
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    const { rerender } = render(renderTestComponent("wave-delayed-old"));

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledWith(
        "wave-delayed-old"
      );
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();

    getAuthJwtMock.mockReturnValue("test-jwt");
    rerender(renderTestComponent("wave-delayed-new"));

    await waitFor(() => {
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(1);
    });

    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-delayed-new/read",
      headers: { Authorization: "Bearer test-jwt" },
    });
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-delayed-old/read",
      headers: { Authorization: "Bearer test-jwt" },
    });
  });

  it("drops a delayed read after the tab becomes hidden", async () => {
    getAuthJwtMock.mockReturnValue(null);

    const renderTestComponent = () => (
      <ReactQueryWrapperContext.Provider
        value={createReactQueryContextValue(invalidateNotifications)}
      >
        <TestComponent
          waveId="wave-delayed-hidden"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    const { rerender } = render(renderTestComponent());

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledWith(
        "wave-delayed-hidden"
      );
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();

    setDocumentVisibilityState("hidden");
    getAuthJwtMock.mockReturnValue("test-jwt");
    rerender(renderTestComponent());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("queues a follow-up read when the same visible wave syncs while pending", async () => {
    const firstReadRequest = createDeferred();
    apiPostMock.mockReturnValueOnce(firstReadRequest.promise);

    render(
      <ReactQueryWrapperContext.Provider
        value={createReactQueryContextValue(invalidateNotifications)}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await waitFor(() => {
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(1);
    });

    expect(removeWaveDeliveredNotifications).toHaveBeenCalledTimes(1);
    expect(invalidateNotifications).not.toHaveBeenCalled();

    await act(async () => {
      dispatchVisibilityChange();
    });

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledTimes(2);
    });

    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstReadRequest.resolve();
      await firstReadRequest.promise;
    });

    await waitFor(() => {
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(2);
    });

    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer test-jwt" },
    });
    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer test-jwt" },
    });
  });

  it("does not repeat the initial read-sync when a matching proxy loads", async () => {
    const firstReadRequest = createDeferred();

    mockJwtRole("creator-1");
    apiPostMock.mockReturnValueOnce(firstReadRequest.promise);

    const renderTestComponent = () => (
      <ReactQueryWrapperContext.Provider
        value={createReactQueryContextValue(invalidateNotifications)}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    const { rerender } = render(renderTestComponent());

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();

    useAuthMock.mockReturnValue(
      createAuthValue(
        createActiveProfileProxy({
          id: "proxy-1",
          creatorId: "creator-1",
        })
      )
    );

    rerender(renderTestComponent());

    await waitFor(() => {
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(1);
    });

    expect(removeWaveDeliveredNotifications).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstReadRequest.resolve();
      await firstReadRequest.promise;
    });

    await waitFor(() => {
      expect(invalidateNotifications).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(1);
    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer test-jwt" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
    expect(removeWaveDeliveredNotifications).toHaveBeenCalledTimes(1);
  });

  it("retries with the loaded proxy after a hidden temporary-proxy replay is skipped", async () => {
    mockJwtRole("creator-1");

    const renderTestComponent = () => (
      <ReactQueryWrapperContext.Provider
        value={createReactQueryContextValue(invalidateNotifications)}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    const { rerender } = render(renderTestComponent());

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();

    setDocumentVisibilityState("hidden");
    useAuthMock.mockReturnValue(
      createAuthValue(
        createActiveProfileProxy({
          id: "proxy-1",
          creatorId: "creator-1",
        })
      )
    );

    rerender(renderTestComponent());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();

    await act(async () => {
      setDocumentVisibilityState("visible");
      dispatchVisibilityChange();
    });

    await waitFor(() => {
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(1);
    });

    expect(removeWaveDeliveredNotifications).toHaveBeenCalledTimes(2);
    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer test-jwt" },
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });

  it("retries with the loaded proxy when the temporary read request fails", async () => {
    const firstReadRequest = createDeferred();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      mockJwtRole("creator-1");
      apiPostMock.mockReturnValueOnce(firstReadRequest.promise);

      const renderTestComponent = () => (
        <ReactQueryWrapperContext.Provider
          value={createReactQueryContextValue(invalidateNotifications)}
        >
          <TestComponent
            waveId="wave-1"
            removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
          />
        </ReactQueryWrapperContext.Provider>
      );

      const { rerender } = render(renderTestComponent());

      await waitFor(() => {
        expect(removeWaveDeliveredNotifications).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
      expect(invalidateNotifications).not.toHaveBeenCalled();

      useAuthMock.mockReturnValue(
        createAuthValue(
          createActiveProfileProxy({
            id: "proxy-1",
            creatorId: "creator-1",
          })
        )
      );

      rerender(renderTestComponent());

      await waitFor(() => {
        expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        firstReadRequest.reject(new Error("temporary proxy read failed"));
        await firstReadRequest.promise.catch(() => undefined);
      });

      await waitFor(() => {
        expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(invalidateNotifications).toHaveBeenCalledTimes(1);
      });

      expect(removeWaveDeliveredNotifications).toHaveBeenCalledTimes(2);
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenNthCalledWith(1, {
        endpoint: "notifications/wave/wave-1/read",
        headers: { Authorization: "Bearer test-jwt" },
      });
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenNthCalledWith(2, {
        endpoint: "notifications/wave/wave-1/read",
        headers: { Authorization: "Bearer test-jwt" },
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("syncs again when the active proxy changes while the same wave stays visible", async () => {
    mockJwtRole("creator-1");
    useAuthMock.mockReturnValue(
      createAuthValue(
        createActiveProfileProxy({
          id: "proxy-1",
          creatorId: "creator-1",
        })
      )
    );

    const renderTestComponent = () => (
      <ReactQueryWrapperContext.Provider
        value={createReactQueryContextValue(invalidateNotifications)}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    const { rerender } = render(renderTestComponent());

    await waitFor(() => {
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(1);
    });

    expect(removeWaveDeliveredNotifications).toHaveBeenCalledTimes(1);

    useAuthMock.mockReturnValue(
      createAuthValue(
        createActiveProfileProxy({
          id: "proxy-2",
          creatorId: "creator-1",
        })
      )
    );

    rerender(renderTestComponent());

    await waitFor(() => {
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledTimes(2);
    });

    expect(removeWaveDeliveredNotifications).toHaveBeenCalledTimes(2);
    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer test-jwt" },
    });
    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-1/read",
      headers: { Authorization: "Bearer test-jwt" },
    });
  });
});
