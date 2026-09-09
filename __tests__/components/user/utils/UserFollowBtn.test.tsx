import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserFollowBtn, {
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "@/services/api/common-api";

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query"
  );
  return { ...actual, useQuery: jest.fn() };
});
jest.mock("@/services/api/common-api", () => ({
  commonApiDeleteWithBody: jest.fn(),
  commonApiPost: jest.fn(),
}));

const useQueryMock = useQuery as jest.Mock;
const commonApiPostMock = commonApiPost as jest.Mock;
const commonApiDeleteWithBodyMock = commonApiDeleteWithBody as jest.Mock;

describe("UserFollowBtn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    commonApiPostMock.mockResolvedValue(undefined);
    commonApiDeleteWithBodyMock.mockResolvedValue(undefined);
  });

  function setup({
    following,
    requestSuccess = true,
    onDirectMessage,
    directMessageLoading,
    size,
    blocked,
    onUnblock,
  }: {
    readonly following: boolean;
    readonly requestSuccess?: boolean | undefined;
    readonly onDirectMessage?: jest.Mock | undefined;
    readonly directMessageLoading?: boolean | undefined;
    readonly size?: UserFollowBtnSize | undefined;
    readonly blocked?: boolean | undefined;
    readonly onUnblock?: jest.Mock | undefined;
  }) {
    useQueryMock.mockReturnValue({
      data: following ? { actions: [1] } : { actions: [] },
      isFetching: false,
    });
    const requestAuth = jest
      .fn()
      .mockResolvedValue({ success: requestSuccess });
    const setToast = jest.fn();
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
            value={{ onIdentityFollowChange: jest.fn() } as any}
          >
            <UserFollowBtn
              handle="bob"
              size={size}
              onDirectMessage={onDirectMessage}
              directMessageLoading={directMessageLoading}
              showMuteButton={false}
              blocked={blocked}
              onUnblock={onUnblock}
            />
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
    return { requestAuth, setToast };
  }

  it("follows when not following", async () => {
    const user = userEvent.setup();
    const { requestAuth } = setup({ following: false });
    const followButton = screen.getByRole("button", { name: "Follow" });
    expect(followButton).toHaveClass("tw-font-semibold");
    await user.click(followButton);
    expect(requestAuth).toHaveBeenCalled();
    await waitFor(() => {
      expect(commonApiPostMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "identities/bob/subscriptions",
        })
      );
    });
    expect(commonApiDeleteWithBodyMock).not.toHaveBeenCalled();
  });

  it("unfollows when already following", async () => {
    const user = userEvent.setup();
    setup({ following: true });
    await user.click(screen.getByRole("button", { name: "Unfollow" }));

    await waitFor(() => {
      expect(commonApiDeleteWithBodyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "identities/bob/subscriptions",
        })
      );
    });
    expect(commonApiPostMock).not.toHaveBeenCalled();
  });

  it("replaces Follow with Unblock for a blocked profile", async () => {
    const user = userEvent.setup();
    const onUnblock = jest.fn();
    const { requestAuth } = setup({
      following: true,
      blocked: true,
      onUnblock,
      onDirectMessage: jest.fn(),
    });

    await user.click(screen.getByRole("button", { name: "Unblock bob" }));

    expect(onUnblock).toHaveBeenCalledTimes(1);
    expect(requestAuth).not.toHaveBeenCalled();
    expect(commonApiPostMock).not.toHaveBeenCalled();
    expect(commonApiDeleteWithBodyMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Send direct message" })
    ).toBeInTheDocument();
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
      buttonName: "Unfollow",
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

  it("shows DM button when not following", () => {
    setup({ following: false, onDirectMessage: jest.fn() });
    expect(
      screen.getByRole("button", { name: "Send direct message" })
    ).toBeInTheDocument();
  });

  it("shows DM button when following", () => {
    setup({ following: true, onDirectMessage: jest.fn() });
    expect(
      screen.getByRole("button", { name: "Send direct message" })
    ).toBeInTheDocument();
  });

  it("matches the small follow button height with a square small DM button", () => {
    setup({
      following: false,
      onDirectMessage: jest.fn(),
      size: UserFollowBtnSize.SMALL,
    });

    const dmButton = screen.getByRole("button", {
      name: "Send direct message",
    });

    expect(dmButton).toHaveClass(
      "tw-size-8",
      "tw-bg-iron-800",
      "tw-ring-iron-700"
    );
    expect(dmButton).not.toHaveClass("tw-min-w-[4rem]");
    expect(dmButton.querySelector("svg")).toHaveClass("tw-size-3");
    expect(dmButton).toHaveAttribute("data-tooltip-id", "dm-bob");
    expect(dmButton).not.toHaveAttribute("data-tooltip-content");
  });

  it("matches the medium follow button height with a square medium DM button", () => {
    setup({
      following: false,
      onDirectMessage: jest.fn(),
      size: UserFollowBtnSize.MEDIUM,
    });

    const dmButton = screen.getByRole("button", {
      name: "Send direct message",
    });

    expect(dmButton).toHaveClass(
      "tw-size-9",
      "md:tw-size-10",
      "tw-bg-iron-800",
      "tw-ring-iron-700"
    );
    expect(dmButton).not.toHaveClass("tw-min-w-[4.75rem]");
    expect(dmButton.querySelector("svg")).toHaveClass(
      "tw-size-3.5",
      "md:tw-size-4"
    );
  });

  it("disables the DM button while loading", () => {
    setup({
      following: false,
      onDirectMessage: jest.fn(),
      directMessageLoading: true,
    });

    expect(
      screen.getByRole("button", { name: "Send direct message" })
    ).toBeDisabled();
  });

  it("guards the DM button against double clicks while pending", async () => {
    const user = userEvent.setup();
    let resolveDirectMessage: (() => void) | undefined;
    const onDirectMessage = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveDirectMessage = resolve;
        })
    );

    setup({
      following: false,
      onDirectMessage,
    });

    const dmButton = screen.getByRole("button", {
      name: "Send direct message",
    });

    await user.click(dmButton);
    expect(dmButton).toBeDisabled();
    await user.click(dmButton);

    expect(onDirectMessage).toHaveBeenCalledTimes(1);

    resolveDirectMessage?.();

    await waitFor(() => {
      expect(dmButton).not.toBeDisabled();
    });
  });
});
