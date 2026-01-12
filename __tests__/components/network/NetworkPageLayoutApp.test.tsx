import { render, screen } from "@testing-library/react";
import NetworkPageLayoutApp from "@/components/network/NetworkPageLayoutApp";

describe("NetworkPageLayoutApp", () => {
  it("renders children", () => {
    render(
      <NetworkPageLayoutApp>
        <div data-testid="child">Child Content</div>
      </NetworkPageLayoutApp>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders with correct layout classes", () => {
    const { container } = render(
      <NetworkPageLayoutApp>
        <div>Content</div>
      </NetworkPageLayoutApp>
    );

    const main = container.querySelector("main");
    expect(main).toHaveClass("tw-bg-iron-950");
  });
});
