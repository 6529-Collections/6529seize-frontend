import { render, screen, fireEvent } from "@testing-library/react";
import ToggleViewButtonPlugin from "@/components/drops/create/lexical/plugins/ToggleViewButtonPlugin";

describe("ToggleViewButtonPlugin", () => {
  it("calls onViewClick when button is clicked", () => {
    const onViewClick = jest.fn();
    render(<ToggleViewButtonPlugin onViewClick={onViewClick} />);
    const button = screen.getByRole("button", { name: /expand editor/i });
    fireEvent.click(button);
    expect(onViewClick).toHaveBeenCalledTimes(1);
  });

  it("renders an accessible expand-editor button", () => {
    const onViewClick = jest.fn();
    render(<ToggleViewButtonPlugin onViewClick={onViewClick} />);
    const button = screen.getByRole("button", { name: /expand editor/i });
    expect(button).toHaveAttribute("type", "button");
    // ensure icon is present inside button
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("does not call onViewClick when disabled", () => {
    const onViewClick = jest.fn();
    render(<ToggleViewButtonPlugin disabled onViewClick={onViewClick} />);
    fireEvent.click(screen.getByRole("button", { name: /expand editor/i }));
    expect(onViewClick).not.toHaveBeenCalled();
  });
});
