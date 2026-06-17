import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Capacitor } from "@capacitor/core";
import React, { useMemo } from "react";

import AcceptConnectionSharingPage from "@/app/accept-connection-sharing/page.client";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useRouter, useSearchParams } from "next/navigation";
import {
  persistSessionResponse,
  redeemConnectionShare,
} from "@/services/auth/session-v2.utils";
import { canStoreAnotherWalletAccount } from "@/services/auth/auth.utils";

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
  setAuthJwt: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
  WebPlugin: class {},
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

describe("AcceptConnectionSharing page", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (redeemConnectionShare as jest.Mock).mockReset();
    (persistSessionResponse as jest.Mock).mockReset();
    (persistSessionResponse as jest.Mock).mockResolvedValue(true);
    (canStoreAnotherWalletAccount as jest.Mock).mockReturnValue(true);
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
      new URLSearchParams("connection_share_code=abc12345&address=0x123")
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

    fireEvent.click(screen.getByText("Accept connection"));

    await waitFor(() =>
      expect(redeemConnectionShare).toHaveBeenCalledWith("abc12345")
    );
    expect(canStoreAnotherWalletAccount).toHaveBeenCalledWith("0x123");
    expect(persistSessionResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        client_type: "native",
        address: "0x123",
        native_refresh_token: "native-refresh-token",
      })
    );
    expect(seizeAcceptConnection).toHaveBeenCalledWith("0x123");
    expect(push).toHaveBeenCalledWith("/");
  });

  it("does not burn a native connection share code when profile storage is full", async () => {
    const setToast = jest.fn();
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (canStoreAnotherWalletAccount as jest.Mock).mockReturnValue(false);
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("connection_share_code=abc12345&address=0x123")
    );

    render(
      <TestProvider setToast={setToast}>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    fireEvent.click(screen.getByText("Accept connection"));

    await waitFor(() =>
      expect(setToast).toHaveBeenCalledWith({
        message: "Maximum connected profiles reached",
        type: "error",
      })
    );
    expect(canStoreAnotherWalletAccount).toHaveBeenCalledWith("0x123");
    expect(redeemConnectionShare).not.toHaveBeenCalled();
    expect(persistSessionResponse).not.toHaveBeenCalled();
  });
});
