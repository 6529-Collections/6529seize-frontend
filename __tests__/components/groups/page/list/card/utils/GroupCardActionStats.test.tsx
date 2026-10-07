import { render, screen } from "@testing-library/react";
import React from "react";
import GroupCardActionStats from "@/components/groups/page/list/card/utils/GroupCardActionStats";
import { AuthContext } from "@/components/auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";

jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));
jest.mock("components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { SMALL: "SMALL" },
}));

const useQueryMock = useQuery as jest.Mock;

const authValue = {
  connectedProfile: { handle: "alice" },
  activeProfileProxy: null,
} as any;

describe("GroupCardActionStats", () => {
  it("calculates credit per member", () => {
    useQueryMock.mockReturnValue({ data: { rep_credit: 10 } });
    render(
      <AuthContext.Provider value={authValue}>
        <GroupCardActionStats
          matter={ApiRateMatter.Rep}
          membersCount={2}
          loadingMembersCount={false}
        />
      </AuthContext.Provider>
    );
    expect(screen.getByText(/±5/)).toBeInTheDocument();
  });

  it("shows loader when member count loading", () => {
    useQueryMock.mockReturnValue({ data: { rep_credit: 10 } });
    render(
      <AuthContext.Provider value={authValue}>
        <GroupCardActionStats
          matter={ApiRateMatter.Rep}
          membersCount={null}
          loadingMembersCount={true}
        />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it.each([
    { credit: 0, members: 2, expected: "0 NIC to each of 2" },
    { credit: 10, members: 0, expected: "0 NIC to each of 0" },
    { credit: undefined, members: 2, expected: "— NIC to each of 2" },
  ])(
    "distinguishes zero credit, zero members and pending credit: $expected",
    ({ credit, members, expected }) => {
      useQueryMock.mockReturnValue({ data: { cic_credit: credit } });
      render(
        <AuthContext.Provider value={authValue}>
          <GroupCardActionStats
            matter={ApiRateMatter.Cic}
            membersCount={members}
            loadingMembersCount={false}
          />
        </AuthContext.Provider>
      );
      expect(screen.getByRole("status")).toHaveTextContent(expected);
    }
  );

  it("requests credit for the represented profile and its representative", () => {
    useQueryMock.mockReturnValue({ data: { rep_credit: 10 } });
    render(
      <AuthContext.Provider
        value={{
          ...authValue,
          activeProfileProxy: { created_by: { handle: "bob" } },
        }}
      >
        <GroupCardActionStats
          matter={ApiRateMatter.Rep}
          membersCount={2}
          loadingMembersCount={false}
        />
      </AuthContext.Provider>
    );
    const options = useQueryMock.mock.calls.at(-1)?.[0];
    expect(options.queryKey[1]).toEqual({
      rater: "bob",
      rater_representative: "alice",
    });
  });

  it("announces a failed credit request instead of presenting stale credit", () => {
    useQueryMock.mockReturnValue({ data: { rep_credit: 10 }, isError: true });
    render(
      <AuthContext.Provider value={authValue}>
        <GroupCardActionStats
          matter={ApiRateMatter.Rep}
          membersCount={2}
          loadingMembersCount={false}
        />
      </AuthContext.Provider>
    );
    expect(screen.getByRole("status")).toHaveTextContent("Please try again.");
    expect(screen.getByRole("status")).not.toHaveTextContent("±5");
  });
});
