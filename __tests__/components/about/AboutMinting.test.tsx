import { render, screen } from "@testing-library/react";

import AboutMinting from "@/components/about/AboutMinting";

jest.mock("@/components/about/AboutSubscriptionsProfileButton", () => ({
  __esModule: true,
  default: () => <button type="button">Connect to Subscribe</button>,
}));

describe("AboutMinting", () => {
  it("starts with the two current ways to mint", () => {
    render(<AboutMinting />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Minting The Memes" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Regular mint" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Subscription mint" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connect to Subscribe" })
    ).toBeInTheDocument();
  });

  it("links to current mint and schedule actions", () => {
    render(<AboutMinting />);

    expect(
      screen.getByRole("link", { name: "Mint the latest Meme Card" })
    ).toHaveAttribute("href", "/the-memes/mint");
    expect(
      screen.getByRole("link", { name: /Open the standalone mint page/ })
    ).toHaveAttribute("href", "https://thememes.6529.io/");
    expect(
      screen.getByRole("link", { name: "How subscription minting works" })
    ).toHaveAttribute("href", "/about/subscriptions");
    expect(
      screen.getByRole("link", { name: "View mint calendar" })
    ).toHaveAttribute("href", "/meme-calendar");
    expect(
      screen.getByRole("link", { name: "View announcements" })
    ).toHaveAttribute("href", "https://x.com/6529collections");
  });

  it("explains current phases without fixed prices or times", () => {
    render(<AboutMinting />);

    for (const name of [
      "Phase 0 — Allowlist",
      "Phase 1 — Allowlist",
      "Phase 2 — Allowlist",
      "Public phase",
    ]) {
      expect(
        screen.getByRole("heading", { level: 3, name })
      ).toBeInTheDocument();
    }

    expect(
      screen.getByText(/exact mint price and platform fee/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/0\.06529 ETH/)).not.toBeInTheDocument();
    expect(screen.queryByText(/19:20 UTC/)).not.toBeInTheDocument();
  });

  it("labels the February 2023 material as history", () => {
    const { container } = render(<AboutMinting />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Historical context: the February 2023 allowlist model",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This is historical context, not the eligibility policy for today's card."
      )
    ).toBeInTheDocument();
    expect(container.querySelector("details")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Last reviewed against the current mint and subscription flows: August 2026."
      )
    ).toBeInTheDocument();
  });
});
