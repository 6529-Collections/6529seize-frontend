import { AuthContext } from "@/components/auth/Auth";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import UserPageRep from "@/components/user/rep/UserPageRep";
import { useNicRatingsOverview } from "@/components/user/rep/useNicRatingsOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { act, render, renderHook } from "@testing-library/react";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
  useQuery: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useParams: () => ({ user: "alice" }),
}));
jest.mock("@/hooks/useProfileQueryViewer", () => ({
  PENDING_PROFILE_QUERY_VIEWER: "pending",
  useProfileQueryViewer: () => null,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0xabc" }),
}));
jest.mock(
  "@/components/user/identity/getting-started/IdentityGettingStartedCard",
  () => () => <div data-testid="getting-started" />
);
jest.mock("@/components/user/identity/header/UserPageIdentityHeader", () => {
  return function MockUserPageIdentityHeader() {
    return <div data-testid="identity-header" />;
  };
});
jest.mock(
  "@/components/user/identity/statements/UserPageIdentityStatements",
  () => () => <div data-testid="identity-statements" />
);

let headerProps: any;
let activityProps: any;

jest.mock(
  "@/components/user/rep/header/UserPageRepHeader",
  () => (props: any) => {
    headerProps = props;
    return <div data-testid="header" />;
  }
);
jest.mock(
  "@/components/user/rep/UserPageCombinedActivityLog",
  () => (props: any) => {
    activityProps = props;
    return <div data-testid="activity" />;
  }
);
jest.mock(
  "@/components/user/rep/UserPageRepMobile",
  () => (props: any) => {
    return <div data-testid="mobile" />;
  }
);
jest.mock(
  "@/components/user/utils/rate/UserPageRateWrapper",
  () => (props: any) => {
    return <div data-testid="ratewrapper">{props.children}</div>;
  }
);

describe("UserPageRep", () => {
  const queryMock = useQuery as jest.Mock;
  const infiniteQueryMock = useInfiniteQuery as jest.Mock;

  beforeEach(() => {
    headerProps = activityProps = undefined;
    queryMock.mockClear();
    infiniteQueryMock.mockClear();
    queryMock
      .mockReturnValueOnce({ data: { score: 1 }, isFetching: false })
      .mockReturnValueOnce({ data: undefined, isFetching: false })
      .mockReturnValue({ data: { contributors: { data: [] } } });
    infiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
  });

  it("passes repRates and params to children", () => {
    const profile = { id: "profile-id", handle: "alice" } as ApiIdentity;
    const params = { p: 1 } as any;
    render(
      <AuthContext.Provider
        value={{ connectedProfile: { handle: "charlie" } } as any}>
        <UserPageRep
          profile={profile}
          initialActivityLogParams={params}
        />
      </AuthContext.Provider>
    );
    expect(headerProps.overview).toEqual({ score: 1 });
    expect(headerProps.profile).toBe(profile);
    expect(activityProps.initialActivityLogParams).toBe(params);
  });

  it("disables wallet-only REP and NIC queries in both directions", () => {
    const profile = { id: null, handle: null } as ApiIdentity;
    render(
      <UserPageRep
        profile={profile}
        initialActivityLogParams={
          { handleOrWallet: "alice" } as ActivityLogParams
        }
      />
    );

    act(() => headerProps.onRepDirectionChange("given"));

    expect(queryMock.mock.calls.map(([options]) => options.enabled)).toEqual(
      [false, false, false, false, false, false]
    );
    expect(
      infiniteQueryMock.mock.calls.map(([options]) => options.enabled)
    ).toEqual([false, false, false, false]);
  });
});

it.each([null, "profile-id"])(
  "gates the NIC Given query with profile ID %s",
  (id) => {
    const profile = { id, primary_wallet: "0xabc" } as ApiIdentity;
    const queryMock = jest.mocked(useQuery);
    const { result } = renderHook(() => useNicRatingsOverview(profile, null));

    act(() => result.current.setDirection("given"));

    expect(queryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: !!id })
    );
  }
);
