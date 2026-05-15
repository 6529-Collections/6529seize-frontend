import { render, screen, fireEvent } from "@testing-library/react";
import ToggleViewButtonPlugin from "@/components/drops/create/lexical/plugins/ToggleViewButtonPlugin";

describe("ToggleViewButtonPlugin", () => {
  it("calls onViewClick when button is clicked", () => {
    const onViewClick = jest.fn();
    render(<ToggleViewButtonPlugin onViewClick={onViewClick} />);
    const button = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(button);
    expect(onViewClick).toHaveBeenCalledTimes(1);
  });

  it("renders accessible button with cancel label", () => {
    const onViewClick = jest.fn();
    render(<ToggleViewButtonPlugin onViewClick={onViewClick} />);
    const button = screen.getByRole("button", { name: /cancel/i });
    expect(button).toHaveAttribute("type", "button");
    // ensure icon is present inside button
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("does not call onViewClick when disabled", () => {
    const onViewClick = jest.fn();
    render(<ToggleViewButtonPlugin disabled onViewClick={onViewClick} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onViewClick).not.toHaveBeenCalled();
  });
});
