import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveOutcomeTypesItem from "@/components/waves/create-wave/outcomes/CreateWaveOutcomeTypesItem";
import { CreateWaveOutcomeType } from "@/types/waves.types";

describe("CreateWaveOutcomeTypesItem", () => {
  it("applies active classes when selected", () => {
    render(
      <CreateWaveOutcomeTypesItem
        outcomeType={CreateWaveOutcomeType.MANUAL}
        label="Manual"
        selectedOutcomeType={CreateWaveOutcomeType.MANUAL}
        setOutcomeType={jest.fn()}
      />
    );
    const radio = screen.getByRole("radio", { name: "Manual" });
    expect(radio).toBeChecked();
    expect(radio.parentElement).toHaveClass("tw-border-primary-500/60");
  });

  it("calls setOutcomeType on click", async () => {
    const user = userEvent.setup();
    const setOutcomeType = jest.fn();
    render(
      <CreateWaveOutcomeTypesItem
        outcomeType={CreateWaveOutcomeType.REP}
        label="Rep"
        selectedOutcomeType={null}
        setOutcomeType={setOutcomeType}
      />
    );
    await user.click(screen.getByRole("radio", { name: "Rep" }));
    expect(setOutcomeType).toHaveBeenCalledWith(CreateWaveOutcomeType.REP);
  });
});
