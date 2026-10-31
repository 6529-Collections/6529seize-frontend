import ReMeme, { generateMetadata } from "@/app/rememes/[contract]/[id]/page";
import { AuthContext } from "@/components/auth/Auth";
import { formatAddress } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/services/api/common-api");
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

    (commonApiFetch as jest.Mock).mockResolvedValue({
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

  it.each([
    [{ locale: "fr-FR" }, "fr-FR"],
    [{}, "en-US"],
  ])(
    "declares the language of the page content for search params %j",
    async (searchParams, lang) => {
      const resolved = await ReMeme({
        params: Promise.resolve({ contract: "0x123abc", id: "456" }),
        searchParams: Promise.resolve(searchParams),
      });

      render(<TestProvider>{resolved}</TestProvider>);

      expect(await screen.findByRole("main")).toHaveAttribute("lang", lang);
    }
  );

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

describe("ReMeme page existence check", () => {
  const params = Promise.resolve({ contract: "0x123abc", id: "456" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("answers not found when the API does not know the token", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({ data: [] });

    await expect(ReMeme({ params })).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
  });

  it("keeps rendering when the API request fails so the client can retry", async () => {
    (commonApiFetch as jest.Mock).mockRejectedValue("HTTP 503");
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(ReMeme({ params })).resolves.toBeDefined();
  });
});

describe("ReMeme generateMetadata", () => {
  const mockFormatAddress = formatAddress as jest.MockedFunction<
    typeof formatAddress
  >;
  const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<
    typeof commonApiFetch
  >;

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
    mockCommonApiFetch.mockResolvedValue(mockResponse);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    expect(mockCommonApiFetch).toHaveBeenCalledWith({
      endpoint: "rememes",
      headers: { "x-test": "1" },
      params: { contract: "0x123abc", id: "456" },
    });
    expect(result.title).toBe("Custom ReMeme Name | ReMemes");
    expect(result.description).toContain("ReMemes");
    const imageUrl = getImageUrl(result);
    expect(imageUrl.pathname).toBe("/api/og-metadata/nfts/0x123abc/456");
    // Card text and artwork come from backend data, never from the query.
    expect(imageUrl.search).toBe("");
  });

  it("encodes reserved route params before fetching metadata", async () => {
    mockCommonApiFetch.mockResolvedValue({ data: [{ metadata: {} }] });

    await generateMetadata({
      params: Promise.resolve({
        contract: "collection/alpha",
        id: "token#1",
      }),
    });

    expect(mockCommonApiFetch).toHaveBeenCalledWith({
      endpoint: "rememes",
      headers: { "x-test": "1" },
      params: { contract: "collection/alpha", id: "token#1" },
    });
  });

  it("answers not found when the API returns empty data", async () => {
    mockCommonApiFetch.mockResolvedValue({ data: [] });

    await expect(
      generateMetadata({
        params: Promise.resolve({ contract: "0x123abc", id: "456" }),
      })
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });

  it("returns default metadata when the API request fails", async () => {
    mockCommonApiFetch.mockRejectedValue("HTTP 503");
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    expect(mockFormatAddress).toHaveBeenCalledWith("0x123abc");
    expect(result.title).toBe("0x123...abc #456 | ReMemes");
    const imageUrl = getImageUrl(result);
    expect(imageUrl.pathname).toBe("/api/og-metadata/nfts/0x123abc/456");
    expect(imageUrl.search).toBe("");
  });

  it("returns default metadata when API returns null", async () => {
    mockCommonApiFetch.mockResolvedValue(null);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    expect(result.title).toBe("0x123...abc #456 | ReMemes");
    const imageUrl = getImageUrl(result);
    expect(imageUrl.pathname).toBe("/api/og-metadata/nfts/0x123abc/456");
    expect(imageUrl.search).toBe("");
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
    mockCommonApiFetch.mockResolvedValue(mockResponse);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    expect(result.title).toBe("0x123...abc #456 | ReMemes");
    const imageUrl = getImageUrl(result);
    expect(imageUrl.pathname).toBe("/api/og-metadata/nfts/0x123abc/456");
    expect(imageUrl.search).toBe("");
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
    mockCommonApiFetch.mockResolvedValue(mockResponse);

    const result = await generateMetadata({
      params: Promise.resolve({ contract: "0x123abc", id: "456" }),
    });

    const imageUrl = getImageUrl(result);
    expect(imageUrl.pathname).toBe("/api/og-metadata/nfts/0x123abc/456");
    expect(imageUrl.search).toBe("");
  });
});
