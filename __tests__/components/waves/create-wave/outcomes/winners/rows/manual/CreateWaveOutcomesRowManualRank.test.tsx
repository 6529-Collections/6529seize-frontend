import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveOutcomesRowManualRank from "@/components/waves/create-wave/outcomes/winners/rows/manual/CreateWaveOutcomesRowManualRank";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";

const outcome = {
  title: "Winner",
  winnersConfig: {
    winners: [
      { value: 1 },
      { value: 1 },
      { value: 1 },
      { value: 0 },
      { value: 1 },
    ],
  },
} as CreateWaveOutcomeConfig;

describe("CreateWaveOutcomesRowManualRank", () => {
  it("shows outcome title and compressed winning ranks", () => {
    render(
      <CreateWaveOutcomesRowManualRank
        outcome={outcome}
        removeOutcome={jest.fn()}
      />
    );
    expect(screen.getByText("Winner")).toBeInTheDocument();
    expect(screen.getByText("Winning ranks: 1-3, 5")).toBeInTheDocument();
  });

  it("calls removeOutcome on click", async () => {
    const user = userEvent.setup();
    const removeOutcome = jest.fn();
    render(
      <CreateWaveOutcomesRowManualRank
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    );
    await user.click(screen.getByLabelText("Remove outcome"));
    expect(removeOutcome).toHaveBeenCalled();
  });
});
