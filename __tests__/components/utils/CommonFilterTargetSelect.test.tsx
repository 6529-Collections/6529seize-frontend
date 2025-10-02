import CommonFilterTargetSelect, {
  FilterTargetType,
} from "@/components/utils/CommonFilterTargetSelect";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("CommonFilterTargetSelect", () => {
  it("renders the filter target options and triggers change on click", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <CommonFilterTargetSelect
        selected={FilterTargetType.ALL}
        onChange={onChange}
      />
    );

    const group = screen.getByRole("group", { name: /filter target/i });
    expect(group).toBeInTheDocument();

    const buttons = screen.getAllByRole("radio");
    expect(buttons).toHaveLength(3);

    await user.click(screen.getByLabelText("Outgoing"));

    expect(onChange).toHaveBeenCalledWith(FilterTargetType.OUTGOING);
  });

  it("supports keyboard navigation between targets", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    const { rerender } = render(
      <CommonFilterTargetSelect
        selected={FilterTargetType.ALL}
        onChange={onChange}
      />
    );

    await user.tab();

    const allRadio = screen.getByRole("radio", { name: "All" });
    expect(allRadio).toHaveFocus();

    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith(FilterTargetType.OUTGOING);

    onChange.mockClear();

    rerender(
      <CommonFilterTargetSelect
        selected={FilterTargetType.OUTGOING}
        onChange={onChange}
      />
    );

    const outgoingRadio = screen.getByRole("radio", { name: "Outgoing" });
    expect(outgoingRadio).toHaveFocus();
    expect(outgoingRadio).toBeChecked();

    await user.keyboard("{ArrowLeft}");

    expect(onChange).toHaveBeenCalledWith(FilterTargetType.ALL);
  });
});
