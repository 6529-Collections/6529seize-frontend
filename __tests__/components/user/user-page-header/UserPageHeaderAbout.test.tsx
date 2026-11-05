import { render, screen } from "@testing-library/react";
import UserPageHeaderAbout from "@/components/user/user-page-header/about/UserPageHeaderAbout";
import type { CicStatement } from "@/entities/IProfile";

const statement = {
  id: "bio",
  statement_value: "Collecting art and sharing ideas.",
} as CicStatement;

describe("UserPageHeaderAbout", () => {
  it("shows the About text without an individual edit control", () => {
    render(<UserPageHeaderAbout statement={statement} />);
    expect(screen.getByText(statement.statement_value)).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("omits an empty About", () => {
    const { container } = render(<UserPageHeaderAbout statement={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
