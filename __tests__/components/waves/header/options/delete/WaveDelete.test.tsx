import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveDelete from "@/components/waves/header/options/delete/WaveDelete";

describe("WaveDelete", () => {
  it("requests deletion from a desktop menu item", async () => {
    const user = userEvent.setup();
    const onDeleteRequest = jest.fn();

    render(<WaveDelete onDeleteRequest={onDeleteRequest} />);

    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(onDeleteRequest).toHaveBeenCalledTimes(1);
  });

  it("uses a touch-sized button in the mobile sheet", () => {
    render(<WaveDelete isMobile onDeleteRequest={jest.fn()} />);

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveClass("tw-min-h-12", "tw-rounded-xl");
    expect(button).not.toHaveAttribute("role", "menuitem");
    expect(button).not.toHaveAttribute("tabindex", "-1");
  });
});
