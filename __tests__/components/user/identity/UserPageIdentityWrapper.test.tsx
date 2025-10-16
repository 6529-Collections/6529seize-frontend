import UserPageIdentityWrapper from "@/components/user/identity/UserPageIdentityWrapper";
import { render } from "@testing-library/react";

const useIdentityMock = jest.fn();

jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: (...args: any[]) => useIdentityMock(...args),
}));

let wrapperProfile: any;
let identityProps: any;
let wrapperHandle: any;

jest.mock(
  "@/components/user/utils/set-up-profile/UserPageSetUpProfileWrapper",
  () => (props: any) => {
    wrapperProfile = props.profile;
    wrapperHandle = props.handleOrWallet;
    return <div data-testid="wrapper">{props.children}</div>;
  }
);
jest.mock("@/components/user/identity/UserPageIdentity", () => (props: any) => {
  identityProps = props;
  return <div data-testid="identity" />;
});

describe("UserPageIdentityWrapper", () => {
  beforeEach(() => {
    wrapperProfile = null;
    identityProps = null;
    wrapperHandle = null;
    useIdentityMock.mockReset();
  });

  it("falls back to initial profile when identity query is empty", () => {
    useIdentityMock.mockReturnValue({ profile: null });

    const profile: any = { handle: "alice" };
    const receivedParams: any = { foo: "bar" };
    const givenParams: any = { baz: "qux" };
    const activityParams: any = { page: 1 };
    const statements: any[] = [];
    const cicGivenData: any = { data: [] };
    const cicReceivedData: any = { data: [] };
    const activityData: any = { data: [] };

    render(
      <UserPageIdentityWrapper
        profile={profile}
        initialCICReceivedParams={receivedParams}
        initialCICGivenParams={givenParams}
        initialActivityLogParams={activityParams}
        handleOrWallet="alice"
        initialStatements={statements}
        initialCicGivenData={cicGivenData}
        initialCicReceivedData={cicReceivedData}
        initialActivityLogData={activityData}
      />
    );

    expect(useIdentityMock).toHaveBeenCalledWith({
      handleOrWallet: "alice",
      initialProfile: profile,
    });

    expect(wrapperProfile).toBe(profile);
    expect(wrapperHandle).toBe("alice");
    expect(identityProps.profile).toBe(profile);
    expect(identityProps.initialCICReceivedParams).toBe(receivedParams);
    expect(identityProps.initialCICGivenParams).toBe(givenParams);
    expect(identityProps.initialActivityLogParams).toBe(activityParams);
    expect(identityProps.handleOrWallet).toBe("alice");
    expect(identityProps.initialStatements).toBe(statements);
    expect(identityProps.initialCicGivenData).toBe(cicGivenData);
    expect(identityProps.initialCicReceivedData).toBe(cicReceivedData);
    expect(identityProps.initialActivityLogData).toBe(activityData);
  });

  it("passes hydrated profile from identity query when available", () => {
    const profile: any = { handle: "alice" };
    const hydrated: any = { handle: "alice", cic: 42 };
    useIdentityMock.mockReturnValue({ profile: hydrated });

    render(
      <UserPageIdentityWrapper
        profile={profile}
        initialCICReceivedParams={{} as any}
        initialCICGivenParams={{} as any}
        initialActivityLogParams={{} as any}
        handleOrWallet="Alice"
        initialStatements={[]}
        initialCicGivenData={{} as any}
        initialCicReceivedData={{} as any}
        initialActivityLogData={{} as any}
      />
    );

    expect(wrapperProfile).toBe(hydrated);
    expect(identityProps.profile).toBe(hydrated);
    expect(useIdentityMock).toHaveBeenCalledWith({
      handleOrWallet: "alice",
      initialProfile: profile,
    });
  });
});
