import { fireEvent, render, screen } from "@testing-library/react";
import DropCurationButton from "@/components/waves/drops/DropCurationButton";
import { useDropCurationMutation } from "@/hooks/drops/useDropCurationMutation";

const toggleCuration = jest.fn();

jest.mock("@/hooks/drops/useDropCurationMutation", () => ({
  useDropCurationMutation: jest.fn(),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ id, positionStrategy, style, children }: any) => (
    <div
      data-testid={`tooltip-${id}`}
      data-position-strategy={positionStrategy}
      data-z-index={String(style?.zIndex)}
    >
      {children}
    </div>
  ),
}));

const mockUseDropCurationMutation = useDropCurationMutation as jest.Mock;

describe("DropCurationButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDropCurationMutation.mockReturnValue({
      toggleCuration,
      isPending: false,
    });
  });

  it("returns null when drop is not curatable", () => {
    const { container } = render(
      <DropCurationButton
        dropId="drop-1"
        waveId="wave-1"
        isCuratable={false}
        isCurated={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders curate button tooltip with local stacking and absolute positioning", () => {
    render(
      <DropCurationButton
        dropId="drop-1"
        waveId="wave-1"
        isCuratable
        isCurated={false}
      />
    );

    expect(screen.getByRole("button", { name: "Curate drop" })).toBeVisible();
    expect(screen.getByTestId("tooltip-curate-drop-drop-1")).toHaveAttribute(
      "data-position-strategy",
      "absolute"
    );
    expect(screen.getByTestId("tooltip-curate-drop-drop-1")).toHaveAttribute(
      "data-z-index",
      "20"
    );
  });

  it("calls toggleCuration with expected payload on click", () => {
    render(
      <DropCurationButton
        dropId="drop-1"
        waveId="wave-1"
        isCuratable
        isCurated={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Curate drop" }));

    expect(toggleCuration).toHaveBeenCalledWith({
      dropId: "drop-1",
      waveId: "wave-1",
      isCuratable: true,
      isCurated: false,
    });
  });

  it("disables temporary drops and does not render tooltip", () => {
    render(
      <DropCurationButton
        dropId="temp-drop-1"
        waveId="wave-1"
        isCuratable
        isCurated
      />
    );

    expect(
      screen.getByRole("button", { name: "Remove curation from drop" })
    ).toBeDisabled();
    expect(screen.queryByTestId("tooltip-curate-drop-temp-drop-1")).toBeNull();
  });
});
