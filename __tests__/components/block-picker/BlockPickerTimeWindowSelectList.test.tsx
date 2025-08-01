import { render, screen, fireEvent } from "@testing-library/react";
import BlockPickerTimeWindowSelectList from "@/components/block-picker/BlockPickerTimeWindowSelectList";
import { BlockPickerTimeWindow } from "@/app/meme-blocks/page.client";

jest.mock("next/font/google", () => ({
  Poppins: () => ({ className: "poppins" }),
}));

describe("BlockPickerTimeWindowSelectList", () => {
  const options = [
    { title: "One", value: BlockPickerTimeWindow.ONE_MINUTE },
    { title: "Two", value: BlockPickerTimeWindow.FIVE_MINUTES },
  ];
  const setup = (
    timeWindow: BlockPickerTimeWindow,
    setTimeWindow = jest.fn()
  ) =>
    render(
      <BlockPickerTimeWindowSelectList
        options={options}
        timeWindow={timeWindow}
        setTimeWindow={setTimeWindow}
      />
    );

  it("renders all options", () => {
    setup(BlockPickerTimeWindow.ONE_MINUTE);
    const items = screen.getAllByRole("option");
    expect(items).toHaveLength(options.length);
    expect(items[0]).toHaveTextContent("One");
    expect(items[1]).toHaveTextContent("Two");
  });

  it("calls setTimeWindow when option clicked", () => {
    const onSelect = jest.fn();
    setup(BlockPickerTimeWindow.ONE_MINUTE, onSelect);
    const second = screen.getAllByRole("option")[1];
    fireEvent.click(second);
    expect(onSelect).toHaveBeenCalledWith(BlockPickerTimeWindow.FIVE_MINUTES);
  });

  it("shows selected icon for active option", () => {
    setup(BlockPickerTimeWindow.FIVE_MINUTES);
    const selected = screen.getAllByRole("option")[1];
    expect(selected.querySelector("svg")).toBeInTheDocument();
  });
});
