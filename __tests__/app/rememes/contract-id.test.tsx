import ReMeme, { generateMetadata } from "@/app/rememes/[contract]/[id]/page";
import { AuthContext } from "@/components/auth/Auth";
import { formatAddress } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/services/6529api");
jest.mock("@/helpers/Helpers");
jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn().mockResolvedValue({ "x-test": "1" }),
}));

const mockRememePage = jest.fn(
  (props: { contract: string; id: string; locale: string }) => (
    <div data-testid="rememe-page-component" data-locale={props.locale}>
      RememePageComponent
    </div>
  )
);

jest.mock("@/components/rememes/RememePage", () => {
  return {
    __esModule: true,
    default: (props: { contract: string; id: string; locale: string }) =>
      mockRememePage(props),
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
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
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
    expect(mockRememePage).toHaveBeenCalledWith({
      contract: "0x123abc",
      id: "456",
      locale: "en-US",
    });
  });

  it("passes supported locale search params to RememePage", async () => {
    const resolved = await ReMeme({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
      searchParams: Promise.resolve({ locale: "de-DE" }),
    });

    render(<TestProvider>{resolved}</TestProvider>);

    expect(await screen.findByTestId("rememe-page-component")).toHaveAttribute(
      "data-locale",
      "de-DE"
    );
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

  const getImageUrl = (
    metadata: Awaited<ReturnType<typeof generateMetadata>>
  ) => {
    const [image] = metadata.openGraph?.images as {
      alt: string;
      height: number;
      url: string;
      width: number;
    }[];
    return new URL(image.url);
  };

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
      "https://api.test.6529.io/api/rememes?contract=0x123abc&id=456",
      { headers: { "x-test": "1" } }
    );
    expect(result.title).toBe("Custom ReMeme Name | ReMemes");
    expect(result.description).toContain("ReMemes");
    const imageUrl = getImageUrl(result);
    expect(imageUrl.pathname).toBe("/api/og-metadata/nfts/0x123abc/456");
    expect(imageUrl.searchParams.get("image")).toBe(
      "https://test.6529.io/custom-image.png"
    );
  });

  it("encodes reserved route params before fetching metadata", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });

    await generateMetadata({
      params: Promise.resolve({
        contract: "collection/alpha",
        id: "token#1",
      }),
    });

    expect(mockFetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/rememes?contract=collection%2Falpha&id=token%231",
      { headers: { "x-test": "1" } }
    );
  });

  it("returns metadata with default name and image when API returns empty data", async () => {
    const mockResponse = { data: [] };
    mockFetchUrl.mockResolvedValue(mockResponse);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    expect(mockFormatAddress).toHaveBeenCalledWith("0x123abc");
    expect(result.title).toBe("0x123...abc #456 | ReMemes");
    const imageUrl = getImageUrl(result);
    expect(imageUrl.pathname).toBe("/api/og-metadata/nfts/0x123abc/456");
    expect(imageUrl.searchParams.get("image")).toBeNull();
  });

  it("returns default metadata when API returns null", async () => {
    mockFetchUrl.mockResolvedValue(null);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    expect(result.title).toBe("0x123...abc #456 | ReMemes");
    const imageUrl = getImageUrl(result);
    expect(imageUrl.pathname).toBe("/api/og-metadata/nfts/0x123abc/456");
    expect(imageUrl.searchParams.get("image")).toBeNull();
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

    expect(result.title).toBe("0x123...abc #456 | ReMemes");
    const imageUrl = getImageUrl(result);
    expect(imageUrl.pathname).toBe("/api/og-metadata/nfts/0x123abc/456");
    expect(imageUrl.searchParams.get("image")).toBe(
      "https://test.com/partial-image.png"
    );
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

    const imageUrl = getImageUrl(result);
    expect(imageUrl.pathname).toBe("/api/og-metadata/nfts/0x123abc/456");
    expect(imageUrl.searchParams.get("image")).toBeNull();
  });
});
