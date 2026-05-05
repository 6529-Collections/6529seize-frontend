import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveOutcomesRowCICRank from "@/components/waves/create-wave/outcomes/winners/rows/cic/CreateWaveOutcomesRowCICRank";

// Mock formatLargeNumber to ensure consistent formatting
jest.mock("@/helpers/Helpers", () => ({
  formatLargeNumber: jest.fn((num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }),
}));

const outcome = { winnersConfig: { totalAmount: 1500, winners: [] } } as any;

describe("CreateWaveOutcomesRowCICRank", () => {
  it("displays formatted total NIC", () => {
    render(
      <CreateWaveOutcomesRowCICRank
        outcome={outcome}
        removeOutcome={jest.fn()}
      />
    );
    expect(screen.getByText(/1\.5K/)).toBeInTheDocument();
  });

  it("calls removeOutcome on button click", async () => {
    const user = userEvent.setup();
    const removeOutcome = jest.fn();
    render(
      <CreateWaveOutcomesRowCICRank
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    );
    await user.click(screen.getByLabelText("Remove"));
    expect(removeOutcome).toHaveBeenCalled();
  });
});
