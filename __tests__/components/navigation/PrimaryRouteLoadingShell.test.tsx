import { render, screen } from "@testing-library/react";
import PrimaryRouteLoadingShell from "@/components/navigation/PrimaryRouteLoadingShell";

describe("PrimaryRouteLoadingShell", () => {
  it.each([
    ["home", "Loading home"],
    ["cards", "Loading discovery"],
    ["network", "Loading network"],
    ["notifications", "Loading notifications"],
  ] as const)("renders the %s destination shell", (variant, ariaLabel) => {
    render(
      <PrimaryRouteLoadingShell ariaLabel={ariaLabel} variant={variant} />
    );

    expect(screen.getByRole("status", { name: ariaLabel })).toBeInTheDocument();
    expect(screen.getByTestId("primary-route-loading-shell")).toHaveClass(
      "tw-pb-28"
    );
  });
});
