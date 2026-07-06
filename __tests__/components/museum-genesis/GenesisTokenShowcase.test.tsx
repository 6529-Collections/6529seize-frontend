import { render } from "@testing-library/react";

import GenesisTokenShowcase, {
  parseGenesisShowcasePair,
} from "@/components/museum-genesis/GenesisTokenShowcase";

const VIDEO_PAIR =
  "9VHqNI5X/s5_gazers_500.mp4|Token: 500|Color Theory Style: Sea of Tranquility;The Attainable: Intention|1/1000 RG;396/1000 AR|" +
  "|The neon teal-blue outline of the circular moon makes this output.";

const PLAIN_VIDEO_PAIR =
  "mug2EiOu/s5_gazers_581.mp4|Token: 581|Ambience Hue Spread: 70|7/1000 AR|plain|Numerous washed-out colors.";

const IMAGE_PAIR =
  "933@1082@c1e6a339bd19f196a3d|Token: 933|Storm: Yes;Flowers: 37|2/1024 RG|hi|The second rarest Fragments.";

describe("genesis showcase descriptors", () => {
  it("parses a video descriptor into its exact fields", () => {
    expect(parseGenesisShowcasePair(VIDEO_PAIR, "video")).toEqual({
      media: "9VHqNI5X/s5_gazers_500.mp4",
      tokenLine: "Token: 500",
      keyTraits: [
        "Color Theory Style: Sea of Tranquility",
        "The Attainable: Intention",
      ],
      rarity: ["1/1000 RG", "396/1000 AR"],
      caption:
        "The neon teal-blue outline of the circular moon makes this output.",
      plainColumn: false,
      fetchPriorityHigh: false,
      traitsTextColumns: false,
      rarityBrOutsideStrong: false,
    });
  });

  it("keeps the scrape's Token:633 no-space quirk parseable verbatim", () => {
    const pair = parseGenesisShowcasePair(
      "qb1rsPtw/kai_gen_725.mp4|Token:633|A: 1|1/1024 RG||Caption.",
      "video"
    );
    expect(pair.tokenLine).toBe("Token:633");
  });

  it("lets the final caption field carry semicolons", () => {
    const pair = parseGenesisShowcasePair(
      "988@1086@8011019c8f00d0d9775|Token: 988|Flowers: 13|129/1024 AR|cols6|full seasonality (Autumn; Petals Falling Down)",
      "fragmentsImage"
    );
    expect(pair.caption).toBe("full seasonality (Autumn; Petals Falling Down)");
    expect(pair.traitsTextColumns).toBe(true);
  });

  it("fails fast on malformed descriptors", () => {
    expect(() => parseGenesisShowcasePair("too|few|fields", "video")).toThrow(
      "Malformed genesis showcase descriptor"
    );
    expect(() =>
      parseGenesisShowcasePair("a/b.mp4|NotToken|K|R||C", "video")
    ).toThrow("Unexpected genesis token line");
    expect(() =>
      parseGenesisShowcasePair("a/b.mp4|Token: 1|K|R|bogus|C", "video")
    ).toThrow("Unknown genesis showcase flag");
    expect(() =>
      parseGenesisShowcasePair("a/b.mp4|Token: 1|K|R|hi|C", "video")
    ).toThrow("The hi flag only applies to image pairs");
    expect(() =>
      parseGenesisShowcasePair("1@2@abc|Token: 1|K|R|plain|C", "fragmentsImage")
    ).toThrow("The plain flag only applies to video pairs");
    expect(() =>
      parseGenesisShowcasePair("not-a-scheme|Token: 1|K|R||C", "fragmentsImage")
    ).toThrow("Malformed fragments image media field");
  });
});

describe("genesis showcase rendering", () => {
  it("derives the scrape's sequential row, column and text numbering", () => {
    const { container } = render(
      <GenesisTokenShowcase
        kind="video"
        pairs={[VIDEO_PAIR, PLAIN_VIDEO_PAIR, VIDEO_PAIR, PLAIN_VIDEO_PAIR]}
      />
    );
    expect(container.querySelector(".fusion-builder-row-3")).not.toBeNull();
    expect(container.querySelector(".fusion-builder-row-4")).not.toBeNull();
    expect(container.querySelector(".fusion-builder-row-5")).toBeNull();
    for (const n of [2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(
        container.querySelector(`.fusion-builder-column-${n}`)
      ).not.toBeNull();
      expect(container.querySelector(`.fusion-text-${n}`)).not.toBeNull();
    }
  });

  it("rejects an odd number of pairs", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    try {
      expect(() =>
        render(<GenesisTokenShowcase kind="video" pairs={[VIDEO_PAIR]} />)
      ).toThrow("two pairs each");
    } finally {
      consoleError.mockRestore();
    }
  });

  it("wraps lightbox video columns and leaves plain ones bare", () => {
    const { container } = render(
      <GenesisTokenShowcase
        kind="video"
        pairs={[VIDEO_PAIR, PLAIN_VIDEO_PAIR]}
      />
    );
    const first = container.querySelector(".fusion-builder-column-2");
    expect(first?.getAttribute("class")).toBe(
      "fusion-layout-column fusion_builder_column fusion-builder-column-2 fusion_builder_column_1_4 1_4 fusion-flex-column fusion-column-inner-bg-wrapper"
    );
    const anchor = first?.querySelector("a.fusion-column-anchor");
    expect(anchor?.getAttribute("href")).toBe(
      "https://videos.files.wordpress.com/9VHqNI5X/s5_gazers_500.mp4"
    );
    const plain = container.querySelector(".fusion-builder-column-4");
    expect(plain?.getAttribute("class")).toBe(
      "fusion-layout-column fusion_builder_column fusion-builder-column-4 fusion_builder_column_1_4 1_4 fusion-flex-column"
    );
    expect(plain?.querySelector("a.fusion-column-anchor")).toBeNull();
    const sources = container.querySelectorAll("video source");
    expect(sources).toHaveLength(2);
  });

  it("pins the traits markup: strong/br shape and the rabr variant", () => {
    const { container } = render(
      <GenesisTokenShowcase
        kind="video"
        pairs={[
          VIDEO_PAIR,
          "dceLBAjk/s5_gazers_318.mp4|Token: 318|Pattern Style Close: 3|16/1000 AR;230/1000 ASR|rabr|Vivid yellows.",
        ]}
      />
    );
    const first = container.querySelector(".fusion-text-3");
    expect(first?.innerHTML).toBe(
      "<p>Token: 500</p>" +
        "<p><strong>Key Traits:<br></strong>Color Theory Style: Sea of Tranquility<br>The Attainable: Intention<strong><br></strong></p>" +
        "<p><strong>Rarity:<br></strong>1/1000 RG<br>396/1000 AR<strong><br></strong></p>"
    );
    const rabr = container.querySelector(".fusion-text-5");
    expect(rabr?.innerHTML).toBe(
      "<p>Token: 318</p>" +
        "<p><strong>Key Traits:<br></strong>Pattern Style Close: 3<strong><br></strong></p>" +
        "<p><strong>Rarity:</strong><br>16/1000 AR<br>230/1000 ASR<strong><br></strong></p>"
    );
  });

  it("keeps the scrape-exact class attributes on fragments image columns", () => {
    const { container } = render(
      <GenesisTokenShowcase
        kind="fragmentsImage"
        pairs={[IMAGE_PAIR, IMAGE_PAIR]}
      />
    );
    const imageElement = container.querySelector(
      "div[class^='fusion-image-element']"
    );
    expect(imageElement?.getAttribute("class")).toBe("fusion-image-element ");
    const frame = container.querySelector("span[class*='imageframe-']");
    expect(frame?.getAttribute("class")).toBe(
      " fusion-imageframe imageframe-none imageframe-1 hover-type-zoomin"
    );
  });

  it("derives the fragments asset scheme and cols6 traits classes", () => {
    const prefix =
      "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/";
    const { container } = render(
      <GenesisTokenShowcase
        kind="fragmentsImage"
        pairs={[
          IMAGE_PAIR,
          "988@1086@8011019c8f00d0d9775|Token: 988|Flowers: 13|129/1024 AR|cols6|Full seasonality.",
        ]}
      />
    );
    const img = container.querySelector(".fusion-builder-column-2 img");
    expect(img?.getAttribute("src")).toBe(
      `${prefix}Fragments-of-an-Infinite-Field-933-300x300.png`
    );
    expect(img?.getAttribute("srcset")).toBe(
      [200, 400, 600, 800]
        .map(
          (s) =>
            `${prefix}Fragments-of-an-Infinite-Field-933-${s}x${s}.png ${s}w`
        )
        .concat(`${prefix}Fragments-of-an-Infinite-Field-933.png 1000w`)
        .join(", ")
    );
    expect(img?.getAttribute("sizes")).toBe("(max-width: 640px) 100vw, 400px");
    expect(img?.getAttribute("fetchpriority")).toBe("high");
    expect(img?.getAttribute("class")).toBe("img-responsive wp-image-1082");
    const anchor = container.querySelector(".fusion-builder-column-2 a");
    expect(anchor?.getAttribute("data-rel")).toBe(
      "iLightbox[c1e6a339bd19f196a3d]"
    );
    expect(anchor?.getAttribute("data-title")).toBe(
      "Fragments of an Infinite Field #933"
    );
    expect(anchor?.getAttribute("title")).toBe(
      "Fragments of an Infinite Field #933"
    );
    const secondImg = container.querySelector(".fusion-builder-column-4 img");
    expect(secondImg?.getAttribute("fetchpriority")).toBeNull();
    const cols6Text = container.querySelector(
      ".fusion-builder-column-5 .fusion-text-5"
    );
    expect(cols6Text?.getAttribute("class")).toBe(
      "fusion-text fusion-text-5 awb-text-cols fusion-text-columns-6"
    );
  });
});
