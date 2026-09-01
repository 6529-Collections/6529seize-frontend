import WaveViewLoadingPlaceholder from "@/components/waves/WaveViewLoadingPlaceholder";
import { render, screen } from "@testing-library/react";

describe("WaveViewLoadingPlaceholder", () => {
  it("keeps a composer-sized loading row in the wave shell", () => {
    render(<WaveViewLoadingPlaceholder />);

    expect(
      screen.getByRole("status", { name: "Loading waves" })
    ).toBeInTheDocument();
    const composer = screen.getByTestId("posting-access-skeleton");
    expect(composer).toHaveAttribute("aria-hidden", "true");
    expect(composer).toHaveClass("tw-min-h-11");
  });
});
