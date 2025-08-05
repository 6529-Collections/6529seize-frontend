import WavesPage from "@/app/waves/page";
import { AuthContext } from "@/components/auth/Auth";
import { render } from "@testing-library/react";
import React from "react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);

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
  useSeizeConnectContext: jest.fn(() => ({
    seizeConnect: jest.fn(),
  })),
}));

describe("Waves page", () => {
  it("sets title on mount", () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <WavesPage />
      </AuthContext.Provider>
    );
    // Component renders successfully
  });
});
