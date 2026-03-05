import { act, renderHook } from "@testing-library/react";
import { useArtistPreviewModal } from "@/hooks/useArtistPreviewModal";

describe("useArtistPreviewModal", () => {
  it("tracks the requested opening tab across open, close, and reopen", () => {
    const { result } = renderHook(() => useArtistPreviewModal());

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.activeTab).toBe("active");

    act(() => {
      result.current.handleBadgeClick("winners");
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.activeTab).toBe("winners");

    act(() => {
      result.current.handleTabChange("active");
    });

    expect(result.current.activeTab).toBe("active");

    act(() => {
      result.current.handleModalClose();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.activeTab).toBe("active");

    act(() => {
      result.current.handleBadgeClick("winners");
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.activeTab).toBe("winners");
  });
});
