import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveToggle from "@/components/waves/create-wave/utils/CreateWaveToggle";

describe("CreateWaveToggle", () => {
  it("renders one named switch and its visible label", () => {
    render(
      <CreateWaveToggle
        enabled={false}
        onChange={jest.fn()}
        label="Enable"
        displayLabel
      />
    );

    expect(screen.getByRole("switch", { name: "Enable" })).toBeVisible();
    expect(screen.getAllByRole("switch")).toHaveLength(1);
    expect(screen.getByText("Enable")).toBeInTheDocument();
  });

  it("triggers onChange with new state", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <CreateWaveToggle enabled={false} onChange={onChange} label="Toggle" />
    );

    await user.click(screen.getByRole("switch", { name: "Toggle" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
