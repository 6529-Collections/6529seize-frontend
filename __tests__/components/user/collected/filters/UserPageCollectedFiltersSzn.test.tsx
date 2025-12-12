import UserPageCollectedFiltersSzn from "@/components/user/collected/filters/UserPageCollectedFiltersSzn";
import { MemeSeason } from "@/entities/ISeason";
import { render } from "@testing-library/react";
import React from "react";

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
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
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
        containerRef={ref}
        setSelected={setSelected}
      />
    );

    expect(capturedProps.selected).toBe(mockSeason);
    expect(capturedProps.initialSeasonId).toBe(1);
    expect(capturedProps.containerRef).toBe(ref);
    expect(capturedProps.setSelected).toBe(setSelected);
  });

  it("passes null when no season selected", () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
    const setSelected = jest.fn();

    render(
      <UserPageCollectedFiltersSzn
        selected={null}
        initialSeasonId={null}
        containerRef={ref}
        setSelected={setSelected}
      />
    );

    expect(capturedProps.selected).toBeNull();
    expect(capturedProps.initialSeasonId).toBeNull();
  });
});
