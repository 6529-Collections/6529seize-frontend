import { act, render } from "@testing-library/react";
import DesktopBrowserConnectorBridge from "@/components/desktop/DesktopBrowserConnectorBridge";
import { setAuthJwt } from "@/services/auth/auth.utils";
import { loginWithSessionV2 } from "@/services/auth/session-v2.utils";
import {
  noteSignOutAllFinished,
  noteSignOutAllStarted,
} from "@/services/auth/sign-out-all-state";
import {
  __resetBrowserConnectorForTests,
  getBrowserConnectorStatus,
  startBrowserConnectorSignIn,
} from "@/services/desktop/browserConnectorSignIn";

// The real persistSessionResponse runs; only the login request and the
// final page-storage write are replaced, so the write can be observed.
const seizeAcceptConnection = jest.fn();
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeAcceptConnection }),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  ...jest.requireActual("@/services/auth/auth.utils"),
  canStoreAnotherWalletAccount: jest.fn(() => true),
  setAuthJwt: jest.fn(() => true),
}));
jest.mock("@/services/auth/session-v2.utils", () => ({
  ...jest.requireActual("@/services/auth/session-v2.utils"),
  loginWithSessionV2: jest.fn(),
}));

const ADDRESS = `0x${"a".repeat(40)}`;
type Listener = (event: unknown, payload: unknown) => void;
type LoginResult = Awaited<ReturnType<typeof loginWithSessionV2>>;

const listeners = new Set<Listener>();
const api = {
  openExternal: jest.fn(),
  getInfo: jest.fn().mockResolvedValue({ scheme: "localcore6529" }),
  onWalletConnection: (listener: Listener) => listeners.add(listener),
  offWalletConnection: (listener: Listener) => listeners.delete(listener),
};

const session: LoginResult = {
  client_type: "desktop",
  address: ADDRESS,
  role: null,
  access_token: "token",
  access_token_expires_at: "",
  native_refresh_token: "",
  refresh_token_expires_at: "",
};

const deliverReturnedLink = async () => {
  await startBrowserConnectorSignIn();
  const url = new URL(api.openExternal.mock.calls.at(-1)?.[0] as string);
  await act(async () => {
    for (const listener of listeners) {
      listener(
        {},
        {
          requestId: url.searchParams.get("request"),
          data: {
            kind: "desktop-sign-in",
            address: ADDRESS,
            server_signature: "0xserver",
            client_signature: `0x${"b".repeat(130)}`,
          },
        }
      );
    }
  });
};

describe("browser connector sign-in and sign-out-all", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listeners.clear();
    __resetBrowserConnectorForTests();
    Object.defineProperty(window, "api", { configurable: true, value: api });
    Object.defineProperty(window, "nativeAuth", {
      configurable: true,
      value: { sessionLogin: jest.fn() },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
  });

  it("saves the session when nothing signs out meanwhile", async () => {
    jest.mocked(loginWithSessionV2).mockResolvedValue(session);
    render(<DesktopBrowserConnectorBridge />);

    await deliverReturnedLink();

    expect(setAuthJwt).toHaveBeenCalledTimes(1);
    expect(seizeAcceptConnection).toHaveBeenCalledWith(ADDRESS);
  });

  it("writes nothing when sign-out-all starts and ends between two renders", async () => {
    let resolveLogin: (value: LoginResult) => void = () => undefined;
    jest.mocked(loginWithSessionV2).mockReturnValue(
      new Promise<LoginResult>((resolve) => {
        resolveLogin = resolve;
      })
    );
    render(<DesktopBrowserConnectorBridge />);
    await deliverReturnedLink();

    // Sign-out-all runs to completion with no render in between.
    noteSignOutAllStarted();
    noteSignOutAllFinished();
    await act(async () => {
      resolveLogin(session);
    });

    expect(setAuthJwt).not.toHaveBeenCalled();
    expect(seizeAcceptConnection).not.toHaveBeenCalled();
    expect(getBrowserConnectorStatus()).toBe("failed");
  });
});
