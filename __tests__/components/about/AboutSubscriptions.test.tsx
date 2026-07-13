import { render, screen } from "@testing-library/react";
import AboutSubscriptions from "@/components/about/AboutSubscriptions";

jest.mock("@/components/about/AboutSubscriptionsProfileButton", () => ({
  __esModule: true,
  default: ({
    actionContext,
  }: {
    readonly actionContext?: "hero" | "final";
  }) => (
    <button
      aria-label={
        actionContext === "hero"
          ? "Connect wallet to subscribe from the introduction"
          : "Connect wallet to subscribe after reading the guide"
      }
      type="button"
    >
      Connect wallet to subscribe
    </button>
  ),
}));

describe("AboutSubscriptions", () => {
  it("renders heading", () => {
    render(<AboutSubscriptions />);
    expect(
      screen.getByRole("heading", {
        name: "Choose your Meme Cards. Skip the drop-time scramble.",
        level: 1,
      })
    ).toBeInTheDocument();
  });

  it("links to the subscriptions report", () => {
    render(<AboutSubscriptions />);

    const reportLink = screen.getByRole("link", {
      name: "Subscriptions Report",
    });
    expect(reportLink).toHaveAttribute("href", "/tools/subscriptions-report");
    expect(reportLink).toHaveClass("tw-text-primary-300");
    expect(reportLink).not.toHaveClass("tw-underline");
  });

  it("places the subscription action in the page content", () => {
    render(<AboutSubscriptions />);

    const heading = screen.getByRole("heading", {
      name: "Choose your Meme Cards. Skip the drop-time scramble.",
    });
    const action = screen.getByRole("button", {
      name: "Connect wallet to subscribe from the introduction",
    });

    expect(action.compareDocumentPosition(heading)).toBe(
      Node.DOCUMENT_POSITION_PRECEDING
    );
  });

  it("gives repeated subscription actions distinct accessible names", () => {
    render(<AboutSubscriptions />);

    expect(
      screen.getByRole("button", {
        name: "Connect wallet to subscribe from the introduction",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Connect wallet to subscribe after reading the guide",
      })
    ).toBeInTheDocument();
  });
});
