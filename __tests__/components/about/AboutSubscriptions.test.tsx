import { render, screen } from "@testing-library/react";
import AboutSubscriptions from "@/components/about/AboutSubscriptions";

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
});
