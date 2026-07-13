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
      screen.getByRole("heading", {
        name: "Subscription Minting",
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
    expect(reportLink).toHaveClass("tw-no-underline");
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

  it("shows all original information sections", () => {
    const { container } = render(<AboutSubscriptions />);

    expect(
      screen.getByRole("heading", { name: "Overview" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How it Works" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Gas Savings" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Remote Minting" })
    ).toBeInTheDocument();
    expect(container.querySelector("details")).toBeInTheDocument();
    expect(screen.getByText("Delegation")).toBeInTheDocument();
  });
});
