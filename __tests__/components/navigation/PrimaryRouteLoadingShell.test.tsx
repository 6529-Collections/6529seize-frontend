import { render, screen } from "@testing-library/react";
import PrimaryRouteLoadingShell from "@/components/navigation/PrimaryRouteLoadingShell";

describe("PrimaryRouteLoadingShell", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, "languages", {
      configurable: true,
      value: ["en-US"],
    });
  });

  it.each([
    ["home", "navigation.primary.loading.home", "Loading home"],
    ["cards", "navigation.primary.loading.discovery", "Loading discovery"],
    ["network", "navigation.primary.loading.network", "Loading network"],
    [
      "notifications",
      "navigation.primary.loading.notifications",
      "Loading notifications",
    ],
  ] as const)(
    "renders the %s destination shell",
    async (variant, messageKey, label) => {
      render(
        <PrimaryRouteLoadingShell messageKey={messageKey} variant={variant} />
      );

      expect(await screen.findByRole("status")).toHaveTextContent(label);
      expect(screen.getByTestId("primary-route-loading-shell")).toHaveClass(
        "tw-pb-28"
      );
      expect(screen.queryByRole("main")).not.toBeInTheDocument();
    }
  );

  it("localizes its status using the browser locale", async () => {
    Object.defineProperty(globalThis.navigator, "languages", {
      configurable: true,
      value: ["de-DE"],
    });

    render(
      <PrimaryRouteLoadingShell
        messageKey="navigation.primary.loading.notifications"
        variant="notifications"
      />
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Benachrichtigungen werden geladen"
    );
  });
});
