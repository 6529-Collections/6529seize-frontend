import { printVolumeTypeDropdown } from "@/components/the-memes/TheMemes";
import { VolumeType } from "@/entities/INFT";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("TheMemes helpers", () => {
  it("printVolumeTypeDropdown triggers callbacks", async () => {
    const user = userEvent.setup();
    const setVol = jest.fn();
    const setSort = jest.fn();
    render(printVolumeTypeDropdown(false, setVol, setSort));
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText(VolumeType.DAYS_7));
    expect(setVol).toHaveBeenCalledWith(VolumeType.DAYS_7);
    expect(setSort).toHaveBeenCalled();
  });

  it("printVolumeTypeDropdown uses collection filter trigger styling", () => {
    render(printVolumeTypeDropdown(true, jest.fn(), jest.fn()));
    const button = screen.getByRole("button", {
      name: `Volume: ${VolumeType.ALL_TIME}`,
    });
    expect(screen.getByText("Volume:")).not.toHaveClass("tw-uppercase");
    expect(button).not.toHaveClass("focus-visible:tw-outline-primary-400");
  });
});
