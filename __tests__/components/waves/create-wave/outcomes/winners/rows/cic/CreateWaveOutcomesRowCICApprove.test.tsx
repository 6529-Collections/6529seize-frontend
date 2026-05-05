import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveOutcomesRowCICApprove from "@/components/waves/create-wave/outcomes/winners/rows/cic/CreateWaveOutcomesRowCICApprove";

const outcome = { credit: 1000 } as any;

describe("CreateWaveOutcomesRowCICApprove", () => {
  it("displays formatted credit without max winners", () => {
    render(
      <CreateWaveOutcomesRowCICApprove
        outcome={outcome}
        removeOutcome={jest.fn()}
      />
    );
    expect(screen.getByText("1K NIC")).toBeInTheDocument();
    expect(screen.queryByText(/Max winners/i)).not.toBeInTheDocument();
  });

  it("calls removeOutcome on button click", async () => {
    const user = userEvent.setup();
    const removeOutcome = jest.fn();
    render(
      <CreateWaveOutcomesRowCICApprove
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    );
    await user.click(screen.getByLabelText("Remove"));
    expect(removeOutcome).toHaveBeenCalled();
  });
});
