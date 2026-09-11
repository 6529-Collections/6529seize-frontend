import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveOutcomesWinners from "@/components/waves/create-wave/outcomes/winners/CreateWaveOutcomesWinners";
import {
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from "@/types/waves.types";

jest.mock(
  "@/components/waves/create-wave/outcomes/winners/CreateWaveOutcomesWinnersRows",
  () => (props: any) => <div data-testid="rows">{props.winners.length}</div>
);

jest.mock(
  "@/components/waves/create-wave/outcomes/winners/CreateWaveOutcomesWinnersAddWinner",
  () => (props: any) => <button onClick={props.addWinner}>add</button>
);

describe("CreateWaveOutcomesWinners", () => {
  const baseConfig = {
    creditValueType:
      CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
    totalAmount: 0,
    winners: [{ value: 1 }],
  };

  it("updates winners when add button clicked", async () => {
    const setWinnersConfig = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveOutcomesWinners
        winnersConfig={baseConfig}
        totalValueError={false}
        percentageError={false}
        outcomeType={CreateWaveOutcomeType.REP}
        setWinnersConfig={setWinnersConfig}
      />
    );
    await user.click(screen.getByText("add"));
    expect(setWinnersConfig).toHaveBeenCalled();
  });

  it("connects the total amount error to the percentage input", () => {
    render(
      <CreateWaveOutcomesWinners
        winnersConfig={{
          ...baseConfig,
          creditValueType:
            CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE,
        }}
        totalValueError
        percentageError={false}
        outcomeType={CreateWaveOutcomeType.REP}
        setWinnersConfig={jest.fn()}
      />
    );

    const input = screen.getByLabelText("Total Amount");
    const error = screen.getByRole("alert");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
    expect(input).toHaveClass("tw-pr-16");
  });
});
