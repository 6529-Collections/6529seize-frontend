import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthContext } from "@/components/auth/Auth";
import NotificationsFollowAllBtn from "@/components/brain/notifications/NotificationsFollowAllBtn";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiIdentitySubscriptionTargetAction } from "@/generated/models/ApiIdentitySubscriptionTargetAction";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { commonApiPost } from "@/services/api/common-api";
import type { ComponentProps } from "react";

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

const createProfile = ({
  handle,
  subscribed = false,
}: {
  readonly handle: string | null;
  readonly subscribed?: boolean;
}): ApiProfileMin =>
  ({
    id: handle ?? "unknown-profile",
    handle,
    pfp: null,
    primary_address: "",
    subscribed_actions: subscribed
      ? [ApiIdentitySubscriptionTargetAction.WaveCreated]
      : [],
  }) as ApiProfileMin;

const renderButton = (profiles: readonly ApiProfileMin[]) => {
  const requestAuth = jest.fn().mockResolvedValue({ success: true });
  const setToast = jest.fn();
  const onIdentityFollowChange = jest.fn();
  const auth = {
    requestAuth,
    setToast,
  } as unknown as ComponentProps<typeof AuthContext.Provider>["value"];
  const reactQuery = {
    onIdentityFollowChange,
  } as unknown as ComponentProps<
    typeof ReactQueryWrapperContext.Provider
  >["value"];

  render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={reactQuery}>
        <NotificationsFollowAllBtn profiles={profiles} />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );

  return {
    onIdentityFollowChange,
    requestAuth,
  };
};

describe("NotificationsFollowAllBtn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (commonApiPost as jest.Mock).mockResolvedValue({ actions: [] });
  });

  it("subscribes only reactors that are not already followed", async () => {
    const user = userEvent.setup();
    const { onIdentityFollowChange, requestAuth } = renderButton([
      createProfile({ handle: "alice", subscribed: true }),
      createProfile({ handle: "bob" }),
      createProfile({ handle: "BOB" }),
      createProfile({ handle: null }),
    ]);

    await user.click(screen.getByRole("button", { name: /follow all/i }));

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledTimes(1);
    });
    expect(commonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "identities/bob/subscriptions",
      })
    );
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(onIdentityFollowChange).toHaveBeenCalledTimes(1);
  });

  it("is disabled when every reactor with a handle is already followed", () => {
    const { requestAuth } = renderButton([
      createProfile({ handle: "alice", subscribed: true }),
      createProfile({ handle: "bob", subscribed: true }),
      createProfile({ handle: null }),
    ]);

    expect(
      screen.getByRole("button", { name: /following all/i })
    ).toBeDisabled();
    expect(commonApiPost).not.toHaveBeenCalled();
    expect(requestAuth).not.toHaveBeenCalled();
  });
});
