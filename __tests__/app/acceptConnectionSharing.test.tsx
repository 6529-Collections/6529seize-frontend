import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Capacitor } from "@capacitor/core";
import React, { act, useMemo } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import AcceptConnectionSharingPage from "@/app/accept-connection-sharing/page.client";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useRouter, useSearchParams } from "next/navigation";
import {
  persistSessionResponse,
  redeemConnectionShare,
} from "@/services/auth/session-v2.utils";
import { commonApiPost } from "@/services/api/common-api";
import {
  canStoreAnotherWalletAccount,
  getConnectedWalletAccounts,
  setAuthJwt,
} from "@/services/auth/auth.utils";

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: jest.fn(() => ({ profile: null, isLoading: false })),
}));

jest.mock("@/components/nft-transfer/TransferModalPfp", () => ({
  __esModule: true,
  default: ({ alt }: { readonly alt: string }) => (
    <div data-testid="transfer-pfp">{alt}</div>
  ),
}));

jest.mock("@/services/auth/session-v2.utils", () => ({
  persistSessionResponse: jest.fn(),
  redeemConnectionShare: jest.fn(),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  canStoreAnotherWalletAccount: jest.fn(() => true),
  getConnectedWalletAccounts: jest.fn(() => []),
  setAuthJwt: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
  WebPlugin: class {
    readonly pluginName = "mock";
  },
  registerPlugin: jest.fn(() => ({
    get: jest.fn(),
    remove: jest.fn(),
    set: jest.fn(),
  })),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const TestProvider: React.FC<{
  children: React.ReactNode;
  setToast?: jest.Mock;
}> = ({ children, setToast = jest.fn() }) => {
  const setTitle = jest.fn();
  const authContextValue = useMemo(
    () => ({ setTitle, setToast }),
    [setTitle, setToast]
  );
  return (
    <AuthContext.Provider value={authContextValue as any}>
      {children}
    </AuthContext.Provider>
  );
};

const ACCEPT_CONNECTION_PATH = "/accept-connection-sharing";
const ORIGINAL_USER_AGENT = navigator.userAgent;
const DESKTOP_APP_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 6529.io/1.0.0 Chrome/124.0.0.0 Electron/31.0.0 Safari/537.36";

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });
}

/** Opens the page as the browser would: the URL and router agree. */
function openConnectionLink(query: string) {
  window.history.replaceState(null, "", `${ACCEPT_CONNECTION_PATH}?${query}`);
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(query));
}

describe("AcceptConnectionSharing page", () => {
  afterEach(() => {
    setUserAgent(ORIGINAL_USER_AGENT);
    window.history.replaceState(null, "", "/");
  });

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (redeemConnectionShare as jest.Mock).mockReset();
    (persistSessionResponse as jest.Mock).mockReset();
    (persistSessionResponse as jest.Mock).mockResolvedValue(true);
    (commonApiPost as jest.Mock).mockReset();
    (setAuthJwt as jest.Mock).mockReset();
    (setAuthJwt as jest.Mock).mockReturnValue(true);
    (canStoreAnotherWalletAccount as jest.Mock).mockReturnValue(true);
    (getConnectedWalletAccounts as jest.Mock).mockReturnValue([]);
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: undefined,
      seizeDisconnectAndLogout: jest.fn(),
      seizeAcceptConnection: jest.fn(),
    });
  });

  it("shows missing parameters message when connection share code is missing", () => {
    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );
    expect(screen.getByText(/Missing required parameters/)).toBeInTheDocument();
  });

  it("includes provided address in the page", () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams(
        "connection_share_code=abc12345&address=0x123&role=client-role"
      )
    );
    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );
    expect(screen.getByText(/Incoming connection/)).toBeInTheDocument();
    expect(screen.getAllByText(/0x123/).length).toBeGreaterThan(0);
  });

  it("does not redeem native connection shares in a web browser", () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("connection_share_code=abc12345&address=0x123")
    );

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(
      screen.getByText(/Open this connection link in the 6529 mobile app/)
    ).toBeInTheDocument();
    expect(screen.queryByText("Accept connection")).not.toBeInTheDocument();
    expect(redeemConnectionShare).not.toHaveBeenCalled();
  });

  it("allows connection share accept UI in the native app", () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("connection_share_code=abc12345&address=0x123")
    );

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(screen.getByText(/Incoming connection/)).toBeInTheDocument();
    expect(screen.getByText("Accept connection")).toBeInTheDocument();
  });

  it("redeems and persists a native connection share session", async () => {
    const push = jest.fn();
    const seizeAcceptConnection = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("connection_share_code=abc12345&address=0x123")
    );
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: undefined,
      seizeDisconnectAndLogout: jest.fn(),
      seizeAcceptConnection,
    });
    (redeemConnectionShare as jest.Mock).mockResolvedValue({
      client_type: "native",
      address: "0x123",
      role: "server-role",
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
      native_refresh_token: "native-refresh-token",
      refresh_token_expires_at: "2026-07-10T00:00:00.000Z",
    });

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(
      screen.queryByText(/Open this connection link in the 6529 mobile app/)
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Accept connection"));

    await waitFor(() =>
      expect(redeemConnectionShare).toHaveBeenCalledWith("abc12345")
    );
    expect(canStoreAnotherWalletAccount).toHaveBeenCalledWith("0x123");
    expect(persistSessionResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        client_type: "native",
        address: "0x123",
        role: "server-role",
        native_refresh_token: "native-refresh-token",
      })
    );
    expect(seizeAcceptConnection).toHaveBeenCalledWith("0x123");
    expect(push).toHaveBeenCalledWith("/");
  });

  it("redeems a legacy desktop token connection share in the 6529 Desktop app", async () => {
    const push = jest.fn();
    const seizeAcceptConnection = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    setUserAgent(DESKTOP_APP_USER_AGENT);
    openConnectionLink("token=legacy-refresh&address=0x123&role=client-role");
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: undefined,
      seizeDisconnectAndLogout: jest.fn(),
      seizeAcceptConnection,
    });
    (commonApiPost as jest.Mock).mockResolvedValue({
      address: "0x123",
      token: "legacy-access-token",
    });

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    // The credential leaves the visible URL before the user acts on the page.
    expect(window.location.pathname).toBe(ACCEPT_CONNECTION_PATH);
    expect(window.location.search).toBe("?address=0x123&role=client-role");
    fireEvent.click(screen.getByText("Accept connection"));

    await waitFor(() =>
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: "auth/redeem-refresh-token",
        body: {
          address: "0x123",
          token: "legacy-refresh",
          role: "client-role",
        },
      })
    );
    expect(setAuthJwt).toHaveBeenCalledWith(
      "0x123",
      "legacy-access-token",
      "legacy-refresh",
      "client-role"
    );
    expect(redeemConnectionShare).not.toHaveBeenCalled();
    expect(persistSessionResponse).not.toHaveBeenCalled();
    expect(seizeAcceptConnection).toHaveBeenCalledWith("0x123");
    expect(push).toHaveBeenCalledWith("/");
  });

  it.each([
    ["a web browser", false, ORIGINAL_USER_AGENT],
    ["the 6529 mobile app", true, ORIGINAL_USER_AGENT],
  ])(
    "does not redeem or store a legacy desktop token in %s",
    (_surface, isNativePlatform, userAgent) => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(
        isNativePlatform
      );
      setUserAgent(userAgent);
      openConnectionLink("token=legacy-refresh&address=0x123&role=client-role");

      render(
        <TestProvider>
          <AcceptConnectionSharingPage />
        </TestProvider>
      );

      expect(
        screen.getByText(
          "This connection link can only be accepted in the 6529 Desktop app."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Take me home" })
      ).toHaveAttribute("href", "/");
      expect(screen.queryByText("Accept connection")).not.toBeInTheDocument();
      expect(window.location.search).toBe("?address=0x123&role=client-role");
      expect(commonApiPost).not.toHaveBeenCalled();
      expect(setAuthJwt).not.toHaveBeenCalled();
      expect(redeemConnectionShare).not.toHaveBeenCalled();
    }
  );

  it("does not accept a legacy token through a mobile share link in a web browser", () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    openConnectionLink(
      "connection_share_code=abc12345&token=legacy-refresh&address=0x123"
    );

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(
      screen.getByText(
        "This connection link can only be accepted in the 6529 Desktop app."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Accept connection")).not.toBeInTheDocument();
    expect(window.location.search).toBe("?address=0x123");
  });

  it("redeems only the share code when a mobile link also carries a legacy token in the native app", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    openConnectionLink(
      "connection_share_code=abc12345&token=legacy-refresh&address=0x123"
    );
    (redeemConnectionShare as jest.Mock).mockResolvedValue({
      client_type: "native",
      address: "0x123",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
      native_refresh_token: "native-refresh-token",
      refresh_token_expires_at: "2026-07-10T00:00:00.000Z",
    });

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(window.location.search).toBe("?address=0x123");
    fireEvent.click(screen.getByText("Accept connection"));

    await waitFor(() =>
      expect(redeemConnectionShare).toHaveBeenCalledWith("abc12345")
    );
    expect(commonApiPost).not.toHaveBeenCalled();
    expect(setAuthJwt).not.toHaveBeenCalled();
  });

  it("cleans the URL again when the same link is reopened on the mounted page", () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    openConnectionLink("connection_share_code=abc12345&address=0x123&_t=1");
    const { rerender } = render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );
    expect(window.location.search).toBe("?address=0x123&_t=1");

    // A repeated deep link navigates to the same code with a new timestamp.
    openConnectionLink("connection_share_code=abc12345&address=0x123&_t=2");
    rerender(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(window.location.search).toBe("?address=0x123&_t=2");
    expect(screen.getByText("Accept connection")).toBeInTheDocument();
  });

  it("removes a mobile share code from the URL and still redeems it in the native app", async () => {
    const push = jest.fn();
    const historyLength = window.history.length;
    (useRouter as jest.Mock).mockReturnValue({ push });
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    openConnectionLink("connection_share_code=abc12345&address=0x123&_t=1");
    window.history.replaceState(null, "", `${window.location.href}#top`);
    (redeemConnectionShare as jest.Mock).mockResolvedValue({
      client_type: "native",
      address: "0x123",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
      native_refresh_token: "native-refresh-token",
      refresh_token_expires_at: "2026-07-10T00:00:00.000Z",
    });

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(window.location.search).toBe("?address=0x123&_t=1");
    expect(window.location.hash).toBe("#top");
    // Replacing the entry must not add a history entry or navigate.
    expect(window.history.length).toBe(historyLength);
    expect(push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Accept connection"));

    await waitFor(() =>
      expect(redeemConnectionShare).toHaveBeenCalledWith("abc12345")
    );
    expect(push).toHaveBeenCalledWith("/");
  });

  it("waits for hydration before choosing the Desktop flow, without a hydration mismatch", async () => {
    setUserAgent(DESKTOP_APP_USER_AGENT);
    openConnectionLink("token=legacy-refresh&address=0x123");
    const page = (
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(page);
    document.body.appendChild(container);

    // Server HTML cannot know the shell, so it offers neither outcome yet.
    expect(container.textContent).not.toContain("Accept connection");
    expect(container.textContent).not.toContain("6529 Desktop app");

    const onRecoverableError = jest.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, page, { onRecoverableError });
      });

      expect(container.textContent).toContain("Accept connection");
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(window.location.search).toBe("?address=0x123");
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it("removes link credentials from the URL in a web browser", () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    openConnectionLink("connection_share_code=abc12345&address=0x123");

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(
      screen.getByText(/Open this connection link in the 6529 mobile app/)
    ).toBeInTheDocument();
    expect(window.location.search).toBe("?address=0x123");
  });

  it("rejects a legacy desktop token response for a different address", async () => {
    const push = jest.fn();
    const setToast = jest.fn();
    const seizeAcceptConnection = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    setUserAgent(DESKTOP_APP_USER_AGENT);
    openConnectionLink("token=legacy-refresh&address=0x123&role=client-role");
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: undefined,
      seizeDisconnectAndLogout: jest.fn(),
      seizeAcceptConnection,
    });
    (commonApiPost as jest.Mock).mockResolvedValue({
      address: "0x999",
      token: "legacy-access-token",
    });

    render(
      <TestProvider setToast={setToast}>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    fireEvent.click(screen.getByText("Accept connection"));

    await waitFor(() =>
      expect(setToast).toHaveBeenCalledWith({
        message: "Invalid connection response",
        type: "error",
      })
    );
    expect(setAuthJwt).not.toHaveBeenCalled();
    expect(seizeAcceptConnection).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("does not show the current-profile notice when the incoming profile is already connected", () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (getConnectedWalletAccounts as jest.Mock).mockReturnValue([
      {
        address: "0x123",
        refreshToken: null,
        role: null,
        jwt: null,
        profileId: null,
        profileHandle: null,
      },
    ]);
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("connection_share_code=abc12345&address=0x123")
    );
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: "0x123",
      seizeDisconnectAndLogout: jest.fn(),
      seizeAcceptConnection: jest.fn(),
    });

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(screen.queryByText(/will stay available/)).not.toBeInTheDocument();
    expect(screen.getByText("Accept connection")).toBeInTheDocument();
  });

  it("does not burn a native connection share code when accepting a new profile would exceed the limit", () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (canStoreAnotherWalletAccount as jest.Mock).mockReturnValue(false);
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("connection_share_code=abc12345&address=0x123")
    );

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(
      screen.getByText("Connected profile limit reached")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You can keep up to 5 connected profiles/)
    ).toBeInTheDocument();
    expect(screen.getByText("Accept connection")).toBeDisabled();
    fireEvent.click(screen.getByText("Accept connection"));
    expect(canStoreAnotherWalletAccount).toHaveBeenCalledWith("0x123");
    expect(redeemConnectionShare).not.toHaveBeenCalled();
    expect(persistSessionResponse).not.toHaveBeenCalled();
  });

  it("accepts an already-connected incoming profile even when no new profile slots remain", async () => {
    const push = jest.fn();
    const seizeAcceptConnection = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (getConnectedWalletAccounts as jest.Mock).mockReturnValue([
      {
        address: "0x123",
        refreshToken: null,
        role: null,
        jwt: null,
        profileId: null,
        profileHandle: null,
      },
    ]);
    (canStoreAnotherWalletAccount as jest.Mock).mockReturnValue(true);
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("connection_share_code=abc12345&address=0x123")
    );
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: "0x999",
      seizeDisconnectAndLogout: jest.fn(),
      seizeAcceptConnection,
    });
    (redeemConnectionShare as jest.Mock).mockResolvedValue({
      client_type: "native",
      address: "0x123",
      role: "server-role",
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
      native_refresh_token: "native-refresh-token",
      refresh_token_expires_at: "2026-07-10T00:00:00.000Z",
    });

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(screen.queryByText(/will stay available/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Connected profile limit reached")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Accept connection"));

    await waitFor(() =>
      expect(redeemConnectionShare).toHaveBeenCalledWith("abc12345")
    );
    expect(persistSessionResponse).toHaveBeenCalled();
    expect(seizeAcceptConnection).toHaveBeenCalledWith("0x123");
    expect(push).toHaveBeenCalledWith("/");
  });
});
