import { AuthContext } from "@/components/auth/Auth";
import UserPageRep from "@/components/user/rep/UserPageRep";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { render } from "@testing-library/react";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
  useQuery: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useParams: () => ({ user: "alice" }),
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
    const profile = { handle: "alice" } as any;
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
});
