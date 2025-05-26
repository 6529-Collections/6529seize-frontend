import { render, screen } from "@testing-library/react";
import GroupsSidebar from "../../../../components/groups/sidebar/GroupsSidebar";

jest.mock("../../../../components/groups/header/GroupHeader", () => () => (
  <div data-testid="group-header" />
));

jest.mock("../../../../components/groups/select/GroupSelect", () => () => (
  <div data-testid="group-select" />
));

describe("GroupsSidebar", () => {
  it("renders GroupHeader and GroupSelect", () => {
    render(<GroupsSidebar />);
    expect(screen.getByTestId("group-header")).toBeInTheDocument();
    expect(screen.getByTestId("group-select")).toBeInTheDocument();
  });

  it("applies padding bottom container class", () => {
    const { container } = render(<GroupsSidebar />);
    expect(container.firstChild).toHaveClass("tw-pb-4");
  });
});
