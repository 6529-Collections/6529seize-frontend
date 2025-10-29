import { render, screen } from "@testing-library/react";
import React, { useMemo } from "react";

import AcceptConnectionSharingPage from "@/app/accept-connection-sharing/page.client";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useRouter, useSearchParams } from "next/navigation";

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
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
    expect(screen.getByText(/Incoming Connection/)).toBeInTheDocument();
    expect(screen.getByText(/0x123/)).toBeInTheDocument();
  });
});
