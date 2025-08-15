import { renderHook, act } from "@testing-library/react";
import { useSharedState } from "@/components/gas-royalties/GasRoyalties";
import { GasRoyaltiesCollectionFocus } from "@/enums";

// Mock getDateFilters to simplify URL generation
jest.mock("@/helpers/Helpers", () => ({
  getDateFilters: jest.fn(() => "&from_date=2024-01-01&to_date=2024-01-02"),
}));

// Mock the API endpoint to make tests deterministic
const ORIGINAL_ENV = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, API_ENDPOINT: 'https://api.6529.io' };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("useSharedState", () => {
  it("builds primary sales url when isPrimary is true", () => {
    const { result } = renderHook(() => useSharedState());
    act(() => {
      result.current.setIsPrimary(true);
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
    });
    const url = result.current.getUrl("gas");
    expect(url).toBe(
      "https://api.6529.io/api/gas/collection/memes?&primary=true"
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
    expect(url).toBe(
      "https://api.6529.io/api/royalties/collection/memelab?&from_block=10&to_block=20"
    );
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

  it("returns empty string when collectionFocus is not set", () => {
    const { result } = renderHook(() => useSharedState());
    const url = result.current.getUrl("gas");
    expect(url).toBe("");
  });

  it("includes artist filter when selectedArtist is set", () => {
    const { result } = renderHook(() => useSharedState());
    act(() => {
      result.current.setSelectedArtist("TestArtist");
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
    });
    const url = result.current.getUrl("gas");
    expect(url).toContain("&artist=TestArtist");
    expect(url).toBe(
      "https://api.6529.io/api/gas/collection/memes?&from_date=2024-01-01&to_date=2024-01-02&artist=TestArtist"
    );
  });

  it("setBlocks sets custom blocks and resets other flags", () => {
    const { result } = renderHook(() => useSharedState());
    act(() => {
      // First set primary to true
      result.current.setIsPrimary(true);
      // Then call setBlocks which should reset isPrimary
      result.current.getSharedProps().setBlocks(100, 200);
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMELAB);
    });
    expect(result.current.isPrimary).toBe(false);
    expect(result.current.isCustomBlocks).toBe(true);
    expect(result.current.fromBlock).toBe(100);
    expect(result.current.toBlock).toBe(200);
  });

  it("handles MEMELAB collection focus correctly", () => {
    const { result } = renderHook(() => useSharedState());
    act(() => {
      result.current.setIsPrimary(true);
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMELAB);
    });
    const url = result.current.getUrl("royalties");
    expect(url).toBe(
      "https://api.6529.io/api/royalties/collection/memelab?&primary=true"
    );
  });

  it("exposes all required state properties", () => {
    const { result } = renderHook(() => useSharedState());
    
    // Check that all expected properties are exposed
    expect(result.current).toHaveProperty('selectedArtist');
    expect(result.current).toHaveProperty('setSelectedArtist');
    expect(result.current).toHaveProperty('fromDate');
    expect(result.current).toHaveProperty('setFromDate');
    expect(result.current).toHaveProperty('toDate');
    expect(result.current).toHaveProperty('setToDate');
    expect(result.current).toHaveProperty('showDatePicker');
    expect(result.current).toHaveProperty('setShowDatePicker');
    expect(result.current).toHaveProperty('dateSelection');
    expect(result.current).toHaveProperty('setDateSelection');
    expect(result.current).toHaveProperty('isPrimary');
    expect(result.current).toHaveProperty('setIsPrimary');
    expect(result.current).toHaveProperty('isCustomBlocks');
    expect(result.current).toHaveProperty('setIsCustomBlocks');
    expect(result.current).toHaveProperty('collectionFocus');
    expect(result.current).toHaveProperty('setCollectionFocus');
    expect(result.current).toHaveProperty('fetching');
    expect(result.current).toHaveProperty('setFetching');
    expect(result.current).toHaveProperty('getUrl');
    expect(result.current).toHaveProperty('getSharedProps');
    expect(result.current).toHaveProperty('showBlockPicker');
    expect(result.current).toHaveProperty('setShowBlockPicker');
    expect(result.current).toHaveProperty('fromBlock');
    expect(result.current).toHaveProperty('setFromBlock');
    expect(result.current).toHaveProperty('toBlock');
    expect(result.current).toHaveProperty('setToBlock');
  });

  it("getSharedProps returns correct subset of properties and functions", () => {
    const { result } = renderHook(() => useSharedState());
    const sharedProps = result.current.getSharedProps();
    
    // Check that getSharedProps returns expected properties
    expect(sharedProps).toHaveProperty('fetching');
    expect(sharedProps).toHaveProperty('date_selection');
    expect(sharedProps).toHaveProperty('selected_artist');
    expect(sharedProps).toHaveProperty('is_primary');
    expect(sharedProps).toHaveProperty('is_custom_blocks');
    expect(sharedProps).toHaveProperty('setSelectedArtist');
    expect(sharedProps).toHaveProperty('setIsPrimary');
    expect(sharedProps).toHaveProperty('setIsCustomBlocks');
    expect(sharedProps).toHaveProperty('setDates');
    expect(sharedProps).toHaveProperty('setBlocks');
    
    // Verify that functions are indeed functions
    expect(typeof sharedProps.setSelectedArtist).toBe('function');
    expect(typeof sharedProps.setIsPrimary).toBe('function');
    expect(typeof sharedProps.setIsCustomBlocks).toBe('function');
    expect(typeof sharedProps.setDates).toBe('function');
    expect(typeof sharedProps.setBlocks).toBe('function');
  });
});
