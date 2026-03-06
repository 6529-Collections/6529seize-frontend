import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserFollowBtn from "@/components/user/utils/UserFollowBtn";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";

jest.mock("@tanstack/react-query");

const useQueryMock = useQuery as jest.Mock;
const useMutationMock = useMutation as jest.Mock;

describe("UserFollowBtn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setup({
    following,
    requestSuccess = true,
    onDirectMessage,
    directMessageLoading,
  }: {
    readonly following: boolean;
    readonly requestSuccess?: boolean | undefined;
    readonly onDirectMessage?: jest.Mock | undefined;
    readonly directMessageLoading?: boolean | undefined;
  }) {
    useQueryMock.mockReturnValue({
      data: following ? { actions: [1] } : { actions: [] },
      isFetching: false,
    });
    const mutateFollow = jest.fn();
    const mutateUnfollow = jest.fn();
    useMutationMock
      .mockReturnValueOnce({ mutateAsync: mutateFollow })
      .mockReturnValueOnce({ mutateAsync: mutateUnfollow });
    const requestAuth = jest
      .fn()
      .mockResolvedValue({ success: requestSuccess });
    render(
      <AuthContext.Provider value={{ setToast: jest.fn(), requestAuth } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ onIdentityFollowChange: jest.fn() } as any}
        >
          <UserFollowBtn
            handle="bob"
            onDirectMessage={onDirectMessage}
            directMessageLoading={directMessageLoading}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    return { mutateFollow, mutateUnfollow, requestAuth };
  }

  it("follows when not following", async () => {
    const user = userEvent.setup();
    const { mutateFollow, requestAuth } = setup({ following: false });
    await user.click(screen.getByRole("button"));
    expect(requestAuth).toHaveBeenCalled();
    expect(mutateFollow).toHaveBeenCalled();
  });

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
