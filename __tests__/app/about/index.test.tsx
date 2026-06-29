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
      screen.getByRole("heading", { name: "About 6529" })
    ).toBeInTheDocument();
    expect(screen.getByText("Collections")).toBeInTheDocument();
    expect(screen.getByText("Delegation")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open page: the memes/i })
    ).toHaveAttribute("href", "/about/the-memes");
    expect(screen.queryByRole("link", { name: /mission/i })).toBeNull();
    expect(
      screen.getByRole("link", { name: /open page: tdh/i })
    ).toHaveAttribute("href", "/network/tdh");
    expect(
      screen.getByRole("link", { name: /open page: xtdh/i })
    ).toHaveAttribute("href", "/network/xtdh");
    expect(
      screen.getByRole("link", { name: /open page: health/i })
    ).toHaveAttribute("href", "/network/health");
    expect(
      screen.getByRole("link", { name: /open page: definitions/i })
    ).toHaveAttribute("href", "/network/definitions");
    expect(
      screen.getByRole("link", { name: /open page: levels/i })
    ).toHaveAttribute("href", "/network/levels");
    expect(
      screen.getByRole("link", { name: /open page: network tdh/i })
    ).toHaveAttribute("href", "/network/health/network-tdh");
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

    expect(screen.queryByText("Subscriptions")).toBeNull();
  });
});
