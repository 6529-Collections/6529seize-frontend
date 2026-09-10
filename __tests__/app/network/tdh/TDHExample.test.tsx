import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TDHExample from "@/app/network/tdh/TDHExample";

describe("TDHExample", () => {
  it("shows the four documented totals through accessible controls", async () => {
    const user = userEvent.setup();
    const { container } = render(<TDHExample locale="en-US" />);

    expect(container).toHaveTextContent("2,224");
    await user.click(screen.getByRole("button", { name: "+30 days" }));
    expect(container).toHaveTextContent("3,897");

    await user.click(screen.getByRole("checkbox", { name: /sell nakamoto/i }));
    expect(container).toHaveTextContent("2,653");
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(container).toHaveTextContent("1,398");
    expect(
      within(screen.getByRole("table")).queryByRole("row", {
        name: /Nakamoto #4/,
      })
    ).not.toBeInTheDocument();
  });
});
