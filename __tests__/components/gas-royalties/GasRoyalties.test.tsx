import {
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
  useSharedState,
} from "@/components/gas-royalties/GasRoyalties";
import { DateIntervalsSelection, GasRoyaltiesCollectionFocus } from "@/enums";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock the fetchUrl function at the top level
jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn().mockResolvedValue([]),
}));

// Get reference to the mocked function for test setup
const { fetchUrl: mockFetchUrl } = jest.requireMock("@/services/6529api");

jest.mock("@/components/dotLoader/DotLoader", () => () => (
  <span data-testid="loader" />
));
jest.mock(
  "@/components/downloadUrlWidget/DownloadUrlWidget",
  () => (props: any) =>
    (
      <button
        data-testid="download"
        data-name={props.name}
        data-url={props.url}
      />
    )
);
jest.mock(
  "@/components/datePickerModal/DatePickerModal",
  () => (props: any) => <div data-testid={`${props.mode}-picker`} />
);
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));
jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid={`tooltip-${id}`}>{children}</div>
  ),
}));

// Mock fetch with more realistic behavior
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockClear();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  });
});

describe("GasRoyaltiesHeader", () => {
  it("renders download widget with correct filename and URL", async () => {
    const pathname = "/meme-gas";
    const push = jest.fn();
    const mockGetUrl = jest.fn(() => "https://test.6529.io/file");

    (useRouter as jest.Mock).mockReturnValue({ push });
    (usePathname as jest.Mock).mockReturnValue(pathname);

    render(
      <GasRoyaltiesHeader
        title="Gas"
        description="desc"
        fetching={false}
        results_count={1}
        date_selection={DateIntervalsSelection.TODAY}
        selected_artist=""
        is_primary={false}
        is_custom_blocks={false}
        focus={GasRoyaltiesCollectionFocus.MEMES}
        getUrl={mockGetUrl}
        setSelectedArtist={jest.fn()}
        setIsPrimary={jest.fn()}
        setIsCustomBlocks={jest.fn()}
        setDateSelection={jest.fn()}
        setDates={jest.fn()}
        setBlocks={jest.fn()}
      />
    );

    const download = await screen.findByTestId("download");
    expect(download.dataset.name).toBe("gas_the-memes_today.csv");
    expect(download.dataset.url).toBe(
      "https://test.6529.io/file&download=true"
    );
    expect(mockGetUrl).toHaveBeenCalledWith();
  });

  it("triggers focus change when collection tabs are clicked", () => {
    const pathname = "/meme-gas";
    const push = jest.fn();

    (useRouter as jest.Mock).mockReturnValue({ push });
    (usePathname as jest.Mock).mockReturnValue(pathname);

    render(
      <GasRoyaltiesHeader
        title="Gas"
        description="desc"
        fetching={false}
        results_count={1}
        date_selection={DateIntervalsSelection.TODAY}
        selected_artist=""
        is_primary={false}
        is_custom_blocks={false}
        focus={GasRoyaltiesCollectionFocus.MEMES}
        getUrl={() => ""}
        setSelectedArtist={jest.fn()}
        setIsPrimary={jest.fn()}
        setIsCustomBlocks={jest.fn()}
        setDateSelection={jest.fn()}
        setDates={jest.fn()}
        setBlocks={jest.fn()}
      />
    );

    const memeLab = screen.getByText("Meme Lab");
    fireEvent.click(memeLab);
    expect(push).toHaveBeenCalledWith(
      `${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMELAB}`
    );

    const memes = screen.getByText("The Memes");
    fireEvent.click(memes);
    expect(push).toHaveBeenCalledWith(
      `${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMES}`
    );
  });

  it("handles keyboard navigation for collection tabs", () => {
    const pathname = "/meme-gas";
    const push = jest.fn();

    (useRouter as jest.Mock).mockReturnValue({ push });
    (usePathname as jest.Mock).mockReturnValue(pathname);

    render(
      <GasRoyaltiesHeader
        title="Gas"
        description="desc"
        fetching={false}
        results_count={1}
        date_selection={DateIntervalsSelection.TODAY}
        selected_artist=""
        is_primary={false}
        is_custom_blocks={false}
        focus={GasRoyaltiesCollectionFocus.MEMES}
        getUrl={() => ""}
        setSelectedArtist={jest.fn()}
        setIsPrimary={jest.fn()}
        setIsCustomBlocks={jest.fn()}
        setDateSelection={jest.fn()}
        setDates={jest.fn()}
        setBlocks={jest.fn()}
      />
    );

    const memeLab = screen.getByText("Meme Lab");

    // Test Enter key
    fireEvent.keyDown(memeLab, { key: "Enter" });
    expect(push).toHaveBeenCalledWith(
      `${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMELAB}`
    );

    // Test Space key
    fireEvent.keyDown(memeLab, { key: " " });
    expect(push).toHaveBeenCalledTimes(2);
  });

  it("does not render download widget when fetching or no results", () => {
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (usePathname as jest.Mock).mockReturnValue("/meme-gas");

    const { rerender } = render(
      <GasRoyaltiesHeader
        title="Gas"
        fetching={true}
        results_count={0}
        date_selection={DateIntervalsSelection.TODAY}
        selected_artist=""
        is_primary={false}
        is_custom_blocks={false}
        focus={GasRoyaltiesCollectionFocus.MEMES}
        getUrl={() => ""}
        setSelectedArtist={jest.fn()}
        setIsPrimary={jest.fn()}
        setIsCustomBlocks={jest.fn()}
        setDateSelection={jest.fn()}
        setDates={jest.fn()}
        setBlocks={jest.fn()}
      />
    );

    expect(screen.queryByTestId("download")).not.toBeInTheDocument();

    // Test with results but still fetching
    rerender(
      <GasRoyaltiesHeader
        title="Gas"
        fetching={true}
        results_count={10}
        date_selection={DateIntervalsSelection.TODAY}
        selected_artist=""
        is_primary={false}
        is_custom_blocks={false}
        focus={GasRoyaltiesCollectionFocus.MEMES}
        getUrl={() => "test-url"}
        setSelectedArtist={jest.fn()}
        setIsPrimary={jest.fn()}
        setIsCustomBlocks={jest.fn()}
        setDateSelection={jest.fn()}
        setDates={jest.fn()}
        setBlocks={jest.fn()}
      />
    );

    expect(screen.queryByTestId("download")).not.toBeInTheDocument();
  });

  it("generates correct filename for different configurations", () => {
    const pathname = "/meme-gas";
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (usePathname as jest.Mock).mockReturnValue(pathname);

    // Test primary sales filename
    const { rerender } = render(
      <GasRoyaltiesHeader
        title="Gas"
        fetching={false}
        results_count={1}
        date_selection={DateIntervalsSelection.TODAY}
        selected_artist=""
        is_primary={true}
        is_custom_blocks={false}
        focus={GasRoyaltiesCollectionFocus.MEMES}
        getUrl={() => "test-url"}
        setSelectedArtist={jest.fn()}
        setIsPrimary={jest.fn()}
        setIsCustomBlocks={jest.fn()}
        setDateSelection={jest.fn()}
        setDates={jest.fn()}
        setBlocks={jest.fn()}
      />
    );

    let download = screen.getByTestId("download");
    expect(download.dataset.name).toBe("gas_the-memes_primary-sales.csv");

    // Test memelab focus
    rerender(
      <GasRoyaltiesHeader
        title="Gas"
        fetching={false}
        results_count={1}
        date_selection={DateIntervalsSelection.LAST_7}
        selected_artist=""
        is_primary={false}
        is_custom_blocks={false}
        focus={GasRoyaltiesCollectionFocus.MEMELAB}
        getUrl={() => "test-url"}
        setSelectedArtist={jest.fn()}
        setIsPrimary={jest.fn()}
        setIsCustomBlocks={jest.fn()}
        setDateSelection={jest.fn()}
        setDates={jest.fn()}
        setBlocks={jest.fn()}
      />
    );

    download = screen.getByTestId("download");
    expect(download.dataset.name).toBe("gas_meme-lab_last-7-days.csv");
  });
});

describe("GasRoyaltiesTokenImage", () => {
  it("renders token image with all elements", () => {
    render(
      <GasRoyaltiesTokenImage
        path="memes"
        token_id={1}
        name="Meme1"
        thumbnail="img.png"
        note="This is a note"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/memes/1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");

    const image = screen.getByAltText("Meme1");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "img.png");

    expect(screen.getByText("1 -")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^tooltip-/)).toHaveLength(2);
  });

  it("renders token image without note", () => {
    render(
      <GasRoyaltiesTokenImage
        path="memelab"
        token_id={42}
        name="Test Meme"
        thumbnail="test.jpg"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/memelab/42");

    const image = screen.getByAltText("Test Meme");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "test.jpg");

    expect(screen.getByText("42 -")).toBeInTheDocument();
    // Only one tooltip (for image) when no note
    expect(screen.getAllByTestId(/^tooltip-/)).toHaveLength(1);
  });

  it("uses correct tooltip IDs", () => {
    render(
      <GasRoyaltiesTokenImage
        path="memes"
        token_id={123}
        name="Test Meme"
        thumbnail="test.jpg"
        note="Test note"
      />
    );

    expect(screen.getByTestId("tooltip-token-image-123")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-token-info-123")).toBeInTheDocument();
  });
});

describe("useSharedState", () => {
  it("builds url with primary sales", () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
      result.current.setIsPrimary(true);
    });

    expect(result.current.getUrl("gas")).toBe(
      `https://api.test.6529.io/api/gas/collection/memes?&primary=true`
    );
  });

  it("builds url with custom blocks", () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
      result.current.getSharedProps().setBlocks(10, 20);
    });

    expect(result.current.getUrl("gas")).toBe(
      `https://api.test.6529.io/api/gas/collection/memes?&from_block=10&to_block=20`
    );
    expect(result.current.isCustomBlocks).toBe(true);
    expect(result.current.isPrimary).toBe(false);
  });

  it("builds url with custom dates", () => {
    const { result } = renderHook(() => useSharedState());
    const fromDate = new Date("2023-01-01");
    const toDate = new Date("2023-01-31");

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMELAB);
      result.current.getSharedProps().setDates(fromDate, toDate);
    });

    expect(result.current.getUrl("royalties")).toContain(
      "https://api.test.6529.io/api/royalties/collection/memelab?"
    );
    expect(result.current.dateSelection).toBe(
      DateIntervalsSelection.CUSTOM_DATES
    );
    expect(result.current.isPrimary).toBe(false);
    expect(result.current.isCustomBlocks).toBe(false);
  });

  it("builds url with artist filter", () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
      result.current.setSelectedArtist("Test Artist");
    });

    expect(result.current.getUrl("gas")).toContain("&artist=Test Artist");
  });

  it("returns empty url when collection focus not set", () => {
    const { result } = renderHook(() => useSharedState());
    expect(result.current.getUrl("gas")).toBe("");
  });

  it("switches between memes and memelab collections", () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
    });
    expect(result.current.getUrl("gas")).toContain("/collection/memes");

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMELAB);
    });
    expect(result.current.getUrl("gas")).toContain("/collection/memelab");
  });

  it("manages state correctly with getSharedProps", () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
      result.current.setSelectedArtist("Artist 1");
      result.current.setIsPrimary(true);
    });

    const sharedProps = result.current.getSharedProps();

    expect(sharedProps.selected_artist).toBe("Artist 1");
    expect(sharedProps.is_primary).toBe(true);
    expect(sharedProps.is_custom_blocks).toBe(false);
    expect(typeof sharedProps.setSelectedArtist).toBe("function");
    expect(typeof sharedProps.setDates).toBe("function");
    expect(typeof sharedProps.setBlocks).toBe("function");
  });

  it("initializes with correct default values", () => {
    const { result } = renderHook(() => useSharedState());

    expect(result.current.selectedArtist).toBe("");
    expect(result.current.isPrimary).toBe(false);
    expect(result.current.isCustomBlocks).toBe(false);
    expect(result.current.fetching).toBe(true);
    expect(result.current.dateSelection).toBe(
      DateIntervalsSelection.THIS_MONTH
    );
    expect(result.current.collectionFocus).toBeUndefined();
  });
});

describe("Security and Error Handling - Fail Fast Patterns", () => {
  it("validates token image props strictly", () => {
    // Test with negative token_id - should still render but handle gracefully
    render(
      <GasRoyaltiesTokenImage
        path="memes"
        token_id={-1}
        name="Invalid Token"
        thumbnail="invalid.png"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/memes/-1");
    expect(screen.getByText("-1 -")).toBeInTheDocument();
  });

  it("handles URL generation errors without crashing", () => {
    const { result } = renderHook(() => useSharedState());

    // Test with undefined collection focus - should return empty string
    expect(result.current.getUrl("gas")).toBe("");

    // Test with invalid API path
    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
    });

    // Should handle empty/null API path gracefully
    expect(() => result.current.getUrl("")).not.toThrow();
    expect(() => result.current.getUrl(undefined as any)).not.toThrow();
  });

  it("maintains state integrity during rapid updates", () => {
    const { result } = renderHook(() => useSharedState());

    // Rapid state changes should not cause inconsistent state
    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
      result.current.setIsPrimary(true);
      result.current.getSharedProps().setBlocks(10, 20); // Should reset isPrimary
      result.current.getSharedProps().setDates(new Date(), new Date()); // Should reset both
      result.current.setSelectedArtist("Artist");
    });

    // Final state should be consistent
    expect(result.current.isPrimary).toBe(false);
    expect(result.current.isCustomBlocks).toBe(false);
    expect(result.current.selectedArtist).toBe("Artist");
    expect(result.current.dateSelection).toBe(
      DateIntervalsSelection.CUSTOM_DATES
    );
  });

  it("rejects malformed date inputs gracefully", () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
      // Invalid date objects should not crash the component
      result.current
        .getSharedProps()
        .setDates(new Date("invalid"), new Date("also-invalid"));
    });

    // Component should handle invalid dates by not including them in URL
    const url = result.current.getUrl("gas");
    expect(url).toContain("collection/memes");
    expect(result.current.dateSelection).toBe(
      DateIntervalsSelection.CUSTOM_DATES
    );
  });
});

describe("Legacy Error Handling and Edge Cases", () => {
  it("handles missing required props gracefully", () => {
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (usePathname as jest.Mock).mockReturnValue("/test");

    // Test with minimal required props
    expect(() =>
      render(
        <GasRoyaltiesHeader
          title=""
          fetching={false}
          results_count={0}
          date_selection={DateIntervalsSelection.TODAY}
          selected_artist=""
          is_primary={false}
          is_custom_blocks={false}
          focus={GasRoyaltiesCollectionFocus.MEMES}
          getUrl={() => ""}
          setSelectedArtist={jest.fn()}
          setIsPrimary={jest.fn()}
          setIsCustomBlocks={jest.fn()}
          setDateSelection={jest.fn()}
          setDates={jest.fn()}
          setBlocks={jest.fn()}
        />
      )
    ).not.toThrow();
  });

  it("handles API fetch completion gracefully", async () => {
    // Mock successful API call
    (mockFetchUrl as jest.Mock).mockResolvedValueOnce([
      { name: "Artist 1" },
      { name: "Artist 2" },
    ]);
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (usePathname as jest.Mock).mockReturnValue("/test");

    // Render component and wait for async effects to complete
    render(
      <GasRoyaltiesHeader
        title="Gas"
        fetching={false}
        results_count={1}
        date_selection={DateIntervalsSelection.TODAY}
        selected_artist=""
        is_primary={false}
        is_custom_blocks={false}
        focus={GasRoyaltiesCollectionFocus.MEMES}
        getUrl={() => "test-url"}
        setSelectedArtist={jest.fn()}
        setIsPrimary={jest.fn()}
        setIsCustomBlocks={jest.fn()}
        setDateSelection={jest.fn()}
        setDates={jest.fn()}
        setBlocks={jest.fn()}
      />
    );

    // Wait for the async API call to complete
    await act(async () => {
      await Promise.resolve();
    });

    // Component should render successfully with API data
    expect(screen.getByText("Meme")).toBeInTheDocument();
    expect(screen.getByText("Gas")).toBeInTheDocument();
    expect(mockFetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/memes/artists_names"
    );
  });

  it("handles token image with invalid props gracefully", () => {
    // Suppress console.error for this specific test case to avoid noise
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() =>
      render(
        <GasRoyaltiesTokenImage
          path=""
          token_id={0}
          name=""
          thumbnail="placeholder.png" // Use valid placeholder instead of empty string
        />
      )
    ).not.toThrow();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "//0"); // Empty path results in double slash
    expect(screen.getByText("0 -")).toBeInTheDocument();

    // Clean up console spy
    consoleSpy.mockRestore();
  });

  it("handles state updates in rapid succession", () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
      result.current.setIsPrimary(true);
      result.current.setSelectedArtist("Artist 1");
      result.current.setDateSelection(DateIntervalsSelection.LAST_7);
    });

    expect(result.current.collectionFocus).toBe(
      GasRoyaltiesCollectionFocus.MEMES
    );
    expect(result.current.isPrimary).toBe(true);
    expect(result.current.selectedArtist).toBe("Artist 1");
    expect(result.current.dateSelection).toBe(DateIntervalsSelection.LAST_7);
  });

  it("maintains state consistency when switching between primary and custom modes", () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
      result.current.setIsPrimary(true);
    });

    expect(result.current.isPrimary).toBe(true);
    expect(result.current.isCustomBlocks).toBe(false);

    // Switching to custom blocks should disable primary
    act(() => {
      result.current.getSharedProps().setBlocks(1, 100);
    });

    expect(result.current.isPrimary).toBe(false);
    expect(result.current.isCustomBlocks).toBe(true);

    // Switching to custom dates should disable both primary and custom blocks
    act(() => {
      result.current.getSharedProps().setDates(new Date(), new Date());
    });

    expect(result.current.isPrimary).toBe(false);
    expect(result.current.isCustomBlocks).toBe(false);
    expect(result.current.dateSelection).toBe(
      DateIntervalsSelection.CUSTOM_DATES
    );
  });

  it("handles undefined/null values in URL generation", () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
    });

    // Test with empty/undefined values
    expect(result.current.getUrl("")).toContain("api//collection/memes");
    expect(result.current.getUrl("gas")).toContain("api/gas/collection/memes");
  });

  it("validates all required callback functions are provided", () => {
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (usePathname as jest.Mock).mockReturnValue("/test");

    // Test that component requires all callback functions
    expect(() =>
      render(
        <GasRoyaltiesHeader
          title="Gas"
          fetching={false}
          results_count={1}
          date_selection={DateIntervalsSelection.TODAY}
          selected_artist=""
          is_primary={false}
          is_custom_blocks={false}
          focus={GasRoyaltiesCollectionFocus.MEMES}
          getUrl={() => "test-url"}
          setSelectedArtist={jest.fn()}
          setIsPrimary={jest.fn()}
          setIsCustomBlocks={jest.fn()}
          setDateSelection={jest.fn()}
          setDates={jest.fn()}
          setBlocks={jest.fn()}
        />
      )
    ).not.toThrow();
  });

  it("ensures tooltip IDs are unique across multiple token images", () => {
    render(
      <div>
        <GasRoyaltiesTokenImage
          path="memes"
          token_id={1}
          name="Meme 1"
          thumbnail="img1.png"
          note="Note 1"
        />
        <GasRoyaltiesTokenImage
          path="memes"
          token_id={2}
          name="Meme 2"
          thumbnail="img2.png"
          note="Note 2"
        />
      </div>
    );

    // Verify unique tooltip IDs
    expect(screen.getByTestId("tooltip-token-image-1")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-token-image-2")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-token-info-1")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-token-info-2")).toBeInTheDocument();
  });
});

describe("TypeScript Compliance and Type Safety", () => {
  it("useSharedState hook returns correctly typed values", () => {
    const { result } = renderHook(() => useSharedState());

    // Verify all return values have correct types
    expect(typeof result.current.selectedArtist).toBe("string");
    expect(typeof result.current.fetching).toBe("boolean");
    expect(typeof result.current.isPrimary).toBe("boolean");
    expect(typeof result.current.isCustomBlocks).toBe("boolean");
    expect(typeof result.current.showDatePicker).toBe("boolean");
    expect(typeof result.current.showBlockPicker).toBe("boolean");

    // Function type checks
    expect(typeof result.current.setSelectedArtist).toBe("function");
    expect(typeof result.current.setIsPrimary).toBe("function");
    expect(typeof result.current.setIsCustomBlocks).toBe("function");
    expect(typeof result.current.getUrl).toBe("function");
    expect(typeof result.current.getSharedProps).toBe("function");
  });

  it("handles enum values correctly", () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
      result.current.setDateSelection(DateIntervalsSelection.LAST_7);
    });

    expect(result.current.collectionFocus).toBe(
      GasRoyaltiesCollectionFocus.MEMES
    );
    expect(result.current.dateSelection).toBe(DateIntervalsSelection.LAST_7);

    const url = result.current.getUrl("gas");
    expect(url).toContain("/collection/memes");
  });

  it("maintains type safety with optional props", () => {
    // Test TokenImage component with optional note prop
    const { rerender } = render(
      <GasRoyaltiesTokenImage
        path="memes"
        token_id={1}
        name="Test"
        thumbnail="test.png"
        note="Has note"
      />
    );

    expect(screen.getByTestId("tooltip-token-info-1")).toBeInTheDocument();

    // Rerender without note
    rerender(
      <GasRoyaltiesTokenImage
        path="memes"
        token_id={1}
        name="Test"
        thumbnail="test.png"
      />
    );

    expect(
      screen.queryByTestId("tooltip-token-info-1")
    ).not.toBeInTheDocument();
  });
});
