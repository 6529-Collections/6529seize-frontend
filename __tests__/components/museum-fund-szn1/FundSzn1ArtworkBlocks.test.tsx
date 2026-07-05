import { render } from "@testing-library/react";

import type { FundSzn1Block } from "@/components/museum-fund-szn1/FundSzn1ArtworkBlocks";
import FundSzn1ArtworkBlocks from "@/components/museum-fund-szn1/FundSzn1ArtworkBlocks";

const TILE: Extract<FundSzn1Block, { kind: "tile" }> = {
  kind: "tile",
  variant: "sixth",
  column: 1,
  imageframe: 1,
  titleNumber: 2,
  lightboxHref: "https://example.com/art-600x600.png",
  lightboxRel: "iLightbox[abc]",
  artworkTitle: "art #1",
  heading: <>ART #1</>,
  fetchPriorityHigh: true,
  image: {
    width: 600,
    height: 600,
    src: "https://example.com/art-600x600.png",
    wpImage: 42,
    srcSet: "https://example.com/art-200x200.png 200w",
    sizes: "(max-width: 640px) 100vw, 200px",
  },
};

describe("fund szn1 artwork blocks", () => {
  // The WP scrape carries stray spaces inside class attributes; DOM parity
  // with the original pages depends on them surviving verbatim.
  it("keeps the scrape-exact class attributes on tiles", () => {
    const { container } = render(<FundSzn1ArtworkBlocks blocks={[TILE]} />);
    const imageElement = container.querySelector(
      "div[class^='fusion-image-element']"
    );
    expect(imageElement?.getAttribute("class")).toBe("fusion-image-element ");
    const frame = container.querySelector("span[class*='imageframe-']");
    expect(frame?.getAttribute("class")).toBe(
      " fusion-imageframe imageframe-none imageframe-1 hover-type-zoomin"
    );
  });

  it("emits fetchpriority only when the tile asks for it", () => {
    const { container } = render(
      <FundSzn1ArtworkBlocks
        blocks={[TILE, { ...TILE, column: 2, fetchPriorityHigh: undefined }]}
      />
    );
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
    expect(images[0]?.getAttribute("fetchpriority")).toBe("high");
    expect(images[1]?.getAttribute("fetchpriority")).toBeNull();
  });

  it("renders slider columns with one flexslider per slide group", () => {
    const { container } = render(
      <FundSzn1ArtworkBlocks
        blocks={[
          {
            kind: "sliderColumn",
            column: 8,
            titleNumber: 9,
            heading: <>SET</>,
            sliders: [
              [
                {
                  width: 400,
                  height: 400,
                  src: "https://example.com/a.png",
                  wpImage: 1,
                },
              ],
              [
                {
                  width: 400,
                  height: 400,
                  src: "https://example.com/b.png",
                  wpImage: 2,
                },
              ],
            ],
          },
        ]}
      />
    );
    expect(container.querySelectorAll(".fusion-slider-sc")).toHaveLength(2);
    expect(container.querySelectorAll("li.image img")).toHaveLength(2);
  });

  it("renders carousel items inside the swiper wrapper with nav buttons", () => {
    const { container } = render(
      <FundSzn1ArtworkBlocks
        blocks={[
          {
            kind: "carousel",
            column: 7,
            carouselNumber: 1,
            titleNumber: 8,
            caption: <>FULL SET</>,
            items: [
              { width: 1000, height: 1000, src: "https://example.com/c.png" },
            ],
          },
        ]}
      />
    );
    expect(container.querySelectorAll(".swiper-slide")).toHaveLength(1);
    expect(
      container.querySelectorAll(
        ".awb-swiper-button-prev, .awb-swiper-button-next"
      )
    ).toHaveLength(2);
    const img = container.querySelector(".swiper-slide img");
    expect(img?.getAttribute("class")).toBe("attachment-full size-full");
  });
});
