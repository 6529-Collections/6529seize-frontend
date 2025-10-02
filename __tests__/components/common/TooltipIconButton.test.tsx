import TooltipIconButton from "@/components/common/TooltipIconButton";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type FontAwesomeProps = {
  readonly [key: string]: unknown;
};

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (props: FontAwesomeProps) => (
    <svg data-testid="icon" {...props} />
  ),
}));

describe("TooltipIconButton", () => {
  it("shows tooltip on hover and hides on mouse leave", () => {
    render(
      <TooltipIconButton
        icon={faCheck}
        tooltipText="info"
        aria-describedby="external-id"
      />
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.mouseEnter(button);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("info");
    expect(tooltip.className).toContain("tw-bottom-6");

    const describedBy = button.getAttribute("aria-describedby") ?? "";
    expect(describedBy).toContain("external-id");
    expect(describedBy).toContain(tooltip.getAttribute("id") ?? "");

    fireEvent.mouseLeave(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("applies bottom position classes", () => {
    render(
      <TooltipIconButton
        icon={faCheck}
        tooltipText="info"
        tooltipPosition="bottom"
      />
    );
    const button = screen.getByRole("button");
    fireEvent.mouseEnter(button);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("tw-top-6");
  });

  it("shows tooltip on focus and hides on blur triggered by keyboard navigation", async () => {
    const user = userEvent.setup();
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();

    render(
      <>
        <TooltipIconButton
          icon={faCheck}
          tooltipText="info"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <button>Next</button>
      </>
    );

    await user.tab();
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(handleFocus).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("forwards tabIndex to the button", () => {
    render(
      <TooltipIconButton icon={faCheck} tooltipText="info" tabIndex={-1} />
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("tabindex", "-1");
  });

  it("calls onClick and stops propagation", () => {
    const onClick = jest.fn();
    const parentClick = jest.fn();

    render(
      <div onClick={parentClick}>
        <TooltipIconButton
          icon={faCheck}
          tooltipText="info"
          onClick={onClick}
        />
      </div>
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
    expect(parentClick).not.toHaveBeenCalled();
  });
});
