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
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(
      screen.getByRole("link", { name: "Create profile" })
    ).toHaveAttribute("href", "/join-6529#join-step-profile");
    expect(
      screen.getByRole("link", { name: "Create, collect or vote" })
    ).toHaveAttribute("href", "/the-memes");
    expect(
      screen.getByRole("link", { name: "Join the community" })
    ).toHaveAttribute("href", "/waves");
    expect(
      screen.getByRole("link", { name: "Open the Join 6529 guide" })
    ).toHaveAttribute("href", "/join-6529");
    expect(
      screen.getByRole("link", { name: "Do I need a wallet or ETH to start?" })
    ).toHaveAttribute("href", "/join-6529#faq");
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
    expect(Boolean(screen.queryByText(/Submit art, mint or subscribe/))).toBe(
      allowed
    );
    expect(
      screen.getByRole("link", { name: "Create, collect or vote" })
    ).toBeVisible();
  }
);

it("omits purchasing promotions from server HTML", () => {
  expect(renderToString(<HomeHowToStart />)).not.toContain("mint or subscribe");
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
    ["Create, collect or vote", "View collections"],
    ["Join the community", "Browse Waves"],
    ["Open the Join 6529 guide", "Get started"],
    ["Do I need a wallet or ETH to start?", "Getting started FAQ"],
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
