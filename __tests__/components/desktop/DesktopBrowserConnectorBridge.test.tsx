import { act, render } from "@testing-library/react";
import DesktopBrowserConnectorBridge from "@/components/desktop/DesktopBrowserConnectorBridge";
import {
  canStoreAnotherWalletAccount,
  getWalletAddress,
} from "@/services/auth/auth.utils";
import {
  loginWithSessionV2,
  persistSessionResponse,
} from "@/services/auth/session-v2.utils";
import {
  __resetBrowserConnectorForTests,
  cancelBrowserConnectorSignIn,
  getBrowserConnectorStatus,
  startBrowserConnectorSignIn,
} from "@/services/desktop/browserConnectorSignIn";

const seizeAcceptConnection = jest.fn();
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeAcceptConnection }),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  canStoreAnotherWalletAccount: jest.fn(() => true),
  getWalletAddress: jest.fn(),
}));
jest.mock("@/services/auth/session-v2.utils", () => ({
  loginWithSessionV2: jest.fn(),
  persistSessionResponse: jest.fn(),
}));

const ADDRESS = `0x${"a".repeat(40)}`;
type Listener = (event: unknown, payload: unknown) => void;

const createApi = (scheme: unknown = "localcore6529") => {
  const listeners = new Set<Listener>();
  return {
    listeners,
    openExternal: jest.fn(),
    getInfo: jest.fn().mockResolvedValue({ scheme }),
    onWalletConnection: jest.fn((listener: Listener) =>
      listeners.add(listener)
    ),
    offWalletConnection: jest.fn((listener: Listener) =>
      listeners.delete(listener)
    ),
  };
};

let api: ReturnType<typeof createApi>;

const installDesktopShell = () => {
  Object.defineProperty(window, "api", { configurable: true, value: api });
  Object.defineProperty(window, "nativeAuth", {
    configurable: true,
    value: { sessionLogin: jest.fn() },
  });
};

const openedRequest = () => {
  const url = new URL(api.openExternal.mock.calls[0]?.[0] as string);
  return {
    url,
    requestId: url.searchParams.get("request") ?? "",
  };
};

const deliver = async (payload: unknown) => {
  await act(async () => {
    for (const listener of api.listeners) listener({}, payload);
  });
};

const result = (
  requestId: string,
  overrides: Record<string, unknown> = {}
) => ({
  requestId,
  data: {
    kind: "desktop-sign-in",
    address: ADDRESS,
    server_signature: "0xserver",
    client_signature: `0x${"b".repeat(130)}`,
    ...overrides,
  },
});

describe("browser connector sign-in in 6529 Desktop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    __resetBrowserConnectorForTests();
    api = createApi();
    jest.mocked(getWalletAddress).mockReturnValue(ADDRESS);
    jest.mocked(loginWithSessionV2).mockResolvedValue({
      client_type: "desktop",
      address: ADDRESS,
      role: null,
      access_token: "token",
      access_token_expires_at: "",
      native_refresh_token: "",
      refresh_token_expires_at: "",
    });
    jest.mocked(persistSessionResponse).mockResolvedValue(true);
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
  });

  it("does nothing in a browser", async () => {
    render(<DesktopBrowserConnectorBridge />);

    await expect(startBrowserConnectorSignIn()).rejects.toThrow(
      "only in 6529 Desktop"
    );
    expect(api.onWalletConnection).not.toHaveBeenCalled();
  });

  it("does not switch accounts when setup returns from another wallet", async () => {
    installDesktopShell();
    render(<DesktopBrowserConnectorBridge />);
    const onStatus = jest.fn();
    await startBrowserConnectorSignIn({
      address: ADDRESS,
      signal: new AbortController().signal,
      onStatus,
    });

    await deliver(
      result(openedRequest().requestId, { address: `0x${"c".repeat(40)}` })
    );

    expect(loginWithSessionV2).not.toHaveBeenCalled();
    expect(seizeAcceptConnection).not.toHaveBeenCalled();
    expect(onStatus).toHaveBeenLastCalledWith("failed");
  });

  it("discards setup when the active wallet changes during browser sign-in", async () => {
    installDesktopShell();
    render(<DesktopBrowserConnectorBridge />);
    const onStatus = jest.fn();
    await startBrowserConnectorSignIn({
      address: ADDRESS,
      signal: new AbortController().signal,
      onStatus,
    });
    jest.mocked(loginWithSessionV2).mockImplementationOnce(async () => {
      jest.mocked(getWalletAddress).mockReturnValue(`0x${"c".repeat(40)}`);
      return {
        client_type: "desktop",
        address: ADDRESS,
        role: null,
        access_token: "token",
        access_token_expires_at: "",
        native_refresh_token: "",
        refresh_token_expires_at: "",
      };
    });

    await deliver(result(openedRequest().requestId));

    expect(persistSessionResponse).not.toHaveBeenCalled();
    expect(seizeAcceptConnection).not.toHaveBeenCalled();
    expect(onStatus).toHaveBeenLastCalledWith("failed");
  });

  it("opens the connector with the scheme this build reports", async () => {
    installDesktopShell();
    render(<DesktopBrowserConnectorBridge />);

    await startBrowserConnectorSignIn();

    const { url, requestId } = openedRequest();
    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toBe("/browser-connector");
    expect(url.searchParams.get("scheme")).toBe("localcore6529");
    expect(requestId).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(getBrowserConnectorStatus()).toBe("waiting");
  });

  it("does not leave a request waiting when the browser cannot be opened", async () => {
    installDesktopShell();
    api.openExternal.mockImplementationOnce(() => {
      throw new Error("no browser");
    });

    await expect(startBrowserConnectorSignIn()).rejects.toThrow("no browser");
    expect(getBrowserConnectorStatus()).toBe("failed");
  });

  it("opens nothing when cancelled while the shell reports its scheme", async () => {
    installDesktopShell();
    let resolveInfo: (value: unknown) => void = () => undefined;
    api.getInfo.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveInfo = resolve;
      })
    );
    const start = startBrowserConnectorSignIn();

    cancelBrowserConnectorSignIn();
    resolveInfo({ scheme: "localcore6529" });
    await start;

    expect(api.openExternal).not.toHaveBeenCalled();
    expect(getBrowserConnectorStatus()).toBe("idle");
  });

  it("opens only the newer request when a second start replaces the first", async () => {
    installDesktopShell();
    let resolveFirst: (value: unknown) => void = () => undefined;
    api.getInfo.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      })
    );
    const first = startBrowserConnectorSignIn();
    await startBrowserConnectorSignIn();
    resolveFirst({ scheme: "localcore6529" });
    await first;

    expect(api.openExternal).toHaveBeenCalledTimes(1);
    expect(getBrowserConnectorStatus()).toBe("waiting");
  });

  it("never falls back to a default scheme", async () => {
    api = createApi(null);
    installDesktopShell();

    await expect(startBrowserConnectorSignIn()).rejects.toThrow(
      "did not report its link scheme"
    );
    expect(api.openExternal).not.toHaveBeenCalled();
  });

  it("signs in once with the returned signature for its own request", async () => {
    installDesktopShell();
    render(<DesktopBrowserConnectorBridge />);
    await startBrowserConnectorSignIn();
    const { requestId } = openedRequest();

    await deliver(result(requestId));
    await deliver(result(requestId));

    expect(loginWithSessionV2).toHaveBeenCalledTimes(1);
    expect(loginWithSessionV2).toHaveBeenCalledWith({
      serverSignature: "0xserver",
      clientSignature: `0x${"b".repeat(130)}`,
      signerAddress: ADDRESS,
      role: null,
    });
    expect(seizeAcceptConnection).toHaveBeenCalledWith(ADDRESS);
    expect(getBrowserConnectorStatus()).toBe("signed-in");
  });

  it("leaves requests to the mounted bridge when the host cannot remove listeners", async () => {
    // An older host without offWalletConnection keeps every listener.
    api = {
      ...createApi(),
      offWalletConnection: undefined,
    } as unknown as ReturnType<typeof createApi>;
    installDesktopShell();
    const first = render(<DesktopBrowserConnectorBridge />);
    first.unmount();
    render(<DesktopBrowserConnectorBridge />);
    await startBrowserConnectorSignIn();
    const { requestId } = openedRequest();

    await deliver(result(requestId));

    // Both listeners heard it; only the mounted bridge signed in.
    expect(api.listeners.size).toBe(2);
    expect(loginWithSessionV2).toHaveBeenCalledTimes(1);
    expect(seizeAcceptConnection).toHaveBeenCalledTimes(1);
    expect(getBrowserConnectorStatus()).toBe("signed-in");
  });

  it("does not finish a sign-in after unmount", async () => {
    installDesktopShell();
    type LoginResult = Awaited<ReturnType<typeof loginWithSessionV2>>;
    let resolveLogin: (value: LoginResult) => void = () => undefined;
    jest.mocked(loginWithSessionV2).mockReturnValue(
      new Promise<LoginResult>((resolve) => {
        resolveLogin = resolve;
      })
    );
    const { unmount } = render(<DesktopBrowserConnectorBridge />);
    await startBrowserConnectorSignIn();
    await deliver(result(openedRequest().requestId));

    unmount();
    await act(async () => {
      resolveLogin({ address: ADDRESS } as LoginResult);
    });

    expect(persistSessionResponse).not.toHaveBeenCalled();
    expect(seizeAcceptConnection).not.toHaveBeenCalled();
    expect(getBrowserConnectorStatus()).toBe("failed");
  });

  it("registers nothing when the host has no wallet-connection listener", async () => {
    api = {
      ...createApi(),
      onWalletConnection: undefined,
    } as unknown as ReturnType<typeof createApi>;
    installDesktopShell();

    expect(() => render(<DesktopBrowserConnectorBridge />)).not.toThrow();
  });

  it("ignores links for other requests, malformed links and cancelled requests", async () => {
    installDesktopShell();
    render(<DesktopBrowserConnectorBridge />);
    await startBrowserConnectorSignIn();
    const { requestId } = openedRequest();

    await deliver(result("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"));
    await deliver(result(requestId, { address: "0x1" }));
    await deliver({ requestId, data: "not-an-object" });
    cancelBrowserConnectorSignIn();
    await deliver(result(requestId));

    expect(loginWithSessionV2).not.toHaveBeenCalled();
  });

  it("refuses an expired request", async () => {
    installDesktopShell();
    jest.useFakeTimers();
    render(<DesktopBrowserConnectorBridge />);
    await startBrowserConnectorSignIn();
    const { requestId } = openedRequest();

    act(() => {
      jest.advanceTimersByTime(120_001);
    });
    expect(getBrowserConnectorStatus()).toBe("expired");
    await deliver(result(requestId));

    expect(loginWithSessionV2).not.toHaveBeenCalled();
  });

  it("fails when the session is for another wallet or cannot be saved", async () => {
    installDesktopShell();
    render(<DesktopBrowserConnectorBridge />);

    await startBrowserConnectorSignIn();
    jest.mocked(loginWithSessionV2).mockResolvedValueOnce({
      client_type: "desktop",
      address: `0x${"c".repeat(40)}`,
      role: null,
      access_token: "token",
      access_token_expires_at: "",
      native_refresh_token: "",
      refresh_token_expires_at: "",
    });
    await deliver(result(openedRequest().requestId));
    expect(getBrowserConnectorStatus()).toBe("failed");
    expect(persistSessionResponse).not.toHaveBeenCalled();

    api.openExternal.mockClear();
    await startBrowserConnectorSignIn();
    jest.mocked(persistSessionResponse).mockResolvedValueOnce(false);
    await deliver(result(openedRequest().requestId));
    expect(getBrowserConnectorStatus()).toBe("failed");
    expect(seizeAcceptConnection).not.toHaveBeenCalled();
  });

  it("fails without signing in when no more profiles fit", async () => {
    installDesktopShell();
    jest.mocked(canStoreAnotherWalletAccount).mockReturnValueOnce(false);
    render(<DesktopBrowserConnectorBridge />);
    await startBrowserConnectorSignIn();

    await deliver(result(openedRequest().requestId));

    expect(loginWithSessionV2).not.toHaveBeenCalled();
    expect(getBrowserConnectorStatus()).toBe("failed");
  });
});
