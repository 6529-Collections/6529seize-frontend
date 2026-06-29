/**
 * @jest-environment jsdom
 */

import AboutIndexPage from "@/app/about/page";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: true }),
}));

let country = "US";
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country }),
}));

describe("About index page", () => {
  beforeEach(() => {
    country = "US";
  });

  it("renders grouped About links at /about", () => {
    render(<AboutIndexPage />);

    expect(
      screen.getByRole("heading", { name: "About 6529" })
    ).toBeInTheDocument();
    expect(screen.getByText("Collections")).toBeInTheDocument();
    expect(screen.getByText("Delegation")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open about page: the memes/i })
    ).toHaveAttribute("href", "/about/the-memes");
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
