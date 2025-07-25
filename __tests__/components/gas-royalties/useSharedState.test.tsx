import { renderHook, act } from "@testing-library/react";
import { useSharedState } from "@/components/gas-royalties/GasRoyalties";
import { GasRoyaltiesCollectionFocus } from "@/enums";

// Mock getDateFilters to simplify URL generation
jest.mock("@/helpers/Helpers", () => ({
  getDateFilters: jest.fn(() => "&from_date=2024-01-01&to_date=2024-01-02"),
}));

describe("useSharedState", () => {
  it("builds primary sales url when isPrimary is true", () => {
    const { result } = renderHook(() => useSharedState());
    act(() => {
      result.current.setIsPrimary(true);
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
    });
    const url = result.current.getUrl("gas");
    expect(url).toBe(
      "https://example.com/api/gas/collection/memes?&primary=true"
    );
  });

  it("includes custom block parameters when set", () => {
    const { result } = renderHook(() => useSharedState());
    act(() => {
      result.current.getSharedProps().setBlocks(10, 20);
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMELAB);
    });
    const url = result.current.getUrl("royalties");
    expect(url).toContain("collection/memelab?");
    expect(url).toContain("from_block=10");
    expect(url).toContain("to_block=20");
  });

  it("setDates resets flags and uses custom dates", () => {
    const { result } = renderHook(() => useSharedState());
    const from = new Date("2024-01-01");
    const to = new Date("2024-01-02");
    act(() => {
      result.current.getSharedProps().setDates(from, to);
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
    });
    expect(result.current.isPrimary).toBe(false);
    expect(result.current.isCustomBlocks).toBe(false);
    const url = result.current.getUrl("gas");
    expect(url).toContain("from_date=2024-01-01");
    expect(url).toContain("to_date=2024-01-02");
  });
});
