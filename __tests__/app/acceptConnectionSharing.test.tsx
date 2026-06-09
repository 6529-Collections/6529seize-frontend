import { render, screen } from "@testing-library/react";
import { Capacitor } from "@capacitor/core";
import React, { useMemo } from "react";

import AcceptConnectionSharingPage from "@/app/accept-connection-sharing/page.client";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useRouter, useSearchParams } from "next/navigation";
import {
  isConnectionTransferV2Enabled,
  redeemConnectionTransfer,
} from "@/services/auth/session-v2.utils";

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
  isConnectionTransferV2Enabled: jest.fn(() => false),
  persistSessionResponse: jest.fn(),
  redeemConnectionTransfer: jest.fn(),
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

const TestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setTitle = jest.fn();
  const setToast = jest.fn();
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
    (isConnectionTransferV2Enabled as jest.Mock).mockReturnValue(false);
    (redeemConnectionTransfer as jest.Mock).mockReset();
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: undefined,
      seizeDisconnectAndLogout: jest.fn(),
      seizeAcceptConnection: jest.fn(),
    });
  });

  it("shows missing parameters message when token or address missing", () => {
    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );
    expect(screen.getByText(/Missing required parameters/)).toBeInTheDocument();
  });

  it("includes provided token and address in the page", () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("token=abc12345&address=0x123")
    );
    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );
    expect(screen.getByText(/Incoming connection/)).toBeInTheDocument();
    expect(screen.getAllByText(/0x123/).length).toBeGreaterThan(0);
  });

  it("does not redeem native transfer codes in a web browser", () => {
    (isConnectionTransferV2Enabled as jest.Mock).mockReturnValue(true);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("transfer_code=abc12345&address=0x123")
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
    expect(redeemConnectionTransfer).not.toHaveBeenCalled();
  });

  it("allows transfer-code accept UI in the native app", () => {
    (isConnectionTransferV2Enabled as jest.Mock).mockReturnValue(true);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("transfer_code=abc12345&address=0x123")
    );

    render(
      <TestProvider>
        <AcceptConnectionSharingPage />
      </TestProvider>
    );

    expect(screen.getByText(/Incoming connection/)).toBeInTheDocument();
    expect(screen.getByText("Accept connection")).toBeInTheDocument();
  });
});
