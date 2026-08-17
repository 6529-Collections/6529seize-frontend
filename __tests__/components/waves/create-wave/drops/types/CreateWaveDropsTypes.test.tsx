import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveDropsTypes from "@/components/waves/create-wave/drops/types/CreateWaveDropsTypes";
import { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";

describe("CreateWaveDropsTypes", () => {
  it("emits selected type on click", async () => {
    const onChange = jest.fn();
    render(
      <CreateWaveDropsTypes
        requiredTypes={[]}
        onRequiredTypeChange={onChange}
      />
    );
    expect(
      screen.getByRole("group", { name: "Required Types" })
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Image" }));
    expect(onChange).toHaveBeenCalledWith([
      ApiWaveParticipationRequirement.Image,
    ]);
  });

  it("selects none when none clicked", async () => {
    const onChange = jest.fn();
    render(
      <CreateWaveDropsTypes
        requiredTypes={[ApiWaveParticipationRequirement.Image]}
        onRequiredTypeChange={onChange}
      />
    );
    await userEvent.click(screen.getByRole("radio", { name: "None" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
