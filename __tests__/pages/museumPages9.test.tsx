import React from "react";
import { render } from "@testing-library/react";
import Fam2021Page from "@/app/museum/6529-fam-2021/page";
import ChromieSquigglePage from "@/app/museum/6529-fund-szn1/chromie-squiggle/page";
import ConflictingMetaphysicsPage from "@/app/museum/6529-fund-szn1/conflicting-metaphysics/page";
import FundSzn2Page from "@/app/museum/6529-fund-szn2/page";
import BitDigitalPage from "@/app/museum/genesis/27-bit-digital/page";
import AlgobotsPage from "@/app/museum/genesis/algobots/page";
import AsemicaPage from "@/app/museum/genesis/asemica/page";
import ChimeraPage from "@/app/museum/genesis/chimera/page";
import CosmicReefPage from "@/app/museum/genesis/cosmic-reef/page";
import GenesisDcaPage from "@/app/museum/genesis/genesis-dca/page";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("../../components/header/Header", () => () => (
  <div data-testid="header" />
));
jest.mock("../../components/header/HeaderPlaceholder", () => () => (
  <div data-testid="placeholder" />
));

const checkMeta = (title: string, canonical: string, heading: RegExp) => {
  const titleEl = document.querySelector("title");
  expect(titleEl?.textContent).toBe(title);
  const canonicalEl = document.querySelector('link[rel="canonical"]');
  expect(canonicalEl?.getAttribute("href")).toBe(canonical);
  expect(document.querySelector("h1")?.textContent).toMatch(heading);
};

describe("museum pages content batch 9", () => {
  const pages = [
    {
      Component: Fam2021Page,
      title: "6529 FAM 2021 - 6529.io",
      canonical: "/museum/6529-fam-2021/",
      heading: /6529 FAM 2021/i,
    },
    {
      Component: ChromieSquigglePage,
      title: "CHROMIE SQUIGGLE - 6529.io",
      canonical: "/museum/6529-fund-szn1/chromie-squiggle/",
      heading: /CHROMIE SQUIGGLE/i,
    },
    {
      Component: ConflictingMetaphysicsPage,
      title: "CONFLICTING METAPHYSICS - 6529.io",
      canonical: "/museum/6529-fund-szn1/conflicting-metaphysics/",
      heading: /CONFLICTING METAPHYSICS/i,
    },
    {
      Component: FundSzn2Page,
      title: "6529 FUND SZN2 - 6529.io",
      canonical: "/museum/6529-fund-szn2/",
      heading: /6529 FUND SZN2/i,
    },
    {
      Component: BitDigitalPage,
      title: "27-BIT DIGITAL - 6529.io",
      canonical: "/museum/genesis/27-bit-digital/",
      heading: /27-BIT DIGITAL/i,
    },
    {
      Component: AlgobotsPage,
      title: "ALGOBOTS - 6529.io",
      canonical: "/museum/genesis/algobots/",
      heading: /ALGOBOTS/i,
    },
    {
      Component: AsemicaPage,
      title: "ASEMICA - 6529.io",
      canonical: "/museum/genesis/asemica/",
      heading: /ASEMICA/i,
    },
    {
      Component: ChimeraPage,
      title: "CHIMERA - 6529.io",
      canonical: "/museum/genesis/chimera/",
      heading: /CHIMERA/i,
    },
    {
      Component: CosmicReefPage,
      title: "COSMIC REEF - 6529.io",
      canonical: "/museum/genesis/cosmic-reef/",
      heading: /COSMIC REEF/i,
    },
    {
      Component: GenesisDcaPage,
      title: "GENESIS - 6529.io",
      canonical: "/museum/genesis/genesis-dca/",
      heading: /GENESIS/i,
    },
  ];

  pages.forEach(({ Component, title, canonical, heading }) => {
    it(`renders ${title}`, () => {
      render(<Component />);
      checkMeta(title, canonical, heading);
    });
  });

  it("should have proper meta tags for SEO", () => {
    render(<Fam2021Page />);

    // Check Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute("content")).toBe("6529 FAM 2021 - 6529.io");

    const ogType = document.querySelector('meta[property="og:type"]');
    expect(ogType?.getAttribute("content")).toBe("article");

    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    expect(ogSiteName?.getAttribute("content")).toBe("6529.io");
  });

  it("should render with proper structure", () => {
    const { container } = render(<Fam2021Page />);

    // Check for main structural elements
    expect(container.querySelector("#wrapper")).toBeTruthy();
    expect(container.querySelector("#main")).toBeTruthy();
    expect(container.querySelector("#content")).toBeTruthy();
  });

  it("should have proper Twitter meta tags", () => {
    render(<ChromieSquigglePage />);

    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    expect(twitterCard?.getAttribute("content")).toBe("summary_large_image");

    const twitterSite = document.querySelector('meta[name="twitter:site"]');
    expect(twitterSite?.getAttribute("content")).toBe("@om100m");
  });

  it("should have robots meta tag", () => {
    render(<FundSzn2Page />);

    const robots = document.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute("content")).toBe(
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );
  });
});
