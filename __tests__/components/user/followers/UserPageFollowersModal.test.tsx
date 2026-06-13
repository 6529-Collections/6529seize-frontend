import { render, screen } from "@testing-library/react";
import UserPageFollowersModal from "@/components/user/followers/UserPageFollowersModal";
import useFollowersList from "@/hooks/useFollowersList";

const followersListWrapper = jest.fn((props: any) => (
  <div data-testid="followers-list">{props.followers.length}</div>
));

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({ title, children }: any) => (
    <section role="dialog" aria-label={title}>
      {children}
    </section>
  ),
}));

jest.mock("@/components/utils/followers/FollowersListWrapper", () => ({
  __esModule: true,
  default: (props: any) => followersListWrapper(props),
}));

jest.mock("@/hooks/useFollowersList");

const mockedUseFollowersList = useFollowersList as jest.Mock;

describe("UserPageFollowersModal", () => {
  beforeEach(() => {
    followersListWrapper.mockClear();
    mockedUseFollowersList.mockReturnValue({
      followers: [{ identity: { id: "1", handle: "alice" } }],
      isFetching: false,
      onBottomIntersection: jest.fn(),
    });
  });

  it("uses the localized followers title and forwards list state", () => {
    render(
      <UserPageFollowersModal
        profileId="profile-1"
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: "Followers" })).toBeInTheDocument();
    expect(mockedUseFollowersList).toHaveBeenCalledWith({
      profileId: "profile-1",
      enabled: true,
    });
    expect(followersListWrapper).toHaveBeenCalledWith(
      expect.objectContaining({
        followers: [{ identity: { id: "1", handle: "alice" } }],
        loading: false,
        showFollowButtons: true,
      })
    );
  });
});
