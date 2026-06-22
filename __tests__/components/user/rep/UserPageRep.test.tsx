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
  () => (_props: any) => {
    return <div data-testid="mobile" />;
  }
);
jest.mock(
  "@/components/user/utils/rate/UserPageRateWrapper",
  () => (props: any) => {
    return <div data-testid="ratewrapper">{props.children}</div>;
  }
);
jest.mock(
  "@/components/user/identity/getting-started/IdentityGettingStartedCard",
  () => () => <div data-testid="getting-started" />
);
jest.mock("@/components/user/identity/header/UserPageIdentityHeader", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="identity-header" />),
}));
jest.mock(
  "@/components/user/identity/statements/UserPageIdentityStatements",
  () => () => <div data-testid="identity-statements" />
);
jest.mock(
  "@/components/user/rep/RepContributorsDialog",
  () => () => <div data-testid="contributors-dialog" />
);
jest.mock(
  "@/components/rep/categories/GlobalRepCategoryDialog",
  () => () => <div data-testid="global-category-dialog" />
);
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperDialog",
  () =>
    ({ children, isOpen }: any) =>
      isOpen ? <div data-testid="mobile-dialog">{children}</div> : null
);

describe("UserPageRep", () => {
  const queryMock = useQuery as jest.Mock;
  const infiniteQueryMock = useInfiniteQuery as jest.Mock;

  beforeEach(() => {
    headerProps = activityProps = undefined;
    queryMock.mockReturnValue({ data: { score: 1 } });
    infiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    });
  });

  it("passes overview and params to children", () => {
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
