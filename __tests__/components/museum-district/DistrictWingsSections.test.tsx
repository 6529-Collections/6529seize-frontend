import { render } from "@testing-library/react";

import DistrictWingsSections from "@/components/museum-district/DistrictWingsSections";
import { DISTRICT_WINGS } from "@/components/museum-district/district-wings-data";

describe("district wings data invariants", () => {
  const cards = DISTRICT_WINGS.filter((entry) => entry.kind !== "heading");

  it("holds 13 cards and 2 headings", () => {
    expect(cards).toHaveLength(13);
    expect(DISTRICT_WINGS).toHaveLength(15);
  });

  it("routes every om href to an external oncyber space", () => {
    for (const entry of cards) {
      const hrefs =
        entry.kind === "card"
          ? entry.links.map((link) => link.href.om)
          : [entry.href.om];
      for (const href of hrefs) {
        expect(href).toMatch(/^https:\/\/oncyber\.io\//);
      }
    }
  });

  it("routes every museum href to an internal museum page", () => {
    for (const entry of cards) {
      const hrefs =
        entry.kind === "card"
          ? entry.links.map((link) => link.href.museum)
          : [entry.href.museum];
      for (const href of hrefs) {
        expect(href).toMatch(/^\/museum\//);
      }
    }
  });

  it("carries both variants' numeric class suffixes on every entry", () => {
    for (const entry of DISTRICT_WINGS) {
      expect(entry.numbers.om.column).toEqual(expect.any(Number));
      expect(entry.numbers.museum.column).toEqual(expect.any(Number));
    }
  });
});

describe("scrape-exact class attributes", () => {
  // The WP scrape carries stray spaces inside class attributes; DOM parity
  // with the original pages depends on them surviving verbatim.
  it("keeps the trailing space on fusion-image-element", () => {
    const { container } = render(<DistrictWingsSections variant="om" />);
    const imageElements = container.querySelectorAll(
      "div[class^='fusion-image-element']"
    );
    expect(imageElements).toHaveLength(13);
    for (const element of imageElements) {
      expect(element.getAttribute("class")).toBe("fusion-image-element ");
    }
  });

  it("keeps the leading space on the imageframe span class", () => {
    const { container } = render(<DistrictWingsSections variant="museum" />);
    const frames = container.querySelectorAll("span[class*='imageframe-']");
    expect(frames).toHaveLength(13);
    for (const frame of frames) {
      expect(frame.getAttribute("class")).toMatch(
        /^ fusion-imageframe imageframe-none imageframe-\d+ hover-type-none$/
      );
    }
  });

  it("renders om links as external anchors and museum links as internal", () => {
    const om = render(<DistrictWingsSections variant="om" />);
    expect(
      om.container.querySelectorAll(
        "a[target='_blank'][href^='https://oncyber.io/']"
      ).length
    ).toBeGreaterThanOrEqual(13);
    const museum = render(<DistrictWingsSections variant="museum" />);
    expect(
      museum.container.querySelectorAll("a[target='_blank']")
    ).toHaveLength(0);
    expect(
      museum.container.querySelectorAll("a[href^='/museum/']").length
    ).toBeGreaterThanOrEqual(13);
  });
});
