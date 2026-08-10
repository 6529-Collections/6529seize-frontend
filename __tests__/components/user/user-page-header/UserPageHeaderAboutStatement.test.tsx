import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageHeaderAboutStatement from "@/components/user/user-page-header/about/UserPageHeaderAboutStatement";
import type { CicStatement } from "@/entities/IProfile";

describe("UserPageHeaderAboutStatement", () => {
  it("shows placeholder when statement is null", () => {
    render(<UserPageHeaderAboutStatement statement={null} />);
    expect(
      screen.getByText("Click to add an About statement")
    ).toBeInTheDocument();
  });

  it("renders statement value when provided", () => {
    const statement: CicStatement = { statement_value: "Hello there" } as any;
    render(<UserPageHeaderAboutStatement statement={statement} />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("toggles overflowing statement expansion", async () => {
    const clientHeightSpy = jest
      .spyOn(HTMLElement.prototype, "clientHeight", "get")
      .mockReturnValue(100);
    const scrollHeightSpy = jest
      .spyOn(HTMLElement.prototype, "scrollHeight", "get")
      .mockReturnValue(200);
    const statement: CicStatement = { statement_value: "a".repeat(241) } as any;

    try {
      render(<UserPageHeaderAboutStatement statement={statement} />);

      const toggle = screen.getByRole("button", { name: "See more" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");

      await userEvent.click(toggle);
      expect(screen.getByRole("button", { name: "See less" })).toHaveAttribute(
        "aria-expanded",
        "true"
      );
    } finally {
      clientHeightSpy.mockRestore();
      scrollHeightSpy.mockRestore();
    }
  });
});
