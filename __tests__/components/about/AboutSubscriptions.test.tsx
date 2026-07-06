import { render, screen } from "@testing-library/react";
import AboutSubscriptions from "@/components/about/AboutSubscriptions";

jest.mock("@/components/about/AboutSubscriptionsProfileButton", () => ({
  __esModule: true,
  default: () => <button type="button">Connect to Subscribe</button>,
}));

describe("AboutSubscriptions", () => {
  it("renders heading", () => {
    render(<AboutSubscriptions />);
    expect(
      screen.getByRole("heading", { name: /Subscription/ })
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
      name: "Subscription Minting",
    });
    const action = screen.getByRole("button", {
      name: "Connect to Subscribe",
    });

    expect(action.compareDocumentPosition(heading)).toBe(
      Node.DOCUMENT_POSITION_PRECEDING
    );
  });
});
