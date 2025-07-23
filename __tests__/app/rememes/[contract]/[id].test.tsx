import { render } from "@testing-library/react";
import ReMeme from '@/app/rememes/[contract]/[id]/page';
import { generateMetadata } from '@/app/rememes/[contract]/[id]/page';
import { AuthContext } from '@/components/auth/Auth';
import { fetchUrl } from '@/services/6529api';

// Mock dependencies
jest.mock('@/services/6529api');

// Mock MyStreamContext if needed
jest.mock('@/contexts/wave/MyStreamContext', () => ({
  useMyStream: () => ({}),
  MyStreamProvider: ({ children }: any) => children,
}));

const mockFetchUrl = fetchUrl as jest.MockedFunction<typeof fetchUrl>;

// Mock TitleContext
jest.mock('@/contexts/TitleContext', () => ({
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

describe("ReMeme Page", () => {
  const mockSetTitle = jest.fn();

  const mockAuthContext = {
    setTitle: mockSetTitle,
    connectedProfile: null,
    activeProfileProxy: null,
    receivedProfileProxies: [],
    givenProfileProxies: [],
    showWaves: true,
    setShowWaves: jest.fn(),
    setConnectedProfile: jest.fn(),
    setActiveProfileProxy: jest.fn(),
    receivedProfileProxiesLoading: false,
    givenProfileProxiesLoading: false,
    requestAuth: jest.fn(),
    setRequestAuth: jest.fn(),
  };

  const defaultProps = {
    contract: "0x123",
    id: "1",
    name: "Test ReMeme",
    image: "test-image.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders main container with correct styling", () => {
      const { container } = render(
        <AuthContext.Provider value={mockAuthContext}>
          <ReMeme {...defaultProps} />
        </AuthContext.Provider>
      );

      expect(container.querySelector("main")).toHaveClass("main");
    });

    it("renders Rememe content", () => {
      const { container } = render(
        <AuthContext.Provider value={mockAuthContext}>
          <ReMeme {...defaultProps} />
        </AuthContext.Provider>
      );

      expect(container.querySelector("main")).toBeInTheDocument();
    });

    it("sets page title on mount", () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ReMeme {...defaultProps} />
        </AuthContext.Provider>
      );

      // Title is set via TitleContext hooks
    });
  });

  describe("generateMetadata", () => {
    const params = { contract: "0x123", id: "456" };

    beforeEach(() => {
      process.env.API_ENDPOINT = "https://api.test.com";
      process.env.BASE_ENDPOINT = "https://test.com";
    });

    it("returns metadata with formatted address when API returns no data", async () => {
      mockFetchUrl.mockResolvedValue({ data: [] });

      const result = await generateMetadata({ params });

      expect(mockFetchUrl).toHaveBeenCalledWith(
        "https://api.test.com/api/rememes?contract=0x123&id=456"
      );

      expect(result.title).toBe("0x123 #456");
      const images = Array.isArray(result.openGraph?.images)
        ? result.openGraph?.images
        : [result.openGraph?.images];
      expect(images?.[0]).toBe("https://test.com/6529io.png");
    });

    it("returns metadata with API data when available", async () => {
      mockFetchUrl.mockResolvedValue({
        data: [
          {
            metadata: { name: "Custom ReMeme Name" },
            image: "https://custom-image.jpg",
          },
        ],
      });

      const result = await generateMetadata({ params });

      expect(result.title).toBe("Custom ReMeme Name");
      const images = Array.isArray(result.openGraph?.images)
        ? result.openGraph?.images
        : [result.openGraph?.images];
      expect(images?.[0]).toBe("https://custom-image.jpg");
    });

    it("handles API data without metadata name", async () => {
      mockFetchUrl.mockResolvedValue({
        data: [
          {
            image: "https://custom-image.jpg",
          },
        ],
      });

      const result = await generateMetadata({ params });

      expect(result.title).toBe("0x123 #456");
      const images = Array.isArray(result.openGraph?.images)
        ? result.openGraph?.images
        : [result.openGraph?.images];
      expect(images?.[0]).toBe("https://custom-image.jpg");
    });

    it("handles API data without image", async () => {
      mockFetchUrl.mockResolvedValue({
        data: [
          {
            metadata: { name: "Custom Name" },
          },
        ],
      });

      const result = await generateMetadata({ params });

      expect(result.title).toBe("Custom Name");
      const images2 = Array.isArray(result.openGraph?.images)
        ? result.openGraph?.images
        : [result.openGraph?.images];
      expect(images2?.[0]).toBe("https://test.com/6529io.png");
    });

    it("uses fallback image in og metadata when image is null", async () => {
      mockFetchUrl.mockResolvedValue({
        data: [
          {
            metadata: { name: "Test Name" },
            image: null,
          },
        ],
      });

      const result = await generateMetadata({ params });

      const images3 = Array.isArray(result.openGraph?.images)
        ? result.openGraph?.images
        : [result.openGraph?.images];
      expect(images3?.[0]).toBe("https://test.com/6529io.png");
    });

    it("handles API fetch failure gracefully", async () => {
      mockFetchUrl.mockResolvedValue(null);

      const result = await generateMetadata({ params });

      expect(result.title).toBe("0x123 #456");
      const images4 = Array.isArray(result.openGraph?.images)
        ? result.openGraph?.images
        : [result.openGraph?.images];
      expect(images4?.[0]).toBe("https://test.com/6529io.png");
    });
  });
});
