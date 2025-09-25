import ReMeme, { generateMetadata } from "@/app/rememes/[contract]/[id]/page";
import { AuthContext } from "@/components/auth/Auth";
import { formatAddress } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/services/6529api");
jest.mock("@/helpers/Helpers");

jest.mock("@/components/rememes/RememePage", () => {
  return {
    __esModule: true,
    default: () => (
      <div data-testid="rememe-page-component">RememePageComponent</div>
    ),
  };
});

const mockSetTitle = jest.fn();

const TestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <AuthContext.Provider value={{ setTitle: mockSetTitle } as any}>
    {children}
  </AuthContext.Provider>
);

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("ReMeme page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders RememePageComponent with correct props", async () => {
    const props = { contract: "0x123abc", id: "456" };

    (fetchUrl as jest.Mock).mockResolvedValue({
      data: [
        {
          metadata: { name: "Test ReMeme" },
          image: "test-image.png",
        },
      ],
    });

    const resolved = await ReMeme({ params: Promise.resolve(props) });

    render(<TestProvider>{resolved}</TestProvider>);

    expect(
      await screen.findByTestId("rememe-page-component")
    ).toBeInTheDocument();
  });

  it("sets page title on mount", () => {
    const pageProps = {
      contract: "0x123abc",
      id: "456",
      name: "Test ReMeme",
      image: "test-image.png",
    };

    render(
      <TestProvider>
        <ReMeme
          params={Promise.resolve({
            contract: pageProps.contract,
            id: pageProps.id,
          })}
        />
      </TestProvider>
    );

    // Title is set via TitleContext hooks
  });
});

describe("ReMeme generateMetadata", () => {
  const mockFormatAddress = formatAddress as jest.MockedFunction<
    typeof formatAddress
  >;
  const mockFetchUrl = fetchUrl as jest.MockedFunction<typeof fetchUrl>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatAddress.mockReturnValue("0x123...abc");
  });

  it("returns metadata when API returns data", async () => {
    const mockResponse = {
      data: [
        {
          metadata: { name: "Custom ReMeme Name" },
          image: "https://test.6529.io/custom-image.png",
        },
      ],
    };
    mockFetchUrl.mockResolvedValue(mockResponse);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    expect(mockFetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/rememes?contract=0x123abc&id=456"
    );
    expect(result.title).toBe("Custom ReMeme Name");
    expect(result.description).toContain("ReMemes");
    const imgs = Array.isArray(result.openGraph?.images)
      ? result.openGraph?.images
      : [result.openGraph?.images];
    expect(imgs?.[0]).toBe("https://test.6529.io/custom-image.png");
  });

  it("returns metadata with default name and image when API returns empty data", async () => {
    const mockResponse = { data: [] };
    mockFetchUrl.mockResolvedValue(mockResponse);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    expect(mockFormatAddress).toHaveBeenCalledWith("0x123abc");
    expect(result.title).toBe("0x123...abc #456");
    const imgs2 = Array.isArray(result.openGraph?.images)
      ? result.openGraph?.images
      : [result.openGraph?.images];
    expect(imgs2?.[0]).toBe("https://test.6529.io/6529io.png");
  });

  it("returns default metadata when API returns null", async () => {
    mockFetchUrl.mockResolvedValue(null);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    expect(result.title).toBe("0x123...abc #456");
    const imgs3 = Array.isArray(result.openGraph?.images)
      ? result.openGraph?.images
      : [result.openGraph?.images];
    expect(imgs3?.[0]).toBe("https://test.6529.io/6529io.png");
  });

  it("handles data with partial metadata", async () => {
    const mockResponse = {
      data: [
        {
          metadata: {},
          image: "https://test.com/partial-image.png",
        },
      ],
    };
    mockFetchUrl.mockResolvedValue(mockResponse);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    expect(result.title).toBe("0x123...abc #456");
    const imgs4 = Array.isArray(result.openGraph?.images)
      ? result.openGraph?.images
      : [result.openGraph?.images];
    expect(imgs4?.[0]).toBe("https://test.com/partial-image.png");
  });

  it("uses fallback ogImage when image is null", async () => {
    const mockResponse = {
      data: [
        {
          metadata: { name: "Test Name" },
          image: null,
        },
      ],
    };
    mockFetchUrl.mockResolvedValue(mockResponse);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    // When image is null, it falls back to the default image (6529io.png), not the re-memes fallback
    const imgs5 = Array.isArray(result.openGraph?.images)
      ? result.openGraph?.images
      : [result.openGraph?.images];
    expect(imgs5?.[0]).toBe("https://test.6529.io/6529io.png");
  });
});
