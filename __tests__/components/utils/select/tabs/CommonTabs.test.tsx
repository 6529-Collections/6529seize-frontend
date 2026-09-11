import { fireEvent, render, screen } from "@testing-library/react";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";

const ITEMS = [
  { key: "high", label: "High", value: "high" },
  { key: "low", label: "Low", value: "low" },
  { key: "recent", label: "Recent", value: "recent" },
] as const;

describe("CommonTabs", () => {
  it("supports individually disabled small tabs", () => {
    const setSelected = jest.fn();

    render(
      <CommonTabs
        items={ITEMS}
        activeItem="recent"
        filterLabel="Sort rows"
        setSelected={setSelected}
        isItemDisabled={(item) => item.value !== "recent"}
        size="sm"
        fill={false}
      />
    );

    const high = screen.getByRole("tab", { name: "High" });
    const low = screen.getByRole("tab", { name: "Low" });
    const recent = screen.getByRole("tab", { name: "Recent" });

    expect(high).toBeDisabled();
    expect(low).toBeDisabled();
    expect(recent).toBeEnabled();
    expect(recent).toHaveClass("tw-text-xs");

    fireEvent.click(high);
    expect(setSelected).not.toHaveBeenCalled();
  });

  it("skips disabled tabs during arrow-key navigation", () => {
    const setSelected = jest.fn();

    render(
      <CommonTabs
        items={ITEMS}
        activeItem="high"
        filterLabel="Sort rows"
        setSelected={setSelected}
        isItemDisabled={(item) => item.value === "low"}
        size="sm"
        fill={false}
      />
    );

    const high = screen.getByRole("tab", { name: "High" });
    const recent = screen.getByRole("tab", { name: "Recent" });

    high.focus();
    fireEvent.keyDown(high, { key: "ArrowRight" });

    expect(recent).toHaveFocus();
    expect(setSelected).toHaveBeenCalledWith("recent");
  });
});
