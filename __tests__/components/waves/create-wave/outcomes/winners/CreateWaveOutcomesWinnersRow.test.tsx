import { render, screen } from "@testing-library/react";
import CreateWaveOutcomesWinnersRow from "@/components/waves/create-wave/outcomes/winners/CreateWaveOutcomesWinnersRow";
import {
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from "@/types/waves.types";

describe("CreateWaveOutcomesWinnersRow", () => {
  it("keeps the value clear of its suffix", () => {
    render(
      <CreateWaveOutcomesWinnersRow
        winner={{ value: 100 }}
        winnersCount={1}
        creditValueType={
          CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE
        }
        i={0}
        outcomeType={CreateWaveOutcomeType.REP}
        isError={false}
        removeWinner={jest.fn()}
        onWinnerValueChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText("#1")).toHaveClass("tw-pr-16");
    expect(screen.getByText("Rep")).toBeInTheDocument();
  });
});
