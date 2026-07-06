import Page, { generateMetadata } from "@/app/tools/subscriptions-report/page";
import { AuthContext } from "@/components/auth/Auth";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockDownload = jest.fn();
const mockRouterPush = jest.fn();
const mockUseDownloader = jest.fn();

jest.mock("react-use-downloader", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseDownloader(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
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
  getUpcomingMintsAcrossSeasons,
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
    getUpcomingMintsAcrossSeasons.mockReturnValue([]);
    isMintingToday.mockReturnValue(false);
    mockDownload.mockClear();
    mockRouterPush.mockClear();
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
    expect(activeDrop).toHaveTextContent("Subscribed");
    expect(activeDrop).toHaveTextContent("Airdropped");
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

  it("opens meme card routes from report rows while keeping visible links native", async () => {
    const user = userEvent.setup();
    const windowOpen = jest
      .spyOn(window, "open")
      .mockImplementation(() => null);

    isMintingToday.mockReturnValue(true);
    getUpcomingMintsAcrossSeasons.mockReturnValue([
      {
        seasonIndex: 15,
        utcDay: new Date("2026-01-03T00:00:00.000Z"),
      },
    ]);
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

      if (
        opts?.endpoint === "subscriptions/upcoming-memes-counts?card_count=2"
      ) {
        return Promise.resolve([
          {
            contract: "0xmemes",
            token_id: 701,
            count: 8,
          },
        ]);
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

    const activeLink = await screen.findByRole("link", {
      name: "View The Memes card #700 - Active Meme",
    });
    expect(activeLink).toHaveAttribute("href", "/the-memes/700");
    const activeRow = activeLink.closest("tr");
    expect(activeRow).not.toBeNull();

    await user.click(activeRow!);
    expect(mockRouterPush).toHaveBeenLastCalledWith("/the-memes/700");

    mockRouterPush.mockClear();
    await user.click(activeLink);
    expect(mockRouterPush).not.toHaveBeenCalled();

    const upcomingLink = screen.getByRole("link", {
      name: "View The Memes card #701",
    });
    expect(upcomingLink).toHaveAttribute("href", "/the-memes/701");
    const upcomingRow = upcomingLink.closest("tr");
    expect(upcomingRow).not.toBeNull();
    await user.click(upcomingRow!);
    expect(mockRouterPush).toHaveBeenLastCalledWith("/the-memes/701");

    mockRouterPush.mockClear();
    fireEvent.click(upcomingRow!, { metaKey: true });
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(windowOpen).toHaveBeenLastCalledWith(
      "/the-memes/701",
      "_blank",
      "noopener,noreferrer"
    );

    const pastLink = screen.getByRole("link", {
      name: "View The Memes card #699 - Past Meme",
    });
    expect(pastLink).toHaveAttribute("href", "/the-memes/699");
    const pastRow = pastLink.closest("tr");
    expect(pastRow).not.toBeNull();
    fireEvent(
      pastRow!,
      new MouseEvent("auxclick", { bubbles: true, button: 1 })
    );
    expect(windowOpen).toHaveBeenLastCalledWith(
      "/the-memes/699",
      "_blank",
      "noopener,noreferrer"
    );
    windowOpen.mockRestore();
  });

  it("formats active, upcoming, and past counts with locale separators", async () => {
    isMintingToday.mockReturnValue(true);
    getUpcomingMintsAcrossSeasons.mockReturnValue([
      {
        seasonIndex: 15,
        utcDay: new Date("2026-01-03T00:00:00.000Z"),
      },
    ]);
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
              count: 1000,
              name: "Active Meme",
              image_url: "https://images.test/active.png",
              mint_date: new Date().toISOString(),
              szn: 15,
            },
            {
              contract: "0xmemes",
              token_id: 699,
              count: 9876,
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
          count: 1234,
        });
      }

      if (
        opts?.endpoint === "subscriptions/upcoming-memes-counts?card_count=2"
      ) {
        return Promise.resolve([
          {
            contract: "0xmemes",
            token_id: 701,
            count: 4567,
          },
        ]);
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
    expect(activeDrop).toHaveTextContent("1,234");
    expect(activeDrop).toHaveTextContent("1,000");

    const upcomingDrops = screen.getByTestId(
      "subscriptions-report-upcoming-drops"
    );
    expect(within(upcomingDrops).getByText("4,567")).toBeInTheDocument();

    const pastDrops = screen.getByTestId("subscriptions-report-past-drops");
    expect(within(pastDrops).getByText("9,876")).toBeInTheDocument();
  });

  it("keeps active and past drops when upcoming counts fail", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
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

      if (
        opts?.endpoint === "subscriptions/upcoming-memes-counts?card_count=2"
      ) {
        return Promise.reject(new Error("Upcoming unavailable"));
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
    expect(activeDrop).toHaveTextContent("11");

    const pastDrops = screen.getByTestId("subscriptions-report-past-drops");
    expect(within(pastDrops).getByText("#699 - Past Meme")).toBeInTheDocument();
    expect(within(pastDrops).queryByText("#700 - Active Meme")).toBeNull();

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to fetch upcoming subscriptions:",
      expect.any(Error)
    );
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
