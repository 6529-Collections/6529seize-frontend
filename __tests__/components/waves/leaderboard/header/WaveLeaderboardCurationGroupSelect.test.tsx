import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaveLeaderboardCurationGroupSelect } from "@/components/waves/leaderboard/header/WaveLeaderboardCurationGroupSelect";

const commonSelectMock = jest.fn();

jest.mock("@/components/utils/select/CommonSelect", () => ({
  __esModule: true,
  default: (props: any) => {
    commonSelectMock(props);
    return (
      <div data-testid="common-select">
        {props.items.map((item: any) => (
          <button key={item.key} onClick={() => props.setSelected(item.value)}>
            {item.label}
          </button>
        ))}
        <span data-testid="active-item">
          {props.activeItem === null ? "null" : props.activeItem}
        </span>
      </div>
    );
  },
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
    commonSelectMock.mockClear();
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
    expect(commonSelectMock).not.toHaveBeenCalled();
  });

  it("maps curation options and passes select configuration", () => {
    render(
      <WaveLeaderboardCurationGroupSelect
        groups={groups}
        selectedGroupId={"cg-2"}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByTestId("curation-group-select")).toBeInTheDocument();
    expect(screen.getByTestId("active-item")).toHaveTextContent("cg-2");

    const commonSelectProps = commonSelectMock.mock.calls[0][0];
    expect(commonSelectProps.filterLabel).toBe("Curation");
    expect(commonSelectProps.fill).toBe(false);
    expect(commonSelectProps.items).toEqual([
      { key: "all-submissions", label: "All submissions", value: null },
      { key: "cg-1", label: "Curators One", value: "cg-1" },
      { key: "cg-2", label: "Curators Two", value: "cg-2" },
    ]);
  });

  it("handles selecting curation options", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <WaveLeaderboardCurationGroupSelect
        groups={groups}
        selectedGroupId={null}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Curators One" }));
    await user.click(screen.getByRole("button", { name: "All submissions" }));

    expect(onChange).toHaveBeenNthCalledWith(1, "cg-1");
    expect(onChange).toHaveBeenNthCalledWith(2, null);
  });
});
