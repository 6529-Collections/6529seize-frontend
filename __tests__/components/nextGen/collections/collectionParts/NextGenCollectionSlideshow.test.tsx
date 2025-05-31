import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import NextGenCollectionSlideshow from "../../../../../components/nextGen/collections/collectionParts/NextGenCollectionSlideshow";

jest.mock("../../../../../services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("../../../../../components/nextGen/collections/nextgenToken/NextGenTokenImage", () => ({
  NextGenTokenImage: ({ token }: any) => (
    <div data-testid="token-image">{token.name}</div>
  ),
}));

const swiperAutoplay = { start: jest.fn(), stop: jest.fn() };

jest.mock("swiper/react", () => {
  const React = require("react");
  return {
    Swiper: ({ children }: any) => <div data-testid="swiper">{children}</div>,
    SwiperSlide: ({ children }: any) => <div data-testid="slide">{children}</div>,
    useSwiper: () => ({ autoplay: swiperAutoplay }),
  };
});

jest.mock("../../../../../hooks/useCapacitor", () => () => ({ isCapacitor: false }));

const { commonApiFetch } = require("../../../../../services/api/common-api");

const collection = { id: 1, name: "Test" } as any;
const tokens = [
  { id: 1, name: "Token1" },
  { id: 2, name: "Token2" },
];

describe("NextGenCollectionSlideshow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (commonApiFetch as jest.Mock).mockResolvedValue({ data: tokens, next: false });
  });

  it("loads tokens and renders slides", async () => {
    render(<NextGenCollectionSlideshow collection={collection} />);

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `nextgen/collections/${collection.id}/tokens?page_size=25&page=1&sort=random`,
    });

    await screen.findAllByTestId("token-image");
    const slides = screen.getAllByTestId("slide");
    expect(slides).toHaveLength(tokens.length);
  });

  it("toggles autoplay when button clicked", async () => {
    render(<NextGenCollectionSlideshow collection={collection} />);

    await screen.findAllByTestId("token-image");

    // Autoplay starts on mount
    expect(swiperAutoplay.start).toHaveBeenCalledTimes(1);

    // Button should be rendered because there are two tokens
    const button = screen.getAllByRole("img", { hidden: true })[1];

    fireEvent.click(button);
    await waitFor(() => {
      expect(swiperAutoplay.stop).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(button);
    await waitFor(() => {
      expect(swiperAutoplay.start).toHaveBeenCalledTimes(2);
    });
  });
});

