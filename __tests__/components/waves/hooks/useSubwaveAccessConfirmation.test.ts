import { act, renderHook, waitFor } from "@testing-library/react";
import { useSubwaveAccessConfirmation } from "@/components/waves/hooks/useSubwaveAccessConfirmation";
import { hasSubwaveMembersOutsideParent } from "@/services/api/subwave-access-api";

jest.mock("@/services/api/subwave-access-api", () => ({
  hasSubwaveMembersOutsideParent: jest.fn(),
}));

const mockCheck = jest.mocked(hasSubwaveMembersOutsideParent);
const check = { parentWaveId: "parent", viewGroupId: "group" };

describe("useSubwaveAccessConfirmation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("continues without a warning when the parent covers the audience", async () => {
    mockCheck.mockResolvedValue(false);
    const { result } = renderHook(useSubwaveAccessConfirmation);
    await expect(result.current.confirmSubwaveAccess(check)).resolves.toBe(
      true
    );
    expect(result.current.isOpen).toBe(false);
  });

  it.each([true, false])(
    "waits for the user's decision: %s",
    async (confirmed) => {
      mockCheck.mockResolvedValue(true);
      const { result } = renderHook(useSubwaveAccessConfirmation);
      let pending: Promise<boolean>;
      act(() => {
        pending = result.current.confirmSubwaveAccess(check);
      });
      await waitFor(() => expect(result.current.isOpen).toBe(true));
      act(() => result.current.onDecision(confirmed));
      await expect(pending!).resolves.toBe(confirmed);
      expect(result.current.isOpen).toBe(false);
    }
  );

  it("does not reuse a pending decision for a different audience", async () => {
    mockCheck.mockResolvedValue(true);
    const { result } = renderHook(useSubwaveAccessConfirmation);
    let pending: Promise<boolean>;
    act(() => {
      pending = result.current.confirmSubwaveAccess(check);
    });
    await waitFor(() => expect(result.current.isOpen).toBe(true));
    expect(result.current.confirmSubwaveAccess({ ...check })).toBe(pending!);
    await expect(
      result.current.confirmSubwaveAccess({ ...check, viewGroupId: "another" })
    ).resolves.toBe(false);
    act(() => result.current.onDecision(true));
    await expect(pending!).resolves.toBe(true);
    expect(mockCheck).toHaveBeenCalledTimes(1);
  });

  it("cancels the pending decision on unmount", async () => {
    mockCheck.mockResolvedValue(true);
    const { result, unmount } = renderHook(useSubwaveAccessConfirmation);
    let pending: Promise<boolean>;
    act(() => {
      pending = result.current.confirmSubwaveAccess(check);
    });
    await waitFor(() => expect(result.current.isOpen).toBe(true));
    unmount();
    await expect(pending!).resolves.toBe(false);
  });

  it("does not show a mismatch warning when the check fails", async () => {
    mockCheck.mockRejectedValue(new Error("unavailable"));
    const { result } = renderHook(useSubwaveAccessConfirmation);
    await expect(result.current.confirmSubwaveAccess(check)).rejects.toThrow(
      "unavailable"
    );
    expect(result.current.isOpen).toBe(false);
  });
});
