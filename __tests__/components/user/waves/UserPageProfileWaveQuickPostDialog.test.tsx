import React from "react";
import { act, render, screen } from "@testing-library/react";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserPageProfileWaveQuickPostDialog from "@/components/user/waves/UserPageProfileWaveQuickPostDialog";
import { useAuth } from "@/components/auth/Auth";
import { addDropToCuration } from "@/hooks/drops/useDropCurationMembershipMutation";
import { COMMUNITY_CURATIONS_DROPS_QUERY_KEY } from "@/hooks/useCommunityCurationsDrops";
import { useQueryClient } from "@tanstack/react-query";

let waveDropCreateProps: any;

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/hooks/drops/useDropCurationMembershipMutation", () => ({
  addDropToCuration: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(),
}));

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({ isOpen, children }: any) =>
    isOpen ? <div data-testid="quick-post-dialog">{children}</div> : null,
}));

jest.mock("@/components/waves/leaderboard/create/WaveDropCreate", () => ({
  WaveDropCreate: (props: any) => {
    waveDropCreateProps = props;
    return <div data-testid="quick-post-composer" />;
  },
}));

const useAuthMock = useAuth as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const addDropToCurationMock = addDropToCuration as jest.Mock;

const wave = { id: "wave-1" } as any;
const curation = { id: "curation-1", name: "Art" } as any;

const renderDialog = ({
  onClose = jest.fn(),
  invalidateDrops = jest.fn(),
}: {
  readonly onClose?: jest.Mock;
  readonly invalidateDrops?: jest.Mock;
} = {}) => {
  render(
    <ReactQueryWrapperContext.Provider value={{ invalidateDrops } as any}>
      <UserPageProfileWaveQuickPostDialog
        wave={wave}
        curation={curation}
        isOpen={true}
        onClose={onClose}
      />
    </ReactQueryWrapperContext.Provider>
  );

  return { onClose, invalidateDrops };
};

describe("UserPageProfileWaveQuickPostDialog", () => {
  beforeEach(() => {
    waveDropCreateProps = undefined;
    useAuthMock.mockReturnValue({ setToast: jest.fn() });
    useQueryClientMock.mockReturnValue({
      invalidateQueries: jest.fn(() => Promise.resolve()),
    });
    addDropToCurationMock.mockResolvedValue(undefined);
  });

  it("adds each server-created drop to the selected profile curation", async () => {
    const setToast = jest.fn();
    const queryClient = { invalidateQueries: jest.fn(() => Promise.resolve()) };
    useAuthMock.mockReturnValue({ setToast });
    useQueryClientMock.mockReturnValue(queryClient);
    const { onClose, invalidateDrops } = renderDialog();

    expect(screen.getByTestId("quick-post-composer")).toBeInTheDocument();

    await act(async () => {
      await waveDropCreateProps.onServerDropCreated({ id: "drop-1" });
    });
    act(() => {
      waveDropCreateProps.onSuccess();
    });

    expect(addDropToCurationMock).toHaveBeenCalledWith({
      dropId: "drop-1",
      body: {
        curation_id: "curation-1",
      },
    });
    expect(waveDropCreateProps.forceStandardDropComposer).toBe(true);
    expect(waveDropCreateProps.identityPickerPlacement).toBe("inline");
    expect(invalidateDrops).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROPS],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROPS_LEADERBOARD],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: [COMMUNITY_CURATIONS_DROPS_QUERY_KEY],
    });
    expect(setToast).toHaveBeenCalledWith({
      type: "success",
      message: "Post added to curation.",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the partial-success error and does not close when curation add fails", async () => {
    const setToast = jest.fn();
    useAuthMock.mockReturnValue({ setToast });
    addDropToCurationMock.mockRejectedValueOnce(new Error("No permission"));
    const { onClose } = renderDialog();

    await act(async () => {
      await waveDropCreateProps.onServerDropCreated({ id: "drop-1" });
    });
    act(() => {
      waveDropCreateProps.onSuccess();
    });

    expect(addDropToCurationMock).toHaveBeenCalledTimes(1);
    expect(setToast).toHaveBeenCalledWith({
      type: "error",
      message: "Post created, but it could not be added to this curation.",
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
