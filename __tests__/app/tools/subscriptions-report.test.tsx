import Page, { generateMetadata } from "@/app/tools/subscriptions-report/page";
import { AuthContext } from "@/components/auth/Auth";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import { render, waitFor } from "@testing-library/react";
import React from "react";

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  __esModule: true,
  getCardsRemainingUntilEndOf: jest.fn(() => 2),
  getUpcomingMintsAcrossSeasons: jest.fn(() => []),
  isMintingToday: jest.fn(() => false),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn((opts) => {
    if (opts && opts.endpoint === "subscriptions/redeemed-memes-counts") {
      return Promise.resolve({
        count: 0,
        page: 1,
        next: null,
        data: [],
      });
    }
    return Promise.resolve([]);
  }),
}));

const { commonApiFetch } = require("@/services/api/common-api");
const {
  getCardsRemainingUntilEndOf,
} = require("@/components/meme-calendar/meme-calendar.helpers");

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

describe("Subscriptions report page", () => {
  it("sets title and renders component", async () => {
    const { container } = render(
      <AuthContext.Provider value={{} as any}>
        <CookieConsentProvider>
          <Page />
        </CookieConsentProvider>
      </AuthContext.Provider>
    );
    expect(container.querySelector("main")).toBeInTheDocument();
    await waitFor(() => {
      expect(getCardsRemainingUntilEndOf).toHaveBeenCalledWith("szn");
      expect(commonApiFetch).toHaveBeenCalledTimes(3);
      expect(commonApiFetch).toHaveBeenCalledWith({
        endpoint: "policies/country-check",
      });
      expect(commonApiFetch).toHaveBeenCalledWith({
        endpoint: "subscriptions/upcoming-memes-counts?card_count=2",
      });
      expect(commonApiFetch).toHaveBeenCalledWith({
        endpoint: "subscriptions/redeemed-memes-counts",
        params: {
          page_size: "20",
          page: "1",
        },
      });
    });
  });

  it("exposes metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toEqual("Subscriptions Report");
    expect(metadata.description).toEqual("Tools | 6529.io");
  });
});
