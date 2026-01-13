import {
  printVolumeTypeDropdown,
  SortButton,
} from "@/components/the-memes/TheMemes";
import { VolumeType } from "@/entities/INFT";
import { MemesSort } from "@/types/enums";
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

  it("SortButton calls select", async () => {
    const user = userEvent.setup();
    const select = jest.fn();
    render(
      <SortButton
        currentSort={MemesSort.AGE}
        sort={MemesSort.AGE}
        select={select}
      />
    );
    await user.click(screen.getByRole("button"));
    expect(select).toHaveBeenCalled();
  });

  it("SortButton active state lacks disabled class", () => {
    render(
      <SortButton
        currentSort={MemesSort.AGE}
        sort={MemesSort.AGE}
        select={jest.fn()}
      />
    );
    const btn = screen.getByRole("button");
    expect(btn.className).not.toContain("disabled");
  });
});
