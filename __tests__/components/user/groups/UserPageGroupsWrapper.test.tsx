import UserPageGroupsWrapper from "@/components/user/groups/UserPageGroupsWrapper";
import { useIdentity } from "@/hooks/useIdentity";
import { render } from "@testing-library/react";
import { useParams, useRouter } from "next/navigation";

let capturedWrapperProfile: any = null;
let capturedGroupsProfile: any = null;

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));

jest.mock(
  "@/components/user/utils/set-up-profile/UserPageSetUpProfileWrapper",
  () =>
    function MockWrapper({ profile, children }: any) {
      capturedWrapperProfile = profile;
      return <div data-testid="wrapper">{children}</div>;
    }
);

jest.mock(
  "@/components/user/groups/UserPageGroups",
  () =>
    function MockGroups(props: any) {
      capturedGroupsProfile = props.profile;
      return <div data-testid="groups" />;
    }
);

describe("UserPageGroupsWrapper", () => {
  const useRouterMock = useRouter as jest.Mock;
  const useIdentityMock = useIdentity as jest.Mock;
  const useParamsMock = useParams as jest.Mock;

  beforeEach(() => {
    capturedWrapperProfile = null;
    capturedGroupsProfile = null;
  });

  it("passes profile from hook when available", () => {
    useParamsMock.mockReturnValue({ user: "alice" });
    const profile = { handle: "alice" } as any;
    useIdentityMock.mockReturnValue({ profile });
    render(<UserPageGroupsWrapper profile={profile} />);
    expect(useIdentityMock).toHaveBeenCalledWith({
      handleOrWallet: "alice",
      initialProfile: profile,
    });
    expect(capturedWrapperProfile).toBe(profile);
    expect(capturedGroupsProfile).toBe(profile);
  });

  it("falls back to initial profile when hook returns null", () => {
    useRouterMock.mockReturnValue({ query: { user: "bob" } });
    const initialProfile = { handle: "bob" } as any;
    useIdentityMock.mockReturnValue({ profile: null });
    render(<UserPageGroupsWrapper profile={initialProfile} />);
    expect(capturedWrapperProfile).toBe(initialProfile);
    expect(capturedGroupsProfile).toBeNull();
  });
});
