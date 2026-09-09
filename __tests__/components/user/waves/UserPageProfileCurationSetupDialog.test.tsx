import { act, fireEvent, render, screen } from "@testing-library/react";
import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserPageProfileCurationSetupDialog from "@/components/user/waves/UserPageProfileCurationSetupDialog";
import { getAdminGroupId } from "@/components/waves/create-wave/services/waveGroupService";
import { useProfileWaveMutation } from "@/hooks/useProfileWaveMutation";
import { commonApiPost } from "@/services/api/common-api";
import { useQueryClient } from "@tanstack/react-query";

jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/components/waves/create-wave/services/waveGroupService", () => ({
  getAdminGroupId: jest.fn(),
  WaveAdminGroupError: class WaveAdminGroupError extends Error {},
}));
jest.mock("@/hooks/useProfileWaveMutation", () => ({
  useProfileWaveMutation: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
jest.mock("@tanstack/react-query", () => ({ useQueryClient: jest.fn() }));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({ isOpen, title, children }: any) =>
    isOpen ? <section aria-label={title}>{children}</section> : null,
}));

const useAuthMock = useAuth as jest.Mock;
const getAdminGroupIdMock = getAdminGroupId as jest.Mock;
const useProfileWaveMutationMock = useProfileWaveMutation as jest.Mock;
const commonApiPostMock = commonApiPost as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;

const profile = {
  id: "profile-1",
  handle: "alice",
  primary_wallet: "0x123",
} as any;
const wave = { id: "wave-1", name: "alice Curation" } as any;
const curation = { id: "curation-1", name: "Posts" } as any;

function renderSetup({ onReady = jest.fn() }: { onReady?: jest.Mock } = {}) {
  render(
    <ReactQueryWrapperContext.Provider
      value={{ onWaveCreated: jest.fn() } as any}
    >
      <UserPageProfileCurationSetupDialog
        profile={profile}
        isOpen={true}
        onClose={jest.fn()}
        onReady={onReady}
      />
    </ReactQueryWrapperContext.Provider>
  );

  return { onReady };
}

describe("UserPageProfileCurationSetupDialog", () => {
  const updateProfileWaveOrThrow = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      requestAuth: jest.fn().mockResolvedValue({ success: true }),
      setToast: jest.fn(),
    });
    getAdminGroupIdMock.mockResolvedValue("group-1");
    useProfileWaveMutationMock.mockReturnValue({ updateProfileWaveOrThrow });
    updateProfileWaveOrThrow.mockResolvedValue(profile);
    useQueryClientMock.mockReturnValue({ setQueryData: jest.fn() });
    commonApiPostMock
      .mockResolvedValueOnce(wave)
      .mockResolvedValueOnce(curation);
  });

  it("creates the hidden dependencies and returns a ready Curation", async () => {
    const { onReady } = renderSetup();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create Curation" }));
    });

    expect(getAdminGroupIdMock).toHaveBeenCalledTimes(1);
    expect(commonApiPostMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ endpoint: "waves" })
    );
    expect(commonApiPostMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        endpoint: "waves/wave-1/curations",
        body: { name: "Posts", group_id: "group-1" },
      })
    );
    expect(updateProfileWaveOrThrow).toHaveBeenCalledWith(
      "wave-1",
      "curation-1",
      { suppressSuccessToast: true }
    );
    expect(onReady).toHaveBeenCalledWith({ wave, curation });
  });

  it("resumes from the failed step without recreating earlier resources", async () => {
    commonApiPostMock
      .mockReset()
      .mockResolvedValueOnce(wave)
      .mockRejectedValueOnce(new Error("Curation unavailable"))
      .mockResolvedValueOnce(curation);
    const { onReady } = renderSetup();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create Curation" }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      /without creating another post space/i
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Continue setup" }));
    });

    expect(getAdminGroupIdMock).toHaveBeenCalledTimes(1);
    expect(
      commonApiPostMock.mock.calls.filter(
        ([request]) => request.endpoint === "waves"
      )
    ).toHaveLength(1);
    expect(commonApiPostMock).toHaveBeenCalledTimes(3);
    expect(onReady).toHaveBeenCalledWith({ wave, curation });
  });
});
