// @ts-nocheck
import React from "react";
import { render } from "@testing-library/react";
import AuthorPage, {
  generateMetadata as generateAuthorMetadata,
} from "@/app/author/6529er6529-io/page";
import CompanyPortfolio, {
  generateMetadata as generateCompanyPortfolioMetadata,
} from "@/app/capital/company-portfolio/page";
import EducationPage, {
  generateMetadata as generateEducationMetadata,
} from "@/app/education/page";
import FakeRares from "@/app/museum/6529-fund-szn1/fakerares/page";
import Gazers from "@/app/museum/6529-fund-szn1/gazers/page";
import RarePepe from "@/app/museum/6529-fund-szn1/rarepepe/page";
import WildChild from "@/app/museum/6529-fund-szn1/wild-child-2022/page";
import Bonafidehan from "@/app/museum/bonafidehan-museum/page";
import AerialView from "@/app/museum/genesis/aerial-view/page";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("@/components/header/HeaderPlaceholder", () => () => (
  <div data-testid="header-placeholder" />
));

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

describe("static content pages render meta tags and headings", () => {
  const migratedPages = [
    {
      Component: AuthorPage,
      generateMetadata: generateAuthorMetadata,
      title: "6529er - 6529.io",
      heading: /6529er/i,
    },
    {
      Component: CompanyPortfolio,
      generateMetadata: generateCompanyPortfolioMetadata,
      title: "COMPANY PORTFOLIO - 6529.io",
      heading: /COMPANY PORTFOLIO/i,
    },
  ];

  const pages = [
    {
      Component: FakeRares,
      title: "FAKERARES - 6529.io",
      canonical: "/museum/6529-fund-szn1/fakerares/",
      heading: /FAKERARES/i,
    },
    {
      Component: Gazers,
      title: "GAZERS - 6529.io",
      canonical: "/museum/6529-fund-szn1/gazers/",
      heading: /GAZERS/i,
    },
    {
      Component: RarePepe,
      title: "RAREPEPE - 6529.io",
      canonical: "/museum/6529-fund-szn1/rarepepe/",
      heading: /RAREPEPE/i,
    },
    {
      Component: WildChild,
      title: "WILD CHILD 2022 - 6529.io",
      canonical: "/museum/6529-fund-szn1/wild-child-2022/",
      heading: /WILD CHILD 2022/i,
    },
    {
      Component: Bonafidehan,
      title: "BONAFIDEHAN GALLERY - 6529.io",
      canonical: "/museum/bonafidehan-museum/",
      heading: /BONAFIDEHAN GALLERY/i,
    },
    {
      Component: AerialView,
      title: "AERIAL VIEW - 6529.io",
      canonical: "/museum/genesis/aerial-view/",
      heading: /AERIAL VIEW/i,
    },
  ];

  migratedPages.forEach(({ Component, generateMetadata, title, heading }) => {
    it(`renders migrated ${title}`, () => {
      render(<Component />);

      const metadata = generateMetadata();
      expect(metadata.title).toBe(title);
      expect(metadata.openGraph).toMatchObject({
        siteName: "6529.io",
        title,
      });

      const main = document.querySelector("main");
      expect(main).toHaveAttribute("data-content-source", "migrated-wordpress");

      const h1 = document.querySelector("h1");
      expect(h1?.textContent).toMatch(heading);
    });
  });

  pages.forEach(({ Component, title, canonical, heading }) => {
    it(`renders ${title}`, () => {
      render(<Component />);

      const titleElement = document.querySelector("title");
      expect(titleElement?.textContent).toBe(title);

      const canonicalLink = document.querySelector('link[rel="canonical"]');
      expect(canonicalLink?.getAttribute("href")).toBe(canonical);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      expect(ogTitle?.getAttribute("content")).toBe(title);

      if (heading) {
        const h1 = document.querySelector("h1");
        expect(h1?.textContent).toMatch(heading);
      }
    });
  });

  it("renders the migrated EDUCATION page via generateMetadata", () => {
    render(<EducationPage />);

    const metadata = generateEducationMetadata();
    expect(metadata.title).toBe("EDUCATION - 6529.io");

    const h1 = document.querySelector("h1");
    expect(h1?.textContent).toMatch(/EDUCATION/i);
  });
});
