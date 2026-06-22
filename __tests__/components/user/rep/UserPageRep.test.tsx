import { AuthContext } from "@/components/auth/Auth";
import UserPageRep from "@/components/user/rep/UserPageRep";
import { useQuery } from "@tanstack/react-query";
import { render } from "@testing-library/react";

jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));

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

  beforeEach(() => {
    headerProps = activityProps = undefined;
    queryMock.mockReturnValue({ data: { score: 1 } });
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
    expect(headerProps.repRates).toEqual({ score: 1 });
    expect(headerProps.profile).toBe(profile);
    expect(activityProps.initialActivityLogParams).toBe(params);
  });
});
