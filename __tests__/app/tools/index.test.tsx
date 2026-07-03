/**
 * @jest-environment jsdom
 */

import ToolsIndexPage from "@/app/tools/page";
import { render, screen } from "@testing-library/react";

const mockSetTitle = jest.fn();

let country = "US";
let appWalletsSupported = true;

jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: () => mockSetTitle,
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: true }),
}));

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country }),
}));

jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ appWalletsSupported }),
}));

describe("Tools index page", () => {
  beforeEach(() => {
    country = "US";
    appWalletsSupported = true;
    mockSetTitle.mockClear();
  });

  it("renders grouped Tools links at /tools", () => {
    render(<ToolsIndexPage />);

    expect(
      screen.getByRole("heading", { name: "6529 Tools" })
    ).toBeInTheDocument();
    expect(screen.getByText("NFT Delegation")).toBeInTheDocument();
    expect(screen.getByText("The Memes Tools")).toBeInTheDocument();
    expect(screen.getByText("Builder Tools")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Open Data" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open tool: delegation center/i })
    ).toHaveAttribute("href", "/delegation/delegation-center");
    expect(
      screen.getByRole("link", { name: /open tool: subscriptions report/i })
    ).toHaveAttribute("href", "/tools/subscriptions-report");
    expect(
      screen.getByRole("link", { name: /open tool: app wallets/i })
    ).toHaveAttribute("href", "/tools/app-wallets");
    expect(
      screen.getByRole("link", { name: /open tool: api/i })
    ).toHaveAttribute("href", "/tools/api");
    expect(
      screen.getByRole("link", { name: /open tool: 6529bot usage/i })
    ).toHaveAttribute("href", "/open-data/6529bot");
  });

  it("hides subscription-only links for restricted iOS users", () => {
    country = "DE";

    render(<ToolsIndexPage />);

    expect(screen.queryByText("Subscriptions Report")).toBeNull();
    expect(screen.queryByText("Meme Subscriptions")).toBeNull();
    expect(screen.getByText("Meme Accounting")).toBeInTheDocument();
  });

  it("hides app-wallet links when app wallets are unavailable", () => {
    appWalletsSupported = false;

    render(<ToolsIndexPage />);

    expect(screen.queryByText("App Wallets")).toBeNull();
    expect(screen.getByText("API")).toBeInTheDocument();
  });
});
