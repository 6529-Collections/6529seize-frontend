import { VoteModeControl } from "@/components/voting/VoteModeControl";
import type { SingleWaveDropVoteMode } from "@/components/waves/drop/SingleWaveDropVote.types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

function VoteModeControlHarness() {
  const [mode, setMode] = useState<SingleWaveDropVoteMode>("slider");

  return <VoteModeControl value={mode} onChange={setMode} />;
}

describe("VoteModeControl", () => {
  it("labels the group and exposes the selected mode", async () => {
    render(<VoteModeControlHarness />);

    expect(
      screen.getByRole("group", { name: "Vote input mode" })
    ).toBeInTheDocument();

    const sliderButton = screen.getByRole("button", { name: "Slider" });
    const numericButton = screen.getByRole("button", { name: "Numeric" });

    expect(sliderButton).toHaveAttribute("aria-pressed", "true");
    expect(numericButton).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(numericButton);

    expect(sliderButton).toHaveAttribute("aria-pressed", "false");
    expect(numericButton).toHaveAttribute("aria-pressed", "true");
  });
});
