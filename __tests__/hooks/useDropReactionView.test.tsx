import { useAuth } from "@/components/auth/Auth";
import { useDropReactionView } from "@/hooks/drops/useDropReactionView";
import { act, render, renderHook } from "@testing-library/react";
import { StrictMode, type PropsWithChildren } from "react";

jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));

const mockUseAuth = jest.mocked(useAuth);
const auth = (id: string, proxy: string | null = null) =>
  ({
    connectedProfile: { id },
    activeProfileProxy: proxy === null ? null : { id: proxy },
  }) as ReturnType<typeof useAuth>;

describe("reaction feedback visibility", () => {
  beforeEach(() => mockUseAuth.mockReturnValue(auth("profile-1")));

  it("keeps mounted feedback visible through StrictMode's effect replay", async () => {
    const { result, unmount } = renderHook(
      () => useDropReactionView("strict-drop"),
      {
        wrapper: ({ children }: PropsWithChildren) => (
          <StrictMode>{children}</StrictMode>
        ),
      }
    );
    const isVisible = result.current();
    await act(async () => {
      await Promise.resolve();
    });
    expect(isVisible()).toBe(true);
    unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(isVisible()).toBe(false);
  });

  it("keeps pending feedback attached to a drop remounted in the same commit", async () => {
    let captureView: ReturnType<typeof useDropReactionView> = () => () => false;
    function View() {
      captureView = useDropReactionView("drop-remount");
      return null;
    }
    const { rerender } = render(<View key="first" />);
    const isVisible = captureView();
    rerender(<View key="second" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(isVisible()).toBe(true);
  });

  it("retires old feedback after leaving the drop, even if it is visited again", async () => {
    const first = renderHook(() => useDropReactionView("drop-return"));
    const isVisible = first.result.current();
    first.unmount();
    await act(async () => {
      await Promise.resolve();
    });
    renderHook(() => useDropReactionView("drop-return"));
    expect(isVisible()).toBe(false);
  });

  it("keeps the view active while independently mounted consumers remain", async () => {
    const parent = renderHook(() => useDropReactionView("shared-drop"));
    const chip = renderHook(() => useDropReactionView("shared-drop"));
    const isVisible = chip.result.current();
    chip.unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(isVisible()).toBe(true);
    parent.unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(isVisible()).toBe(false);
  });

  it("preserves the old drop's remaining consumer when another changes keys", async () => {
    const first = renderHook(({ dropId }) => useDropReactionView(dropId), {
      initialProps: { dropId: "old-shared-drop" },
    });
    const second = renderHook(() => useDropReactionView("old-shared-drop"));
    const oldIsVisible = second.result.current();
    first.rerender({ dropId: "new-shared-drop" });
    await act(async () => {
      await Promise.resolve();
    });
    expect(oldIsVisible()).toBe(true);
    second.unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(oldIsVisible()).toBe(false);
    expect(first.result.current()()).toBe(true);
  });

  it.each(["profile", "proxy", "drop"])(
    "does not move old feedback to a new %s",
    async (change) => {
      const { result, rerender } = renderHook(
        ({ dropId }) => useDropReactionView(dropId),
        {
          initialProps: { dropId: `drop-${change}` },
        }
      );
      const isVisible = result.current();
      if (change === "profile") mockUseAuth.mockReturnValue(auth("profile-2"));
      if (change === "proxy")
        mockUseAuth.mockReturnValue(auth("profile-1", "proxy-2"));
      rerender({
        dropId: change === "drop" ? "another-drop" : `drop-${change}`,
      });
      await act(async () => {
        await Promise.resolve();
      });
      expect(isVisible()).toBe(false);
      expect(result.current()()).toBe(true);
    }
  );
});
