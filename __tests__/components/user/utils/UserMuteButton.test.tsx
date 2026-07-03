import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthContext } from "@/components/auth/Auth";
import UserMuteButton from "@/components/user/utils/UserMuteButton";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiDelete: jest.fn(),
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({
    children,
    id,
  }: {
    readonly children: ReactNode;
    readonly id: string;
  }) => <div data-testid={`tooltip-${id}`}>{children}</div>,
}));

const commonApiDeleteMock = commonApiDelete as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;
const commonApiPostMock = commonApiPost as jest.Mock;

function renderMuteButton({
  handle = "alice",
  muted = false,
  requestSuccess = true,
}: {
  readonly handle?: string;
  readonly muted?: boolean;
  readonly requestSuccess?: boolean;
} = {}) {
  commonApiFetchMock.mockResolvedValue({ muted });
  commonApiDeleteMock.mockResolvedValue(undefined);
  commonApiPostMock.mockResolvedValue({ muted: true });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const setToast = jest.fn();
  const requestAuth = jest.fn().mockResolvedValue({ success: requestSuccess });

  render(
    <AuthContext.Provider value={{ setToast, requestAuth } as any}>
      <QueryClientProvider client={queryClient}>
        <UserMuteButton
          handle={handle}
          buttonClassName="tw-size-10"
          iconClassName="tw-size-4"
        />
      </QueryClientProvider>
    </AuthContext.Provider>
  );

  return { queryClient, requestAuth, setToast };
}

describe("UserMuteButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("mutes with an encoded identity key and no request body", async () => {
    const user = userEvent.setup();
    const { requestAuth } = renderMuteButton({
      handle: "alice profile",
      muted: false,
    });

    await waitFor(() => {
      expect(commonApiFetchMock).toHaveBeenCalledWith({
        endpoint: "/identities/alice%20profile/mute",
      });
    });

    const muteButton = screen.getByRole("button", {
      name: "Mute notifications from this profile",
    });
    await waitFor(() => expect(muteButton).not.toBeDisabled());

    await user.click(muteButton);

    await waitFor(() => {
      expect(requestAuth).toHaveBeenCalledTimes(1);
      expect(commonApiPostMock).toHaveBeenCalledWith({
        endpoint: "/identities/alice%20profile/mute",
        body: undefined,
      });
    });
    await waitFor(() => {
      expect(
        screen.getByText("Notifications from this profile are muted.")
      ).toBeInTheDocument();
    });
  });

  it("unmutes with a delete request", async () => {
    const user = userEvent.setup();
    renderMuteButton({ muted: true });

    const unmuteButton = await screen.findByRole("button", {
      name: "Unmute notifications from this profile",
    });
    await waitFor(() => expect(unmuteButton).not.toBeDisabled());

    await user.click(unmuteButton);

    await waitFor(() => {
      expect(commonApiDeleteMock).toHaveBeenCalledWith({
        endpoint: "/identities/alice/mute",
      });
    });
    await waitFor(() => {
      expect(
        screen.getByText("Notifications from this profile are not muted.")
      ).toBeInTheDocument();
    });
  });

  it("does not call the mute-state endpoint for an empty handle", () => {
    renderMuteButton({ handle: "   " });

    expect(
      screen.getByRole("button", {
        name: "Mute notifications from this profile",
      })
    ).toBeDisabled();
    expect(commonApiFetchMock).not.toHaveBeenCalled();
  });

  it("uses the intended mute action in the error toast", async () => {
    const user = userEvent.setup();
    commonApiPostMock.mockRejectedValueOnce(new Error("failed"));
    const { setToast } = renderMuteButton({ muted: false });

    const muteButton = screen.getByRole("button", {
      name: "Mute notifications from this profile",
    });
    await waitFor(() => expect(muteButton).not.toBeDisabled());

    await user.click(muteButton);

    await waitFor(() => {
      expect(setToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Couldn't mute this profile.",
          description: "Please try again.",
        })
      );
    });
  });
});
