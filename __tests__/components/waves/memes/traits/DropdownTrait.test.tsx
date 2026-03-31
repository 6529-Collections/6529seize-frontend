import { render, screen, fireEvent } from "@testing-library/react";
import { DropdownTrait } from "@/components/waves/memes/traits/DropdownTrait";

jest.mock("components/waves/memes/traits/TraitWrapper", () => ({
  TraitWrapper: ({ children, labelRightAdornment }: any) => (
    <div data-testid="wrapper">
      <div data-testid="label-adornment">{labelRightAdornment}</div>
      {children}
    </div>
  ),
}));

describe("DropdownTrait", () => {
  const traits = { rarity: "Common" } as any;
  const options = ["Common", "Rare"];

  it("updates value on change and blur", () => {
    const updateText = jest.fn();
    const onBlur = jest.fn();
    render(
      <DropdownTrait
        label="Rarity"
        field="rarity"
        traits={traits}
        updateText={updateText}
        options={options}
        onBlur={onBlur}
      />
    );
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Rare" } });
    expect(updateText).toHaveBeenCalledWith("rarity", "Rare");
    fireEvent.blur(select);
    expect(onBlur).toHaveBeenCalledWith("rarity");
  });

  it("syncs when traits change", () => {
    const { rerender } = render(
      <DropdownTrait
        label="Rarity"
        field="rarity"
        traits={traits}
        updateText={jest.fn()}
        options={options}
      />
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("Common");
    expect(select).toHaveClass("tw-ring-emerald-500/30");
    rerender(
      <DropdownTrait
        label="Rarity"
        field="rarity"
        traits={{ rarity: "Rare" } as any}
        updateText={jest.fn()}
        options={options}
      />
    );
    expect(select.value).toBe("Rare");
    expect(select).toHaveClass("tw-ring-emerald-500/30");
  });

  it("uses muted text for the empty option and bright text for a selected option", () => {
    const updateText = jest.fn();
    render(
      <DropdownTrait
        label="Rarity"
        field="rarity"
        traits={{ rarity: "" } as any}
        updateText={updateText}
        options={options}
      />
    );

    const select = screen.getByRole("combobox");
    const iconContainer = screen.getByTestId("label-adornment")
      .firstElementChild as HTMLElement;
    expect((select as HTMLSelectElement).style.color).toBe(
      "rgb(132, 132, 144)"
    );
    expect(iconContainer).toHaveClass("tw-hidden");

    fireEvent.change(select, { target: { value: "Rare" } });

    expect((select as HTMLSelectElement).style.color).toBe(
      "rgb(239, 239, 241)"
    );
    expect(iconContainer).not.toHaveClass("tw-hidden");
    expect(updateText).toHaveBeenCalledWith("rarity", "Rare");
  });
});
