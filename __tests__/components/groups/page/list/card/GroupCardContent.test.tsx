import { render, screen } from "@testing-library/react";
import GroupCardContent from "@/components/groups/page/list/card/GroupCardContent";

jest.mock("@/components/groups/page/list/card/GroupCardConfigs", () => () => (
  <div data-testid="configs" />
));

const group: any = {
  id: "group-1",
  name: "Collectors",
};

function renderContent() {
  return render(<GroupCardContent group={group} />);
}

describe("GroupCardContent", () => {
  it("shows the group source and configuration", () => {
    renderContent();

    expect(
      screen.getByText("Source: filters + optional manual list")
    ).toBeInTheDocument();
    expect(screen.getByTestId("configs")).toBeInTheDocument();
  });

  it("does not render the bulk rating actions on group cards", () => {
    renderContent();

    expect(screen.queryByText("Rep all")).not.toBeInTheDocument();
    expect(screen.queryByText("NIC all")).not.toBeInTheDocument();
  });
});
