import HomeNewcomerIntro from "@/components/home/newcomer/HomeNewcomerIntro";
import { getHomepageClick } from "@/components/home/homepageTracking";
import HomeHowToStart from "@/components/home/newcomer/HomeHowToStart";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import useCapacitor from "@/hooks/useCapacitor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({ useBrowserLocale: jest.fn() }));

const connect = jest.fn();
const walletContext: Pick<
  ReturnType<typeof useSeizeConnectContext>,
  "seizeConnectFresh" | "seizeConnectOpen"
> = {
  seizeConnectFresh: connect,
  seizeConnectOpen: false,
};
const authContext: Pick<ReturnType<typeof useAuth>, "setToast"> = {
  setToast: jest.fn(),
};
beforeEach(() => {
  jest.clearAllMocks();
  walletContext.seizeConnectOpen = false;
  jest.mocked(useBrowserLocale).mockReturnValue("en-US");
  jest
    .mocked(useAuth)
    .mockReturnValue(authContext as ReturnType<typeof useAuth>);
  jest
    .mocked(useSeizeConnectContext)
    .mockReturnValue(
      walletContext as ReturnType<typeof useSeizeConnectContext>
    );
  jest
    .mocked(useCapacitor)
    .mockReturnValue({ isIos: false } as ReturnType<typeof useCapacitor>);
  jest
    .mocked(useCookieConsent)
    .mockReturnValue({ country: "US", isCountryPending: false } as ReturnType<
      typeof useCookieConsent
    >);
});

it.each(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"] as const)(
  "keeps the approved four steps and existing routes in %s",
  (locale) => {
    jest.mocked(useBrowserLocale).mockReturnValue(locale);
    render(<HomeHowToStart />);
    expect(screen.getByText("Four steps into 6529.")).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(
      screen
        .getAllByRole("heading", { level: 3 })
        .map((step) => step.textContent)
    ).toEqual([
      "Connect wallet",
      "Create profile",
      "Join a Wave",
      "Collect or create",
    ]);
    expect(
      screen.getByRole("link", { name: "Create profile" })
    ).toHaveAttribute("href", "/join-6529#join-step-profile");
    expect(
      screen.queryByRole("link", { name: "Collect or create" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hold Meme Cards" })).toHaveAttribute(
      "href", "/the-memes"
    );
    expect(screen.getByRole("link", { name: "submit your own art" })).toHaveAttribute(
      "href", "/about/apply"
    );
    expect(
      screen.getByRole("heading", { name: "Collect or create" }).parentElement?.querySelector("p")
    ).toHaveTextContent("Hold Meme Cards to earn voting weight, or submit your own art.");
    expect(
      screen.queryByRole("link", { name: "Browse The Memes" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Submit your art" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join a Wave" })).toHaveAttribute(
      "href",
      "/waves"
    );
    expect(
      screen.getByRole("link", { name: "Read the full guide" })
    ).toHaveAttribute("href", "/join-6529");
    expect(
      screen.queryByRole("link", { name: "Do I need a wallet or ETH to start?" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Browse first, connect when ready.")
    ).not.toBeInTheDocument();
  }
);

it.each([
  ["restricted iOS", true, "EE", false],
  ["unknown-country iOS", true, "", false],
  ["US iOS", true, "US", true],
  ["Android", false, "EE", true],
  ["web", false, "", true],
] as const)(
  "preserves purchasing visibility on %s",
  (_name, isIos, country, allowed) => {
    jest
      .mocked(useCapacitor)
      .mockReturnValue({ isIos } as ReturnType<typeof useCapacitor>);
    jest.mocked(useCookieConsent).mockReturnValue({
      country,
      isCountryPending: country === "",
    } as ReturnType<typeof useCookieConsent>);
    render(<HomeHowToStart />);
    const description = screen.getByRole("heading", {
      name: "Collect or create",
    }).parentElement?.querySelector("p");
    expect(description).toHaveTextContent(
      allowed
        ? "Hold Meme Cards to earn voting weight, or submit your own art."
        : "Explore the art and take part in the community."
    );
    expect(Boolean(screen.queryByRole("link", { name: "Hold Meme Cards" }))).toBe(allowed);
    expect(Boolean(screen.queryByRole("link", { name: "submit your own art" }))).toBe(allowed);
  }
);

it("omits purchasing promotions from server HTML", () => {
  const html = renderToString(<HomeHowToStart />);
  expect(html).not.toContain("Hold Meme Cards");
  expect(html).not.toContain('href="/about/apply"');
});

it("opens the existing wallet flow and reflects an already open chooser", async () => {
  const user = userEvent.setup();
  const sections = (
    <>
      <HomeNewcomerIntro />
      <HomeHowToStart />
    </>
  );
  const { rerender } = render(sections);
  await user.click(
    screen.getAllByRole("button", { name: "Connect wallet" })[1]!
  );
  expect(connect).toHaveBeenCalledTimes(1);
  walletContext.seizeConnectOpen = true;
  rerender(
    <>
      <HomeNewcomerIntro />
      <HomeHowToStart />
    </>
  );
  for (const button of screen.getAllByRole("button", {
    name: "Opening wallet",
  })) {
    expect(button).toBeDisabled();
  }
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status")).toHaveTextContent("Opening wallet");
});

it("tracks every getting-started action using fixed analytics labels", () => {
  const { container } = render(<HomeHowToStart />);
  for (const [name, action] of [
    ["Connect wallet", "Connect wallet"],
    ["Create profile", "Create profile"],
    ["Hold Meme Cards", "View collections"],
    ["submit your own art", "About submissions"],
    ["Join a Wave", "Browse Waves"],
    ["Read the full guide", "Get started"],
  ] as const) {
    const target =
      name === "Connect wallet"
        ? screen.getByRole("button", { name })
        : screen.getByRole("link", { name });
    expect(getHomepageClick(container, target)).toEqual({
      section: "How to start",
      action,
    });
  }
});
