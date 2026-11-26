import { AuthContext } from "@/components/auth/Auth";
import WaveDropActionsSetPinnedDrop from "@/components/waves/drops/WaveDropActionsSetPinnedDrop";
import WaveDropMobileMenuSetPinnedDrop from "@/components/waves/drops/WaveDropMobileMenuSetPinnedDrop";
import type { AuthContextType } from "@/components/auth/authTypes";
import { useSetWavePinnedDrop } from "@/hooks/waves/useSetWavePinnedDrop";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/hooks/waves/useSetWavePinnedDrop", () => ({
  useSetWavePinnedDrop: jest.fn(),
}));

const mockedUseSetWavePinnedDrop = jest.mocked(useSetWavePinnedDrop);

const drop = {
  id: "drop-1",
  wave: { id: "wave-1" },
} as any;

const renderWithAuth = ({
  requestAuth = jest.fn().mockResolvedValue({ success: true }),
  setToast = jest.fn(),
  onPinnedDropSet = jest.fn(),
  sessionOverrides = {},
  mobile = false,
}: {
  requestAuth?: jest.Mock;
  setToast?: jest.Mock;
  onPinnedDropSet?: jest.Mock;
  sessionOverrides?: Partial<AuthContextType>;
  mobile?: boolean;
} = {}) => {
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "admin" },
          fetchingProfile: false,
          isAuthenticated: true,
          isDirectProfileSession: true,
          connectionStatus: null,
          receivedProfileProxies: [],
          activeProfileProxy: null,
          showWaves: true,
          requestAuth,
          setToast,
          setActiveProfileProxy: jest.fn(),
          ...sessionOverrides,
        } as any
      }
    >
      {mobile ? (
        <WaveDropMobileMenuSetPinnedDrop
          drop={drop}
          onPinnedDropSet={onPinnedDropSet}
        />
      ) : (
        <WaveDropActionsSetPinnedDrop
          drop={drop}
          onPinnedDropSet={onPinnedDropSet}
        />
      )}
    </AuthContext.Provider>
  );

  return { requestAuth, setToast, onPinnedDropSet };
};

describe("WaveDropActionsSetPinnedDrop", () => {
  it.each([false, true])(
    "hides pinning for a proxy-role session on mobile=%s",
    (mobile) => {
      const { requestAuth } = renderWithAuth({
        mobile,
        sessionOverrides: { isDirectProfileSession: false },
      });
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(requestAuth).not.toHaveBeenCalled();
    }
  );
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSetWavePinnedDrop.mockReturnValue({
      setPinnedDrop: jest.fn().mockResolvedValue({ id: "wave-1" }),
      data: undefined,
      isPending: false,
      pendingDropId: null,
      error: null,
      errorMessage: null,
      reset: jest.fn(),
    });
  });

  it("requests auth, updates the pinned drop, and closes on success", async () => {
    const setPinnedDrop = jest.fn();
    mockedUseSetWavePinnedDrop.mockImplementation((_waveId, options) => ({
      setPinnedDrop: setPinnedDrop.mockImplementation(async (input) => {
        options?.onSuccess?.({ id: "wave-1" } as any, input);
        return { id: "wave-1" } as any;
      }),
      data: undefined,
      isPending: false,
      pendingDropId: null,
      error: null,
      errorMessage: null,
      reset: jest.fn(),
    }));

    const { requestAuth, setToast, onPinnedDropSet } = renderWithAuth();

    await userEvent.click(
      screen.getByRole("button", { name: "Set as pinned drop" })
    );

    await waitFor(() => {
      expect(requestAuth).toHaveBeenCalledTimes(1);
      expect(setPinnedDrop).toHaveBeenCalledWith({ dropId: "drop-1" });
      expect(setToast).toHaveBeenCalledWith({
        message: "Pinned drop updated.",
        type: "success",
      });
      expect(onPinnedDropSet).toHaveBeenCalledTimes(1);
    });
  });

  it("shows an error toast when the mutation fails", async () => {
    const expectedError = new Error("No access");
    mockedUseSetWavePinnedDrop.mockImplementation((_waveId, options) => ({
      setPinnedDrop: jest.fn().mockImplementation(async (input) => {
        options?.onError?.("No access", expectedError, input);
        throw expectedError;
      }),
      data: undefined,
      isPending: false,
      pendingDropId: null,
      error: null,
      errorMessage: null,
      reset: jest.fn(),
    }));

    const { setToast, onPinnedDropSet } = renderWithAuth();

    await userEvent.click(
      screen.getByRole("button", { name: "Set as pinned drop" })
    );

    await waitFor(() => {
      expect(setToast).toHaveBeenCalledWith({
        message: "No access",
        type: "error",
      });
      expect(onPinnedDropSet).not.toHaveBeenCalled();
    });
  });

  it("does not mutate when auth is rejected", async () => {
    const setPinnedDrop = jest.fn();
    const requestAuth = jest.fn().mockResolvedValue({ success: false });
    mockedUseSetWavePinnedDrop.mockReturnValue({
      setPinnedDrop,
      data: undefined,
      isPending: false,
      pendingDropId: null,
      error: null,
      errorMessage: null,
      reset: jest.fn(),
    });

    renderWithAuth({ requestAuth });

    await userEvent.click(
      screen.getByRole("button", { name: "Set as pinned drop" })
    );

    await waitFor(() => {
      expect(requestAuth).toHaveBeenCalledTimes(1);
      expect(setPinnedDrop).not.toHaveBeenCalled();
    });
  });

  it("shows a pending state for the active drop", () => {
    mockedUseSetWavePinnedDrop.mockReturnValue({
      setPinnedDrop: jest.fn(),
      data: undefined,
      isPending: true,
      pendingDropId: "drop-1",
      error: null,
      errorMessage: null,
      reset: jest.fn(),
    });

    renderWithAuth();

    expect(
      screen.getByRole("button", { name: "Updating pinned drop..." })
    ).toBeDisabled();
  });
});
