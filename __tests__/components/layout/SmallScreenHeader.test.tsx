import { render, screen } from "@testing-library/react";

import SmallScreenHeader from "@/components/layout/SmallScreenHeader";

let pathname = "/the-memes";
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => searchParams,
}));

jest.mock("@/components/header/share/HeaderPageShareButton", () => ({
  __esModule: true,
  default: () => <button type="button">Share page</button>,
}));

jest.mock("@/components/header/header-search/HeaderSearchButton", () => ({
  __esModule: true,
  default: () => <button type="button">Search</button>,
}));

jest.mock("@/components/header/NetworkHealthCTA", () => ({
  __esModule: true,
  default: () => <div>Network health</div>,
}));

jest.mock("@/components/common/EnvironmentBadge", () => ({
  __esModule: true,
  default: () => null,
}));

describe("SmallScreenHeader page sharing", () => {
  beforeEach(() => {
    pathname = "/the-memes";
    searchParams = new URLSearchParams();
  });

  it("shows Share on a supported mobile-browser route", () => {
    render(
      <SmallScreenHeader onMenuToggle={jest.fn()} isMenuOpen={false} />
    );

    expect(
      screen.getByRole("button", { name: "Share page" })
    ).toBeInTheDocument();
  });

  it("keeps Share available in the waves query view", () => {
    pathname = "/alice";
    searchParams = new URLSearchParams("view=waves");

    render(
      <SmallScreenHeader onMenuToggle={jest.fn()} isMenuOpen={false} />
    );

    expect(
      screen.getByRole("button", { name: "Share page" })
    ).toBeInTheDocument();
  });

  it.each(["/", "/messages/create", "/notifications/settings"])(
    "hides Share on unsupported mobile-browser route %s",
    (unsupportedPathname) => {
      pathname = unsupportedPathname;

      render(
        <SmallScreenHeader onMenuToggle={jest.fn()} isMenuOpen={false} />
      );

      expect(
        screen.queryByRole("button", { name: "Share page" })
      ).not.toBeInTheDocument();
    }
  );

  it("hides Share in the messages query view", () => {
    pathname = "/alice";
    searchParams = new URLSearchParams("view=messages");

    render(
      <SmallScreenHeader onMenuToggle={jest.fn()} isMenuOpen={false} />
    );

    expect(
      screen.queryByRole("button", { name: "Share page" })
    ).not.toBeInTheDocument();
  });
});
