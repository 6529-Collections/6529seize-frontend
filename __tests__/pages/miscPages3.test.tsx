// @ts-nocheck
import React from "react";
import { render } from "@testing-library/react";
import AuthorPage from "@/app/author/6529er6529-io/page";
import CompanyPortfolio from "@/app/capital/company-portfolio/page";
import EducationPage from "@/app/education/page";
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
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("static content pages render meta tags and headings", () => {
  const pages = [
    {
      Component: AuthorPage,
      title: "6529er, Author at 6529.io",
      canonical: "/author/6529er6529-io/",
    },
    {
      Component: CompanyPortfolio,
      title: "COMPANY PORTFOLIO - 6529.io",
      canonical: "/capital/company-portfolio/",
      heading: /COMPANY PORTFOLIO/i,
    },
    {
      Component: EducationPage,
      title: "EDUCATION",
      canonical: "/education/",
      heading: /EDUCATION/i,
    },
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
});
