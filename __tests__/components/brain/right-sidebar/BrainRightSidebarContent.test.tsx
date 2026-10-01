import { render, screen } from "@testing-library/react";
import BrainRightSidebarContent from "@/components/brain/right-sidebar/BrainRightSidebarContent";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock("@/components/waves/drops/Drop", () => ({
  __esModule: true,
  default: ({ drop }: { drop: { id: string } }) => (
    <div data-testid="pinned-drop">{drop.id}</div>
  ),
  DropLocation: { WAVE: "WAVE" },
}));

const makeWave = (dropId: string): ApiWave =>
  ({ description_drop: { id: dropId } }) as ApiWave;

describe("BrainRightSidebarContent", () => {
  it("shows the current pinned drop instead of the overview", () => {
    const { rerender } = render(
      <BrainRightSidebarContent wave={makeWave("drop-1")} />
    );

    expect(screen.getByRole("region", { name: "Pinned drop" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Pinned drop" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("pinned-drop")).toHaveTextContent("drop-1");
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();

    rerender(<BrainRightSidebarContent wave={makeWave("drop-2")} />);
    expect(screen.getByTestId("pinned-drop")).toHaveTextContent("drop-2");
  });

  it("does not show an empty pinned section when the drop is unavailable", () => {
    const { container } = render(
      <BrainRightSidebarContent wave={makeWave("")} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
