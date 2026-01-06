import UserPageCollectedFiltersSzn from "@/components/user/collected/filters/UserPageCollectedFiltersSzn";
import type { MemeSeason } from "@/entities/ISeason";
import { render } from "@testing-library/react";

let capturedProps: any = null;

jest.mock(
  "@/components/utils/select/dropdown/SeasonsGridDropdown",
  () => (props: any) => {
    capturedProps = props;
    return <div data-testid="seasons-grid-dropdown" />;
  }
);

describe("UserPageCollectedFiltersSzn", () => {
  beforeEach(() => {
    capturedProps = null;
  });

  it("passes props to SeasonsGridDropdown", () => {
    const mockSeason: MemeSeason = {
      id: 1,
      start_index: 1,
      end_index: 100,
      count: 100,
      name: "SZN1",
      display: "SZN 1",
    };
    const setSelected = jest.fn();

    render(
      <UserPageCollectedFiltersSzn
        selected={mockSeason}
        initialSeasonId={1}
        setSelected={setSelected}
      />
    );

    expect(capturedProps.selected).toBe(mockSeason);
    expect(capturedProps.initialSeasonId).toBe(1);
    expect(capturedProps.setSelected).toBe(setSelected);
  });

  it("passes null when no season selected", () => {
    const setSelected = jest.fn();

    render(
      <UserPageCollectedFiltersSzn
        selected={null}
        initialSeasonId={null}
        setSelected={setSelected}
      />
    );

    expect(capturedProps.selected).toBeNull();
    expect(capturedProps.initialSeasonId).toBeNull();
  });
});
