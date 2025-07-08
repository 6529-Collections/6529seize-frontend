import React from "react";
import { render, waitFor } from "@testing-library/react";
import Page from "../../../pages/tools/subscriptions-report";
import { AuthContext } from "../../../components/auth/Auth";
import { CookieConsentProvider } from "../../../components/cookies/CookieConsentContext";

jest.mock("../../../helpers/meme_calendar.helpers", () => ({
  getMintingDates: jest.fn(() => []),
  isMintingToday: jest.fn(() => false),
  numberOfCardsForSeasonEnd: jest.fn(() => ({ count: 2, szn: 1 })),
}));

jest.mock("../../../services/api/common-api", () => ({
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

const { commonApiFetch } = require("../../../services/api/common-api");
const {
  numberOfCardsForSeasonEnd,
} = require("../../../helpers/meme_calendar.helpers");

// Mock TitleContext
jest.mock("../../../contexts/TitleContext", () => ({
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
    const props = { szn: 1, upcoming: [], redeemed: [] } as any;
    const { container } = render(
      <AuthContext.Provider value={{} as any}>
        <CookieConsentProvider>
          <Page {...props} />
        </CookieConsentProvider>
      </AuthContext.Provider>
    );
    expect(container.querySelector("main")).toBeInTheDocument();
    await waitFor(() => {
      expect(numberOfCardsForSeasonEnd).toHaveBeenCalled();
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

  it("exposes metadata", () => {
    expect(Page.metadata).toEqual({
      title: "Subscriptions Report",
      description: "Tools",
    });
  });
});
