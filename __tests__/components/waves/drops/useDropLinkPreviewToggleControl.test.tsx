import { useDropLinkPreviewToggleControl } from "@/components/waves/drops/useDropLinkPreviewToggleControl";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { act, renderHook } from "@testing-library/react";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

const { useAuth } = jest.requireMock("@/components/auth/Auth") as {
  useAuth: jest.Mock;
};
const { useMyStreamOptional } = jest.requireMock(
  "@/contexts/wave/MyStreamContext"
) as { useMyStreamOptional: jest.Mock };
const mockedCommonApiPost = commonApiPost as jest.Mock;

function createDrop(hideLinkPreview = false) {
  return {
    id: "drop-1",
    wave: { id: "wave-1" },
    author: { handle: "alice" },
    parts: [{ content: "https://6529.io" }],
    hide_link_preview: hideLinkPreview,
  } as any;
}

function setupStream() {
  const updates: Array<(draft: any) => any> = [];
  const rollback = jest.fn();
  const applyOptimisticDropUpdate = jest.fn(({ update }) => {
    updates.push(update);
    return { rollback };
  });
  useMyStreamOptional.mockReturnValue({ applyOptimisticDropUpdate });

  return { applyOptimisticDropUpdate, rollback, updates };
}

describe("useDropLinkPreviewToggleControl", () => {
  const setToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { handle: "alice" },
      setToast,
    });
    mockedCommonApiPost.mockResolvedValue({ hide_link_preview: true });
  });

  it("posts desired state and reconciles optimistic state from response", async () => {
    const { updates } = setupStream();
    const { result } = renderHook(() =>
      useDropLinkPreviewToggleControl(createDrop(false))
    );

    await act(async () => {
      await result.current?.onToggle(true);
    });

    expect(mockedCommonApiPost).toHaveBeenCalledWith({
      endpoint: "drops/drop-1/toggle-hide-link-preview",
      body: { hide_link_preview: true },
    });
    expect(updates).toHaveLength(2);

    const draft = { type: DropSize.FULL, hide_link_preview: false };
    updates[0](draft);
    expect(draft.hide_link_preview).toBe(true);

    draft.hide_link_preview = false;
    updates[1](draft);
    expect(draft.hide_link_preview).toBe(true);
  });

  it("rolls back and shows a toast when the request fails", async () => {
    const { rollback } = setupStream();
    mockedCommonApiPost.mockRejectedValue("Unable to update preview");
    const { result } = renderHook(() =>
      useDropLinkPreviewToggleControl(createDrop(false))
    );

    await act(async () => {
      await result.current?.onToggle(true);
    });

    expect(rollback).toHaveBeenCalledTimes(1);
    expect(setToast).toHaveBeenCalledWith({
      message: "Unable to update preview",
      type: "error",
    });
  });

  it("clears its cross-instance lock when the owner unmounts", async () => {
    setupStream();
    let resolveFirstRequest: (drop: {
      hide_link_preview: boolean;
    }) => void = () => {};
    mockedCommonApiPost
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstRequest = resolve;
          })
      )
      .mockResolvedValueOnce({ hide_link_preview: true });

    const first = renderHook(() =>
      useDropLinkPreviewToggleControl(createDrop(false))
    );

    act(() => {
      first.result.current?.onToggle(true);
    });

    const second = renderHook(() =>
      useDropLinkPreviewToggleControl(createDrop(false))
    );

    act(() => {
      second.result.current?.onToggle(true);
    });

    expect(mockedCommonApiPost).toHaveBeenCalledTimes(1);

    first.unmount();

    await act(async () => {
      await second.result.current?.onToggle(true);
    });

    expect(mockedCommonApiPost).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveFirstRequest({ hide_link_preview: true });
    });
  });
});
