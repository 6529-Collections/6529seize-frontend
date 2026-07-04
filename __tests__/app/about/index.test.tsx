/**
 * @jest-environment jsdom
 */

import AboutIndexPage from "@/app/about/page";
import { render, screen } from "@testing-library/react";

const mockSetTitle = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: () => mockSetTitle,
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: true }),
}));

jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ appWalletsSupported: false }),
}));

let country = "US";
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country }),
  useOptionalCookieConsent: () => ({ country }),
}));

describe("About index page", () => {
  beforeEach(() => {
    country = "US";
    mockSetTitle.mockClear();
  });

  it("renders grouped About links at /about", () => {
    render(<AboutIndexPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "About 6529" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("About 6529").length).toBeGreaterThan(0);
    expect(screen.getByText("Collections & Minting")).toBeInTheDocument();
    expect(screen.getByText("Network & Reputation")).toBeInTheDocument();
    expect(screen.getByText("Delegation & Wallets")).toBeInTheDocument();
    expect(screen.getByText("Data & Developer Tools")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open page: about the memes/i })
    ).toHaveAttribute("href", "/about/the-memes");
    expect(screen.queryByRole("link", { name: /mission/i })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Open page: TDH" })
    ).toHaveAttribute("href", "/network/tdh");
    expect(
      screen.getByRole("link", { name: /open page: xtdh overview/i })
    ).toHaveAttribute("href", "/network/xtdh");
    expect(
      screen.getByRole("link", {
        name: /open page: xtdh allocations dashboard/i,
      })
    ).toHaveAttribute("href", "/xtdh");
    expect(
      screen.getByRole("link", { name: /open page: network health/i })
    ).toHaveAttribute("href", "/network/health");
    expect(
      screen.getByRole("link", { name: /open page: network definitions/i })
    ).toHaveAttribute("href", "/network/definitions");
    expect(
      screen.getByRole("link", { name: /open page: levels/i })
    ).toHaveAttribute("href", "/network/levels");
    expect(
      screen.getByRole("link", { name: /open page: network tdh stats/i })
    ).toHaveAttribute("href", "/network/health/network-tdh");
    expect(
      screen.getByRole("link", { name: /open page: network nerd/i })
    ).toHaveAttribute("href", "/network/nerd");
    expect(
      screen.getByRole("link", { name: /open page: prenodes/i })
    ).toHaveAttribute("href", "/network/prenodes");
  });

  it("does not render the sticky contents dropdown", () => {
    render(<AboutIndexPage />);

    expect(
      screen.queryByRole("button", {
        name: /open about contents navigation/i,
      })
    ).toBeNull();
  });

  it("keeps subscription links hidden for restricted iOS users", () => {
    country = "DE";

    render(<AboutIndexPage />);

    expect(screen.queryByText("Subscription Minting")).toBeNull();
  });
});
