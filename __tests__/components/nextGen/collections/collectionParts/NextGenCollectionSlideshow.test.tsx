import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import NextGenCollectionSlideshow from "../../../../../components/nextGen/collections/collectionParts/NextGenCollectionSlideshow";

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
});
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
});

jest.mock("../../../../../services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("../../../../../components/nextGen/collections/nextgenToken/NextGenTokenImage", () => ({
  NextGenTokenImage: ({ token }: any) => (
    <div data-testid="token-image">{token.name}</div>
  ),
}));

const mockSwiperInstance = {
  autoplay: {
    start: jest.fn(),
    stop: jest.fn(),
  },
  realIndex: 0,
};

jest.mock("swiper/react", () => {
  const React = require("react");
  return {
    Swiper: ({ children, onSwiper }: any) => {
      React.useEffect(() => {
        if (onSwiper) {
          onSwiper(mockSwiperInstance);
        }
      }, [onSwiper]);
      return <div data-testid="swiper">{children}</div>;
    },
    SwiperSlide: ({ children }: any) => <div data-testid="slide">{children}</div>,
    useSwiper: () => mockSwiperInstance,
  };
});

jest.mock("../../../../../hooks/useCapacitor", () => () => ({ isCapacitor: false }));

jest.mock("../../../../../hooks/scroll/useIntersectionObserver", () => ({
  useIntersectionObserver: jest.fn(),
}));

import { commonApiFetch } from "../../../../../services/api/common-api";
import { useIntersectionObserver } from "../../../../../hooks/scroll/useIntersectionObserver";

const collection = { id: 1, name: "Test Collection" } as any;
const tokens = [
  { id: 1, name: "Token1", token_id: 1 },
  { id: 2, name: "Token2", token_id: 2 },
  { id: 3, name: "Token3", token_id: 3 },
];

describe("NextGenCollectionSlideshow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (commonApiFetch as jest.Mock).mockResolvedValue({ 
      data: tokens, 
      next: false, 
      count: tokens.length, 
      page: 1 
    });
    (useIntersectionObserver as jest.Mock).mockImplementation((_ref, _options, callback) => {
      // Simulate component being in viewport by default
      React.useEffect(() => {
        if (callback) {
          callback({ isIntersecting: true });
        }
      }, []);
    });
    mockSwiperInstance.autoplay.start.mockClear();
    mockSwiperInstance.autoplay.stop.mockClear();
  });

  it("loads tokens and renders slides", async () => {
    await act(async () => {
      render(<NextGenCollectionSlideshow collection={collection} />);
    });

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `nextgen/collections/${collection.id}/tokens?page_size=50&page=1&sort=random`,
    });

    await waitFor(() => {
      const tokenImages = screen.getAllByTestId("token-image");
      expect(tokenImages.length).toBeGreaterThan(0);
    });
    
    const slides = screen.getAllByTestId("slide");
    expect(slides.length).toBeGreaterThan(0);
  });

  it("renders autoplay toggle button when multiple tokens exist", async () => {
    await act(async () => {
      render(<NextGenCollectionSlideshow collection={collection} />);
    });

    await waitFor(() => {
      const tokenImages = screen.getAllByTestId("token-image");
      expect(tokenImages.length).toBeGreaterThan(1);
    });

    // Button should be rendered because there are multiple tokens
    const autoplayButtons = screen.queryAllByRole("img", { hidden: true });
    const pauseButton = autoplayButtons.find(button => 
      button.getAttribute('data-icon') === 'pause-circle' || 
      button.closest('div')?.textContent?.includes('pause') ||
      button.getAttribute('aria-hidden') === 'true'
    );
    
    expect(pauseButton).toBeTruthy();
  });

  it("handles autoplay control through viewport visibility", async () => {
    let intersectionCallback: any;
    (useIntersectionObserver as jest.Mock).mockImplementation((_ref, _options, callback) => {
      intersectionCallback = callback;
    });

    await act(async () => {
      render(<NextGenCollectionSlideshow collection={collection} />);
    });

    // Component stops autoplay initially when swiper is created
    await waitFor(() => {
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
    });

    // Reset mock to track subsequent calls
    mockSwiperInstance.autoplay.stop.mockClear();
    mockSwiperInstance.autoplay.start.mockClear();

    // Simulate entering viewport
    if (intersectionCallback) {
      act(() => {
        intersectionCallback({ isIntersecting: true });
      });
    }

    await waitFor(() => {
      expect(mockSwiperInstance.autoplay.start).toHaveBeenCalled();
    });

    // Simulate leaving viewport
    if (intersectionCallback) {
      act(() => {
        intersectionCallback({ isIntersecting: false });
      });
    }

    await waitFor(() => {
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
    });
  });

  it("renders view all link with correct href", async () => {
    await act(async () => {
      render(<NextGenCollectionSlideshow collection={collection} />);
    });

    const viewAllLink = screen.getByText("View All").closest('a');
    expect(viewAllLink).toHaveAttribute('href', '/nextgen/collection/test-collection/art');
  });

  it("handles empty token list gracefully", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValueOnce({ 
      data: [], 
      next: false, 
      count: 0, 
      page: 1 
    });

    await act(async () => {
      render(<NextGenCollectionSlideshow collection={collection} />);
    });

    // Should not crash and should render swiper container
    expect(screen.getByTestId("swiper")).toBeInTheDocument();
    
    // Should not have any token images
    expect(screen.queryAllByTestId("token-image")).toHaveLength(0);
  });
});

