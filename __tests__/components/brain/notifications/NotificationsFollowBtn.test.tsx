import { render, screen } from "@testing-library/react";
import NotificationsFollowBtn from "@/components/brain/notifications/NotificationsFollowBtn";
import UserFollowBtn, {
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { ApiIdentitySubscriptionTargetAction } from "@/generated/models/ApiIdentitySubscriptionTargetAction";

jest.mock("@/components/user/utils/UserFollowBtn", () => ({
  __esModule: true,
  default: jest.fn(() => <button>Account follow control</button>),
  UserFollowBtnSize: { SMALL: "SMALL", MEDIUM: "MEDIUM" },
}));

const profile = {
  handle: "bob",
  subscribed_actions: [ApiIdentitySubscriptionTargetAction.DropCreated],
} as ApiProfileMin;

it("uses the shared account follow control with notification context", () => {
  render(
    <NotificationsFollowBtn
      profile={profile}
      size={UserFollowBtnSize.SMALL}
      followLabel="Follow creator"
      followingLabel="Following creator"
    />
  );

  expect(
    screen.getByRole("button", { name: "Account follow control" })
  ).toBeInTheDocument();
  expect(jest.mocked(UserFollowBtn).mock.calls[0]?.[0]).toMatchObject({
    handle: "bob",
    size: UserFollowBtnSize.SMALL,
    showMuteButton: false,
    initialFollowing: true,
    followLabel: "Follow creator",
    followingLabel: "Following creator",
  });
});

it("omits the follow control for a profile without a handle", () => {
  render(<NotificationsFollowBtn profile={{ ...profile, handle: null }} />);

  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
