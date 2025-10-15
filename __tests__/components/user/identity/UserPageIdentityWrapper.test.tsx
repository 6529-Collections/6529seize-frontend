import UserPageIdentityWrapper from "@/components/user/identity/UserPageIdentityWrapper";
import { render } from "@testing-library/react";

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
  });

  it("passes initial data to child components", () => {
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
});
