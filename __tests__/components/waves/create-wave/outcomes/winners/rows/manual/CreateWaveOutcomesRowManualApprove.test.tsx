import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveOutcomesRowManualApprove from "@/components/waves/create-wave/outcomes/winners/rows/manual/CreateWaveOutcomesRowManualApprove";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";

describe("CreateWaveOutcomesRowManualApprove", () => {
  const outcome: CreateWaveOutcomeConfig = {
    type: 0 as any,
    title: "Winner",
    credit: null,
    category: null,
    winnersConfig: null,
  };

  it("displays title without max winners", () => {
    render(
      <CreateWaveOutcomesRowManualApprove
        outcome={outcome}
        removeOutcome={jest.fn()}
      />
    );
    expect(screen.getByText("Winner")).toBeInTheDocument();
    expect(screen.queryByText(/Max winners/i)).not.toBeInTheDocument();
  });

  it("calls removeOutcome on button click", async () => {
    const user = userEvent.setup();
    const remove = jest.fn();
    render(
      <CreateWaveOutcomesRowManualApprove
        outcome={outcome}
        removeOutcome={remove}
      />
    );
    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(remove).toHaveBeenCalled();
  });
});
