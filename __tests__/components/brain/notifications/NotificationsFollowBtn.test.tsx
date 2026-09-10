import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationsFollowBtn from "@/components/brain/notifications/NotificationsFollowBtn";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiIdentitySubscriptionTargetAction } from "@/generated/models/ApiIdentitySubscriptionTargetAction";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiDeleteWithBody: jest.fn(),
  commonApiPost: jest.fn(),
}));

const commonApiPostMock = commonApiPost as jest.Mock;
const commonApiDeleteWithBodyMock = commonApiDeleteWithBody as jest.Mock;

function createProfile(following: boolean): ApiProfileMin {
  return {
    handle: "bob",
    subscribed_actions: following
      ? [ApiIdentitySubscriptionTargetAction.DropCreated]
      : [],
  } as ApiProfileMin;
}

describe("NotificationsFollowBtn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    commonApiPostMock.mockResolvedValue(undefined);
    commonApiDeleteWithBodyMock.mockResolvedValue(undefined);
  });

  function setup({
    following,
    requestSuccess = true,
  }: {
    following: boolean;
    requestSuccess?: boolean;
  }) {
    const requestAuth = jest
      .fn()
      .mockResolvedValue({ success: requestSuccess });
    const setToast = jest.fn();
    const onIdentityFollowChange = jest.fn();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ setToast, requestAuth } as any}>
          <ReactQueryWrapperContext.Provider
            value={{ onIdentityFollowChange } as any}
          >
            <NotificationsFollowBtn profile={createProfile(following)} />
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    return { onIdentityFollowChange, requestAuth, setToast };
  }

  it("follows when not currently following", async () => {
    const user = userEvent.setup();
    const { onIdentityFollowChange, requestAuth } = setup({ following: false });

    await user.click(screen.getByRole("button", { name: "Follow" }));

    expect(requestAuth).toHaveBeenCalled();
    await waitFor(() => {
      expect(commonApiPostMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "identities/bob/subscriptions",
        })
      );
    });
    expect(commonApiDeleteWithBodyMock).not.toHaveBeenCalled();
    expect(onIdentityFollowChange).toHaveBeenCalled();
  });

  it("unfollows when already following", async () => {
    const user = userEvent.setup();
    const { onIdentityFollowChange } = setup({ following: true });

    await user.click(screen.getByRole("button", { name: "Following" }));

    await waitFor(() => {
      expect(commonApiDeleteWithBodyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "identities/bob/subscriptions",
        })
      );
    });
    expect(commonApiPostMock).not.toHaveBeenCalled();
    expect(onIdentityFollowChange).toHaveBeenCalled();
  });

  it("does not mutate when authentication fails", async () => {
    const user = userEvent.setup();
    setup({ following: false, requestSuccess: false });
    const followButton = screen.getByRole("button", { name: "Follow" });

    await user.click(followButton);

    expect(commonApiPostMock).not.toHaveBeenCalled();
    expect(commonApiDeleteWithBodyMock).not.toHaveBeenCalled();
    expect(followButton).not.toBeDisabled();
  });

  it.each([
    {
      action: "follow",
      following: false,
      buttonName: "Follow",
      getRequestMock: () => commonApiPostMock,
      toastTitle: "Couldn't follow this profile.",
    },
    {
      action: "unfollow",
      following: true,
      buttonName: "Following",
      getRequestMock: () => commonApiDeleteWithBodyMock,
      toastTitle: "Couldn't unfollow this profile.",
    },
  ])(
    "restores the button and shows a toast after a failed $action",
    async ({ following, buttonName, getRequestMock, toastTitle }) => {
      const expectedError = new Error("network unavailable");
      getRequestMock().mockRejectedValueOnce(expectedError);
      const user = userEvent.setup();
      const { setToast } = setup({ following });
      const followButton = screen.getByRole("button", { name: buttonName });

      await user.click(followButton);

      await waitFor(() => {
        expect(setToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            title: toastTitle,
            description: "Please try again.",
          })
        );
      });
      expect(followButton).not.toBeDisabled();
    }
  );
});
