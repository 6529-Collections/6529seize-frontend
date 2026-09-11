import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ApiDeleteMyWaveChatHistoryResponse } from "@/generated/models/ApiDeleteMyWaveChatHistoryResponse";
import WaveConfigurationDeleteChatHistory from "@/components/waves/groups/WaveConfigurationDeleteChatHistory";

const mockInvalidateDrops = jest.fn();
const mockProcessDropRemoved = jest.fn();
const mockRequestAuth = jest.fn();
const mockSetToast = jest.fn();
const mockCommonApiDeleteWithResponse = jest.fn();
const mockMutate = jest.fn();

const mockAuthState: {
  activeProfileProxy: object | null;
  connectedProfile: object | null;
  requestAuth: typeof mockRequestAuth;
  setToast: typeof mockSetToast;
} = {
  activeProfileProxy: null,
  connectedProfile: { id: "profile-1" },
  requestAuth: mockRequestAuth,
  setToast: mockSetToast,
};

type MutationOptions = {
  readonly mutationFn: () => Promise<ApiDeleteMyWaveChatHistoryResponse>;
  readonly onSuccess: (response: ApiDeleteMyWaveChatHistoryResponse) => void;
  readonly onError: (error: unknown) => void;
};

let mockMutationOptions: MutationOptions | null = null;
let mockIsPending = false;

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAuthState,
}));

jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    ReactQueryWrapperContext: React.createContext({
      invalidateDrops: (...args: unknown[]) => mockInvalidateDrops(...args),
    }),
  };
});

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({ processDropRemoved: mockProcessDropRemoved }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiDeleteWithResponse: (...args: unknown[]) =>
    mockCommonApiDeleteWithResponse(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: (options: MutationOptions) => {
    mockMutationOptions = options;
    return { isPending: mockIsPending, mutate: mockMutate };
  },
}));

jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog",
  () =>
    function MockConfirmationDialog({
      isOpen,
      onClose,
      onConfirm,
      title,
      message,
      confirmText,
      cancelText,
    }: {
      readonly isOpen: boolean;
      readonly onClose: () => void;
      readonly onConfirm: () => void;
      readonly title: string;
      readonly message: string;
      readonly confirmText: string;
      readonly cancelText: string;
    }) {
      if (!isOpen) {
        return null;
      }
      return (
        <div role="dialog" aria-label={title}>
          <p>{message}</p>
          <button type="button" onClick={onConfirm}>
            {confirmText}
          </button>
          <button type="button" onClick={onClose}>
            {cancelText}
          </button>
        </div>
      );
    }
);

describe("WaveConfigurationDeleteChatHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutationOptions = null;
    mockIsPending = false;
    mockAuthState.activeProfileProxy = null;
    mockAuthState.connectedProfile = { id: "profile-1" };
    mockRequestAuth.mockResolvedValue({ success: true });
    mockCommonApiDeleteWithResponse.mockResolvedValue({
      deleted_drop_ids: ["drop-1", "drop-2"],
      preserved_pinned_drop_id: "pinned-drop",
    });
    mockMutate.mockImplementation(() => {
      const options = mockMutationOptions;
      if (!options) {
        throw new Error("Mutation options were not initialized");
      }
      void options.mutationFn().then(options.onSuccess, options.onError);
    });
  });

  it("opens the irreversible confirmation and deletes only after authentication", async () => {
    render(
      <WaveConfigurationDeleteChatHistory wave={{ id: "wave-1" } as never} />
    );

    const trigger = screen.getByRole("button", {
      name: "Delete all my messages from this wave",
    });
    expect(trigger.className).toContain("!tw-border-red");
    expect(trigger.className).toContain("!tw-bg-black");

    fireEvent.click(trigger);

    expect(
      screen.getByRole("dialog", { name: "Delete all your messages?" })
    ).toHaveTextContent(
      "Submission drops will not be deleted. This is irreversible."
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Yes, delete my messages" })
    );

    await waitFor(() => expect(mockRequestAuth).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockCommonApiDeleteWithResponse).toHaveBeenCalledWith({
        endpoint: "waves/wave-1/my-chat-history",
      })
    );
    await waitFor(() => {
      expect(mockProcessDropRemoved).toHaveBeenCalledTimes(2);
      expect(mockInvalidateDrops).toHaveBeenCalledTimes(1);
    });
    expect(mockProcessDropRemoved).toHaveBeenNthCalledWith(
      1,
      "wave-1",
      "drop-1"
    );
    expect(mockProcessDropRemoved).toHaveBeenNthCalledWith(
      2,
      "wave-1",
      "drop-2"
    );
    expect(mockSetToast).toHaveBeenCalledWith({
      message: "Your chat history was deleted from this wave.",
      type: "warning",
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays hidden without a connected profile or while using a proxy", () => {
    mockAuthState.connectedProfile = null;
    const { rerender } = render(
      <WaveConfigurationDeleteChatHistory wave={{ id: "wave-1" } as never} />
    );
    expect(
      screen.queryByRole("button", {
        name: "Delete all my messages from this wave",
      })
    ).not.toBeInTheDocument();

    mockAuthState.connectedProfile = { id: "profile-1" };
    mockAuthState.activeProfileProxy = { id: "proxy-1" };
    rerender(
      <WaveConfigurationDeleteChatHistory wave={{ id: "wave-1" } as never} />
    );
    expect(
      screen.queryByRole("button", {
        name: "Delete all my messages from this wave",
      })
    ).not.toBeInTheDocument();
  });

  it("reports an empty deletion response without removing local drops", async () => {
    mockCommonApiDeleteWithResponse.mockResolvedValue({
      deleted_drop_ids: [],
      preserved_pinned_drop_id: null,
    });
    render(
      <WaveConfigurationDeleteChatHistory wave={{ id: "wave-1" } as never} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete all my messages from this wave",
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Yes, delete my messages" })
    );

    await waitFor(() =>
      expect(mockSetToast).toHaveBeenCalledWith({
        message: "No chat messages were deleted.",
        type: "warning",
      })
    );
    expect(mockProcessDropRemoved).not.toHaveBeenCalled();
    expect(mockInvalidateDrops).toHaveBeenCalledTimes(1);
  });

  it("keeps the dialog open and reports API failures", async () => {
    mockCommonApiDeleteWithResponse.mockRejectedValue(
      new Error("delete failed")
    );
    render(
      <WaveConfigurationDeleteChatHistory wave={{ id: "wave-1" } as never} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete all my messages from this wave",
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Yes, delete my messages" })
    );

    await waitFor(() =>
      expect(mockSetToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Couldn't delete your chat history.",
        })
      )
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not call the API when authentication is cancelled", async () => {
    mockRequestAuth.mockResolvedValue({ success: false });
    render(
      <WaveConfigurationDeleteChatHistory wave={{ id: "wave-1" } as never} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete all my messages from this wave",
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Yes, delete my messages" })
    );

    await waitFor(() => expect(mockRequestAuth).toHaveBeenCalledTimes(1));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("ignores duplicate confirmation while deletion is pending", () => {
    mockIsPending = true;
    render(
      <WaveConfigurationDeleteChatHistory wave={{ id: "wave-1" } as never} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete all my messages from this wave",
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Yes, delete my messages" })
    );

    expect(mockRequestAuth).not.toHaveBeenCalled();
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
