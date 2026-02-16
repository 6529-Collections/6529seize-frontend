import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaveLeaderboardCurationGroupSelect } from "@/components/waves/leaderboard/header/WaveLeaderboardCurationGroupSelect";

let mockBreakpoint = "MD";

jest.mock("react-use", () => ({
  createBreakpoint: jest.fn(() => () => mockBreakpoint),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueries: jest.fn(() => []),
}));

const commonDropdownMock = jest.fn((props: any) => (
  <div data-testid="mobile-dropdown">
    {props.items.map((item: any) => (
      <button key={item.key} onClick={() => props.setSelected(item.value)}>
        {item.label}
      </button>
    ))}
  </div>
));

jest.mock("@/components/utils/select/dropdown/CommonDropdown", () => ({
  __esModule: true,
  default: (props: any) => commonDropdownMock(props),
}));

const groups = [
  {
    id: "cg-1",
    name: "Curators One",
    wave_id: "w",
    group_id: "g-1",
    created_at: 1,
    updated_at: 1,
  },
  {
    id: "cg-2",
    name: "Curators Two",
    wave_id: "w",
    group_id: "g-2",
    created_at: 2,
    updated_at: 2,
  },
] as const;

describe("WaveLeaderboardCurationGroupSelect", () => {
  beforeEach(() => {
    mockBreakpoint = "MD";
    commonDropdownMock.mockClear();
  });

  it("returns null when there are no curation groups", () => {
    const { container } = render(
      <WaveLeaderboardCurationGroupSelect
        groups={[]}
        selectedGroupId={null}
        onChange={jest.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders horizontal tabs on desktop", () => {
    render(
      <WaveLeaderboardCurationGroupSelect
        groups={groups}
        selectedGroupId={"cg-2"}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByTestId("curation-group-select")).toBeInTheDocument();
    expect(screen.getByText("All submissions")).toBeInTheDocument();
    expect(screen.getByText("Curators One")).toBeInTheDocument();
    expect(screen.getByText("Curators Two")).toBeInTheDocument();
    expect(commonDropdownMock).not.toHaveBeenCalled();
  });

  it("highlights the active tab on desktop", () => {
    render(
      <WaveLeaderboardCurationGroupSelect
        groups={groups}
        selectedGroupId={"cg-2"}
        onChange={jest.fn()}
      />
    );

    const activeButton = screen.getByText("Curators Two").closest("button")!;
    expect(activeButton.className).toContain("tw-ring-iron-600");

    const inactiveButton = screen
      .getByText("All submissions")
      .closest("button")!;
    expect(inactiveButton.className).toContain("tw-ring-transparent");
  });

  it("handles tab clicks on desktop", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <WaveLeaderboardCurationGroupSelect
        groups={groups}
        selectedGroupId={null}
        onChange={onChange}
      />
    );

    await user.click(screen.getByText("Curators One"));
    await user.click(screen.getByText("All submissions"));

    expect(onChange).toHaveBeenNthCalledWith(1, "cg-1");
    expect(onChange).toHaveBeenNthCalledWith(2, null);
  });

  it("renders dropdown on mobile", () => {
    mockBreakpoint = "S";

    render(
      <WaveLeaderboardCurationGroupSelect
        groups={groups}
        selectedGroupId={null}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByTestId("mobile-dropdown")).toBeInTheDocument();
    expect(commonDropdownMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filterLabel: "Group",
        showFilterLabel: true,
        size: "sm",
        activeItem: null,
      })
    );
  });

  it("handles dropdown selection on mobile", async () => {
    mockBreakpoint = "S";
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <WaveLeaderboardCurationGroupSelect
        groups={groups}
        selectedGroupId={null}
        onChange={onChange}
      />
    );

    await user.click(screen.getByText("Curators One"));
    expect(onChange).toHaveBeenCalledWith("cg-1");
  });
});
