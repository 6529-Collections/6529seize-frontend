import { render, screen } from "@testing-library/react";
import React, { useMemo } from "react";
import { AuthContext } from "@/components/auth/Auth";
/* eslint-disable react/display-name */
import AboutPage from "@/app/about/[section]/page";
import { AboutSection } from "@/enums";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: true }),
}));

let country = "DE";
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country }),
}));

const setTitle = jest.fn();
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contextValue = useMemo(() => ({ setTitle } as any), [setTitle]);
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

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

describe("AboutMenu subscriptions row", () => {
  beforeEach(() => {
    country = "DE";
  });

  it("hides subscriptions row when not US", async () => {
    const element = await AboutPage({
      params: Promise.resolve({ section: AboutSection.MEMES }),
    } as any);
    render(element, { wrapper: Wrapper });
    expect(screen.queryByText("Subscriptions")).toBeNull();
  });

  it("shows subscriptions row in US", async () => {
    country = "US";
    const element = await AboutPage({
      params: Promise.resolve({ section: AboutSection.MEMES }),
    } as any);
    render(element, { wrapper: Wrapper });
    expect(screen.getAllByText("Subscriptions").length).toBeGreaterThan(0);
  });
});
