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
import FakeRares, {
  generateMetadata as generateFakeRaresMetadata,
} from "@/app/museum/6529-fund-szn1/fakerares/page";
import Gazers, {
  generateMetadata as generateGazersMetadata,
} from "@/app/museum/6529-fund-szn1/gazers/page";
import RarePepe, {
  generateMetadata as generateRarePepeMetadata,
} from "@/app/museum/6529-fund-szn1/rarepepe/page";
import WildChild, {
  generateMetadata as generateWildChildMetadata,
} from "@/app/museum/6529-fund-szn1/wild-child-2022/page";
import Bonafidehan, {
  generateMetadata as generateBonafidehanMetadata,
} from "@/app/museum/bonafidehan-museum/page";
import AerialView, {
  generateMetadata as generateAerialViewMetadata,
} from "@/app/museum/genesis/aerial-view/page";
import { expectMigratedWordPressPageRenders } from "./migratedWordPressPageTestUtils";

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
    {
      Component: FakeRares,
      generateMetadata: generateFakeRaresMetadata,
      title: "FAKERARES - 6529.io",
      heading: /FAKERARES/i,
    },
    {
      Component: Gazers,
      generateMetadata: generateGazersMetadata,
      title: "GAZERS - 6529.io",
      heading: /GAZERS/i,
    },
    {
      Component: RarePepe,
      generateMetadata: generateRarePepeMetadata,
      title: "RAREPEPE - 6529.io",
      heading: /RAREPEPE/i,
    },
    {
      Component: WildChild,
      generateMetadata: generateWildChildMetadata,
      title: "WILD CHILD 2022 - 6529.io",
      heading: /WILD CHILD 2022/i,
    },
    {
      Component: Bonafidehan,
      generateMetadata: generateBonafidehanMetadata,
      title: "BONAFIDEHAN GALLERY - 6529.io",
      heading: /BONAFIDEHAN GALLERY/i,
    },
    {
      Component: AerialView,
      generateMetadata: generateAerialViewMetadata,
      title: "AERIAL VIEW - 6529.io",
      heading: /AERIAL VIEW/i,
    },
  ];

  migratedPages.forEach(({ Component, generateMetadata, title, heading }) => {
    it(`renders migrated ${title}`, async () => {
      await expectMigratedWordPressPageRenders({
        Component,
        generateMetadata,
        heading,
        title,
      });
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
