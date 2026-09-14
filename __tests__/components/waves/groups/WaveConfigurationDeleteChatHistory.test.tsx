import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import WaveConfigurationDeleteChatHistory from "@/components/waves/groups/WaveConfigurationDeleteChatHistory";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

const mockInvalidateDrops = jest.fn();
const mockProcessDropsRemoved = jest.fn();
const mockRefreshWaveMessages = jest.fn();
const mockRequestAuth = jest.fn();
const mockSetToast = jest.fn();
const mockDelete = jest.fn();
const mockPrepare = jest.fn();
const mockAuthState = {
  activeProfileProxy: null as object | null,
  connectedProfile: { id: "profile-1" } as { id: string } | null,
  requestAuth: mockRequestAuth,
  setToast: mockSetToast,
};

jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuthState }));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    ReactQueryWrapperContext: React.createContext({
      invalidateDrops: (...args: unknown[]) => mockInvalidateDrops(...args),
    }),
  };
});
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    processDropsRemoved: mockProcessDropsRemoved,
    refreshWaveMessages: mockRefreshWaveMessages,
  }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiDeleteWithResponse: (...args: unknown[]) => mockDelete(...args),
  commonApiPost: (...args: unknown[]) => mockPrepare(...args),
}));
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperDialog",
  () =>
    function MockDialog({
      isOpen,
      title,
      children,
      onClose,
      dismissible,
    }: {
      readonly isOpen: boolean;
      readonly title: string;
      readonly children: ReactNode;
      readonly onClose: () => void;
      readonly dismissible: boolean;
    }) {
      return isOpen ? (
        <div role="dialog" aria-label={title}>
          {dismissible && <button onClick={onClose}>Dismiss</button>}
          {children}
        </div>
      ) : null;
    }
);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
const batch = (ids: string[], more: boolean) => ({
  deleted_drop_ids: ids,
  has_more: more,
  preserved_pinned_drop_id: null,
});
let testNumber = 0;
let wave: ApiWave;
function open() {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Delete all my messages from this wave",
    })
  );
}
function confirm() {
  fireEvent.click(
    screen.getByRole("button", { name: "Yes, delete my messages" })
  );
}

describe("WaveConfigurationDeleteChatHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDelete.mockReset();
    mockPrepare.mockReset();
    sessionStorage.clear();
    wave = { id: `wave-${++testNumber}` } as ApiWave;
    mockAuthState.connectedProfile = { id: "profile-1" };
    mockAuthState.activeProfileProxy = null;
    mockRequestAuth.mockResolvedValue({ success: true });
    mockPrepare.mockResolvedValue({ purge_token: "frozen-token" });
    mockDelete.mockResolvedValue(batch([], false));
  });

  it("prepares after confirmation and automatically continues batches, refreshing once", async () => {
    const next = deferred<ReturnType<typeof batch>>();
    mockDelete
      .mockResolvedValueOnce(batch(["d1", "d2"], true))
      .mockReturnValueOnce(next.promise);
    render(<WaveConfigurationDeleteChatHistory wave={wave} />);
    open();
    expect(mockPrepare).not.toHaveBeenCalled();
    confirm();
    await waitFor(() => expect(mockDelete).toHaveBeenCalledTimes(2));
    expect(mockRequestAuth).toHaveBeenCalledTimes(1);
    expect(mockPrepare).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: `waves/${wave.id}/my-chat-history` })
    );
    expect(mockProcessDropsRemoved).toHaveBeenCalledWith(wave.id, ["d1", "d2"]);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Confirmed deletions: at least 2"
    );
    expect(
      screen.getByRole("button", { name: "Yes, delete my messages" })
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Dismiss" })
    ).not.toBeInTheDocument();
    expect(mockInvalidateDrops).not.toHaveBeenCalled();
    await act(async () => next.resolve(batch(["d3"], false)));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(mockProcessDropsRemoved).toHaveBeenLastCalledWith(wave.id, ["d3"]);
    expect(mockRefreshWaveMessages).toHaveBeenCalledTimes(1);
    expect(mockInvalidateDrops).toHaveBeenCalledTimes(1);
    expect(mockSetToast).toHaveBeenCalledTimes(1);
  });

  it("retains committed progress and the original token after a lost response, closing and remounting", async () => {
    mockDelete
      .mockResolvedValueOnce(batch(["known"], true))
      .mockRejectedValueOnce(new Error("response lost"));
    const view = render(<WaveConfigurationDeleteChatHistory wave={wave} />);
    open();
    confirm();
    await screen.findByRole("button", { name: "Retry deletion" });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Confirmed deletions: at least 1"
    );
    expect(mockRefreshWaveMessages).toHaveBeenCalledWith(wave.id);
    expect(mockSetToast).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    view.unmount();
    render(<WaveConfigurationDeleteChatHistory wave={wave} />);
    open();
    fireEvent.click(screen.getByRole("button", { name: "Retry deletion" }));
    await waitFor(() => expect(mockSetToast).toHaveBeenCalledTimes(1));
    expect(mockPrepare).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledTimes(3);
    for (const [request] of mockDelete.mock.calls) {
      expect(request.endpoint).toBe(
        `waves/${wave.id}/my-chat-history?purge_token=frozen-token`
      );
    }
    expect(mockRefreshWaveMessages).toHaveBeenCalledTimes(3);
  });

  it.each([{}, { deleted_drop_ids: [] }, batch([], true)])(
    "does not call a malformed or non-progressing response complete: %j",
    async (response) => {
      mockDelete.mockResolvedValue(response);
      render(<WaveConfigurationDeleteChatHistory wave={wave} />);
      open();
      confirm();
      await screen.findByRole("alert");
      expect(mockSetToast).not.toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockRefreshWaveMessages).toHaveBeenCalledWith(wave.id);
    }
  );

  it("prevents duplicate operations while authentication is unresolved", async () => {
    const auth = deferred<{ success: boolean }>();
    mockRequestAuth.mockReturnValueOnce(auth.promise);
    render(<WaveConfigurationDeleteChatHistory wave={wave} />);
    open();
    confirm();
    confirm();
    expect(mockRequestAuth).toHaveBeenCalledTimes(1);
    await act(async () => auth.resolve({ success: false }));
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it.each(["resolve", "reject"] as const)(
    "ignores an old DELETE that %ss after a profile and wave switch",
    async (outcome) => {
      const pending = deferred<ReturnType<typeof batch>>();
      mockDelete.mockReturnValueOnce(pending.promise);
      const view = render(<WaveConfigurationDeleteChatHistory wave={wave} />);
      open();
      confirm();
      await waitFor(() => expect(mockDelete).toHaveBeenCalledTimes(1));
      mockAuthState.connectedProfile = { id: "profile-2" };
      view.rerender(
        <WaveConfigurationDeleteChatHistory
          wave={{ id: `${wave.id}-new` } as ApiWave}
        />
      );
      await act(async () => {
        if (outcome === "resolve") pending.resolve(batch(["old-drop"], true));
        else pending.reject(new Error("old request failed"));
      });
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockProcessDropsRemoved).not.toHaveBeenCalled();
      expect(mockRefreshWaveMessages).not.toHaveBeenCalled();
      expect(mockInvalidateDrops).not.toHaveBeenCalled();
      expect(mockSetToast).not.toHaveBeenCalled();
    }
  );

  it("stops on the synchronous profile-switch event before React updates", async () => {
    const pending = deferred<ReturnType<typeof batch>>();
    mockDelete.mockReturnValueOnce(pending.promise);
    render(<WaveConfigurationDeleteChatHistory wave={wave} />);
    open();
    confirm();
    await waitFor(() => expect(mockDelete).toHaveBeenCalledTimes(1));
    act(() =>
      globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT))
    );
    await act(async () => pending.resolve(batch(["old"], false)));
    expect(mockProcessDropsRemoved).not.toHaveBeenCalled();
    expect(mockRefreshWaveMessages).not.toHaveBeenCalled();
    expect(mockSetToast).not.toHaveBeenCalled();
  });

  it.each(["disconnected", "proxy"])(
    "hides the action for %s sessions",
    (mode) => {
      if (mode === "disconnected") mockAuthState.connectedProfile = null;
      else mockAuthState.activeProfileProxy = { id: "proxy" };
      render(<WaveConfigurationDeleteChatHistory wave={wave} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    }
  );
});
