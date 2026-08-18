import { render, screen } from "@testing-library/react";

import AboutMinting from "@/components/about/AboutMinting";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type MintingMessageKey = Extract<MessageKey, `about.minting.${string}`>;

const m = (key: MintingMessageKey, params: Parameters<typeof t>[2] = {}) =>
  t(DEFAULT_LOCALE, key, params);

jest.mock("@/components/about/AboutSubscriptionsProfileButton", () => ({
  __esModule: true,
  default: () => <button type="button">Connect to Subscribe</button>,
}));

describe("AboutMinting", () => {
  it("starts with the two current ways to mint", () => {
    render(<AboutMinting />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: m("about.minting.hero.title"),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: m("about.minting.start.regular.title"),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: m("about.minting.start.subscription.title"),
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("links to current mint, schedule, and reference actions", () => {
    const { container } = render(<AboutMinting />);

    expect(
      screen.getByRole("link", {
        name: m("about.minting.start.regular.action"),
      })
    ).toHaveAttribute("href", "/the-memes/mint");
    expect(
      screen.getByRole("link", {
        name: m("about.minting.start.regular.standalone"),
      })
    ).toHaveAttribute("href", "https://thememes.6529.io/");
    expect(
      screen.getByRole("link", {
        name: m("about.minting.start.subscription.learnMore"),
      })
    ).toHaveAttribute("href", "/about/subscriptions");
    expect(
      screen.getByRole("link", {
        name: m("about.minting.start.schedule.calendarAction"),
      })
    ).toHaveAttribute("href", "/meme-calendar");
    expect(
      screen.getByRole("link", {
        name: m("about.minting.start.schedule.announcementsAction"),
      })
    ).toHaveAttribute("href", "https://x.com/6529collections");

    for (const [key, href] of [
      [
        "about.minting.reference.resources.subscriptionsReport",
        "/tools/subscriptions-report",
      ],
      ["about.minting.reference.resources.openData", "/open-data"],
      [
        "about.minting.reference.resources.networkDefinitions",
        "/network/definitions",
      ],
    ] as const satisfies readonly (readonly [MintingMessageKey, string])[]) {
      expect(screen.getByRole("link", { name: m(key) })).toHaveAttribute(
        "href",
        href
      );
    }

    const externalLinks = [
      ...container.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'),
    ];
    expect(externalLinks).toHaveLength(2);
    for (const link of externalLinks) {
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    for (const link of container.querySelectorAll<HTMLAnchorElement>("a")) {
      expect(link.getAttribute("href")).not.toMatch(/^javascript:/i);
    }
  });

  it("explains current phases without fixed prices or times", () => {
    render(<AboutMinting />);

    for (const key of [
      "about.minting.phases.phase0.title",
      "about.minting.phases.phase1.title",
      "about.minting.phases.phase2.title",
      "about.minting.phases.public.title",
    ] as const satisfies readonly MintingMessageKey[]) {
      expect(
        screen.getByRole("heading", { level: 3, name: m(key) })
      ).toBeInTheDocument();
    }

    expect(
      screen.getByText(m("about.minting.phases.live.description"))
    ).toBeInTheDocument();
    expect(screen.queryByText(/0\.06529 ETH/)).not.toBeInTheDocument();
    expect(screen.queryByText(/19:20 UTC/)).not.toBeInTheDocument();
  });

  it("labels the February 2023 material as history", () => {
    const { container } = render(<AboutMinting />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: m("about.minting.reference.history.title"),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(m("about.minting.reference.history.notice"))
    ).toBeInTheDocument();
    expect(container.querySelector("details")).toBeInTheDocument();

    const reviewNote =
      container.querySelector<HTMLElement>("[data-reviewed-at]");
    expect(reviewNote).toBeInTheDocument();
    const reviewedDate = reviewNote?.dataset["reviewedAt"];
    if (!reviewedDate) {
      throw new Error("Expected a structured minting-guide review date");
    }
    expect(reviewedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const reviewedAt = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    }).format(new Date(`${reviewedDate}T00:00:00Z`));
    expect(reviewNote).toHaveTextContent(
      m("about.minting.reference.reviewed", { reviewedAt })
    );
  });
});
