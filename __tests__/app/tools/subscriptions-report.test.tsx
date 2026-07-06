import Page, { generateMetadata } from "@/app/tools/subscriptions-report/page";
import { AuthContext } from "@/components/auth/Auth";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockDownload = jest.fn();
const mockUseDownloader = jest.fn();

jest.mock("react-use-downloader", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseDownloader(...args),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getStagingAuth: () => "stag",
  getAuthJwt: () => "jwtToken",
}));

jest.mock("@/components/about/AboutSubscriptionsProfileButton", () => ({
  __esModule: true,
  default: () => <button type="button">Manage</button>,
}));

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  __esModule: true,
  displayedSeasonNumberFromIndex: jest.fn((index: number) => index + 1),
  formatFullDate: jest.fn(() => "Jan 1, 2026"),
  getCardsRemainingUntilEndOf: jest.fn(() => 2),
  getUpcomingMintsAcrossSeasons: jest.fn(() => []),
  isMintingToday: jest.fn(() => false),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn((opts) => {
    if (opts?.endpoint === "subscriptions/redeemed-memes-counts") {
      return Promise.resolve({
        count: 0,
        page: 1,
        next: null,
        data: [],
      });
    }
    if (opts?.endpoint === "new_memes_seasons") {
      return Promise.resolve([
        {
          id: 14,
          display: "SZN 14",
        },
        {
          id: 15,
          display: "SZN 15",
        },
      ]);
    }
    return Promise.resolve([]);
  }),
}));

const { commonApiFetch } = require("@/services/api/common-api");
const {
  getCardsRemainingUntilEndOf,
  isMintingToday,
} = require("@/components/meme-calendar/meme-calendar.helpers");

const mockDefaultCommonApiFetch = (opts: any) => {
  if (opts?.endpoint === "subscriptions/redeemed-memes-counts") {
    return Promise.resolve({
      count: 0,
      page: 1,
      next: null,
      data: [],
    });
  }
  if (opts?.endpoint === "new_memes_seasons") {
    return Promise.resolve([
      {
        id: 14,
        display: "SZN 14",
      },
      {
        id: 15,
        display: "SZN 15",
      },
    ]);
  }
  return Promise.resolve([]);
};

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

describe("Subscriptions report page", () => {
  const setToast = jest.fn();

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    commonApiFetch.mockImplementation(mockDefaultCommonApiFetch);
    getCardsRemainingUntilEndOf.mockReturnValue(2);
    isMintingToday.mockReturnValue(false);
    mockDownload.mockClear();
    mockUseDownloader.mockReturnValue({
      download: mockDownload,
      error: null,
      isInProgress: false,
    });
  });

  it("sets title and renders component", async () => {
    const { container } = render(
      <AuthContext.Provider value={{ setToast } as any}>
        <CookieConsentProvider>
          <Page />
        </CookieConsentProvider>
      </AuthContext.Provider>
    );
    expect(container.querySelector("main")).toBeInTheDocument();
    await waitFor(() => {
      expect(getCardsRemainingUntilEndOf).toHaveBeenCalledWith("szn");
      expect(commonApiFetch).toHaveBeenCalledTimes(4);
      expect(commonApiFetch).toHaveBeenCalledWith({
        endpoint: "policies/country-check",
      });
      expect(commonApiFetch).toHaveBeenCalledWith({
        endpoint: "subscriptions/upcoming-memes-counts?card_count=2",
      });
      expect(commonApiFetch).toHaveBeenCalledWith({
        endpoint: "subscriptions/redeemed-memes-counts",
        params: {
          page_size: "10",
          page: "1",
        },
      });
      expect(commonApiFetch).toHaveBeenCalledWith({
        endpoint: "new_memes_seasons",
      });
    });
  });

  it("moves a mint-day redeemed card into the active drop section", async () => {
    isMintingToday.mockReturnValue(true);
    commonApiFetch.mockImplementation((opts: any) => {
      if (opts?.endpoint === "subscriptions/redeemed-memes-counts") {
        return Promise.resolve({
          count: 2,
          page: 1,
          next: null,
          data: [
            {
              contract: "0xmemes",
              token_id: 700,
              count: 4,
              name: "Active Meme",
              image_url: "https://images.test/active.png",
              mint_date: new Date().toISOString(),
              szn: 15,
            },
            {
              contract: "0xmemes",
              token_id: 699,
              count: 9,
              name: "Past Meme",
              image_url: "https://images.test/past.png",
              mint_date: "2026-01-01T00:00:00.000Z",
              szn: 14,
            },
          ],
        });
      }

      if (opts?.endpoint === "subscriptions/memes/700/count") {
        return Promise.resolve({
          contract: "0xmemes",
          token_id: 700,
          count: 11,
        });
      }

      if (opts?.endpoint === "new_memes_seasons") {
        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    });

    render(
      <AuthContext.Provider value={{ setToast } as any}>
        <CookieConsentProvider>
          <Page />
        </CookieConsentProvider>
      </AuthContext.Provider>
    );

    const activeDrop = await screen.findByTestId(
      "subscriptions-report-active-drop"
    );
    expect(activeDrop).toHaveTextContent("#700 - Active Meme");
    expect(activeDrop).toHaveTextContent("Projected");
    expect(activeDrop).toHaveTextContent("Actual");
    expect(activeDrop).toHaveTextContent("11");
    expect(activeDrop).toHaveTextContent("4");

    const pastDrops = screen.getByTestId("subscriptions-report-past-drops");
    expect(within(pastDrops).queryByText("#700 - Active Meme")).toBeNull();
    expect(within(pastDrops).getByText("#699 - Past Meme")).toBeInTheDocument();

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "subscriptions/memes/700/count",
    });
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "subscriptions/upcoming-memes-counts?card_count=2",
    });
  });

  it("downloads redeemed meme counts csv for all seasons by default", async () => {
    const user = userEvent.setup();

    render(
      <AuthContext.Provider value={{ setToast } as any}>
        <CookieConsentProvider>
          <Page />
        </CookieConsentProvider>
      </AuthContext.Provider>
    );

    await user.click(await screen.findByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(mockUseDownloader).toHaveBeenCalledWith({
        headers: {
          "x-6529-auth": "stag",
          Authorization: "Bearer jwtToken",
        },
      });
    });

    expect(mockDownload).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/subscriptions/redeemed-memes-counts/download",
      "redeemed-meme-subscription-counts-all-seasons.csv"
    );
  });

  it("includes the selected season in the csv download request", async () => {
    const user = userEvent.setup();

    render(
      <AuthContext.Provider value={{ setToast } as any}>
        <CookieConsentProvider>
          <Page />
        </CookieConsentProvider>
      </AuthContext.Provider>
    );

    await user.selectOptions(
      await screen.findByLabelText("Redeemed meme subscription counts season"),
      "14"
    );
    await user.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledWith(
        "https://api.test.6529.io/api/subscriptions/redeemed-memes-counts/download?szn=14",
        "redeemed-meme-subscription-counts-szn-14.csv"
      );
    });
  });

  it("shows loading state while csv download is in progress", async () => {
    mockUseDownloader.mockReturnValue({
      download: mockDownload,
      error: null,
      isInProgress: true,
    });

    render(
      <AuthContext.Provider value={{ setToast } as any}>
        <CookieConsentProvider>
          <Page />
        </CookieConsentProvider>
      </AuthContext.Provider>
    );

    expect(
      await screen.findByRole("button", { name: "Downloading" })
    ).toBeDisabled();
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it("shows a toast when the csv download fails", async () => {
    mockUseDownloader.mockReturnValue({
      download: mockDownload,
      error: {
        errorMessage: "CSV export failed",
      },
      isInProgress: false,
    });

    render(
      <AuthContext.Provider value={{ setToast } as any}>
        <CookieConsentProvider>
          <Page />
        </CookieConsentProvider>
      </AuthContext.Provider>
    );

    await screen.findByRole("button", { name: "Download" });

    await waitFor(() => {
      expect(setToast).toHaveBeenCalledWith({
        message: "CSV export failed",
        type: "error",
      });
    });
  });

  it("exposes metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toEqual("Subscriptions Report | Tools");
    expect(metadata.description).toEqual("Tools | 6529.io");
  });
});
