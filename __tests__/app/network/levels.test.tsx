import LevelsClient from "@/app/network/levels/page.client";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockUseAuth = jest.fn();

// Mock child components
jest.mock("@/components/levels/ProgressChart", () => () => (
  <div data-testid="progress-chart" />
));
jest.mock("@/components/levels/TableOfLevels", () => () => (
  <div data-testid="table-of-levels" />
));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: "US" }),
  useOptionalCookieConsent: () => ({ country: "US" }),
}));

jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ appWalletsSupported: false }),
}));

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

describe("LevelsPage (App Router)", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: null,
      fetchingProfile: false,
      isAuthenticated: false,
    });
  });

  it("sets title and renders components", () => {
    render(<LevelsClient />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Levels" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("progress-chart")).toBeInTheDocument();
    expect(screen.getByTestId("table-of-levels")).toBeInTheDocument();

    // Ensure key explanatory text appears
    expect(
      screen.getByText(/Levels are our integrated metric/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/they may be adjusted to better meet their objectives/i)
    ).toBeInTheDocument();
  });

  it("shows the authenticated active profile summary", () => {
    mockUseAuth.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { level: 2, rep: 20, tdh: 30 },
      fetchingProfile: false,
      isAuthenticated: true,
    });

    render(<LevelsClient />);

    const summary = screen.getByRole("region", { name: "Your Level" });
    expect(summary).toHaveTextContent("Your Level2");
    expect(summary).toHaveTextContent("50");
    expect(summary).toHaveTextContent("To reach Level 3");
    expect(summary).toHaveTextContent("50 more TDH + Rep");
  });

  it.each([
    {
      label: "signed out",
      auth: {
        activeProfileProxy: null,
        connectedProfile: { level: 2, rep: 20, tdh: 30 },
        fetchingProfile: false,
        isAuthenticated: false,
      },
    },
    {
      label: "loading",
      auth: {
        activeProfileProxy: null,
        connectedProfile: null,
        fetchingProfile: true,
        isAuthenticated: true,
      },
    },
    {
      label: "missing a profile",
      auth: {
        activeProfileProxy: null,
        connectedProfile: null,
        fetchingProfile: false,
        isAuthenticated: true,
      },
    },
  ])("does not show a personalized summary when $label", ({ auth }) => {
    mockUseAuth.mockReturnValue(auth);

    render(<LevelsClient />);

    expect(
      screen.queryByRole("region", { name: "Your Level" })
    ).not.toBeInTheDocument();
  });

  it("uses the active proxy profile instead of the connected profile", () => {
    mockUseAuth.mockReturnValue({
      activeProfileProxy: {
        created_by: { level: 5, rep: 200, tdh: 300 },
      },
      connectedProfile: { level: 2, rep: 20, tdh: 30 },
      fetchingProfile: false,
      isAuthenticated: true,
    });

    render(<LevelsClient />);

    const summary = screen.getByRole("region", { name: "Your Level" });
    expect(summary).toHaveTextContent("Your Level5");
    expect(summary).toHaveTextContent("500");
    expect(summary).toHaveTextContent("To reach Level 6");
    expect(summary).toHaveTextContent("500 more TDH + Rep");
  });

  it("exports correct metadata", async () => {
    const { generateMetadata } = require("@/app/network/levels/page");
    const metadata = await generateMetadata();
    expect(metadata).toMatchObject({
      title: "Levels | Network",
      description: expect.stringContaining("Network"),
      twitter: { card: "summary" },
      openGraph: {
        title: "Levels | Network",
        description: expect.stringContaining("Network"),
        images: ["https://test.6529.io/6529io.png"],
      },
    });
  });
});
