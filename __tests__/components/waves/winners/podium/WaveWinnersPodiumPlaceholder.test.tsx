import React from "react";
import { render, screen } from "@testing-library/react";
import { WaveWinnersPodiumPlaceholder } from "@/components/waves/winners/podium/WaveWinnersPodiumPlaceholder";

it("keeps an unfilled place decorative and non-interactive", () => {
  const { container } = render(
    <WaveWinnersPodiumPlaceholder position="second" />
  );
  expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
