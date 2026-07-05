import Page, { generateMetadata } from "@/app/tools/subscriptions-report/page";
import { AuthContext } from "@/components/auth/Auth";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import { render, screen, waitFor } from "@testing-library/react";
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

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  __esModule: true,
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
} = require("@/components/meme-calendar/meme-calendar.helpers");

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
