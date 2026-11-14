import { act, render } from "@testing-library/react";
import DesktopBrowserConnectorBridge from "@/components/desktop/DesktopBrowserConnectorBridge";
import { canStoreAnotherWalletAccount } from "@/services/auth/auth.utils";
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
