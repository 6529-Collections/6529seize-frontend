import { render, screen } from "@testing-library/react";
import BrainRightSidebarContent from "@/components/brain/right-sidebar/BrainRightSidebarContent";
import type { ApiWave } from "@/generated/models/ApiWave";
import { CompactModeProvider } from "@/contexts/CompactModeContext";

jest.mock("@/components/waves/drops/Drop", () => {
  const { useCompactMode } = jest.requireActual<
    typeof import("@/contexts/CompactModeContext")
  >("@/contexts/CompactModeContext");
  return {
    __esModule: true,
    default: function MockPinnedDrop({ drop }: { drop: { id: string } }) {
      const compact = useCompactMode();
      return (
        <div data-testid="pinned-drop" data-compact={String(compact)}>
          {drop.id}
        </div>
      );
    },
    DropLocation: { WAVE: "WAVE" },
  };
});

const makeWave = (dropId: string): ApiWave =>
  ({ description_drop: { id: dropId, parts: [] } }) as unknown as ApiWave;

describe("BrainRightSidebarContent", () => {
  it.each([false, true])(
    "preserves the parent chat mode for pinned-post interactions (%s)",
    (compact) => {
      render(
        <CompactModeProvider compact={compact}>
          <BrainRightSidebarContent wave={makeWave("drop-1")} />
        </CompactModeProvider>
      );
      expect(screen.getByTestId("pinned-drop")).toHaveAttribute(
        "data-compact",
        String(compact)
      );
    }
  );

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

  it.each<[string, ApiWave]>([
    ["empty drop ID", makeWave("")],
    ["missing drop", {} as ApiWave],
    ["null drop", { description_drop: null } as unknown as ApiWave],
  ])("does not show an empty pinned section for %s", (_, wave) => {
    const { container } = render(<BrainRightSidebarContent wave={wave} />);
    expect(container).toBeEmptyDOMElement();
  });
});
