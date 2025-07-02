// @ts-nocheck
import React from "react";
import { render, screen } from "@testing-library/react";
import AuthorPage from "@/pages/author/6529er6529-io";
import CompanyPortfolio from "@/app/capital/company-portfolio/page";
import EducationPage from "@/pages/education";
import FakeRares from "@/pages/museum/6529-fund-szn1/fakerares";
import Gazers from "@/pages/museum/6529-fund-szn1/gazers";
import RarePepe from "@/pages/museum/6529-fund-szn1/rarepepe";
import WildChild from "@/pages/museum/6529-fund-szn1/wild-child-2022";
import Bonafidehan from "@/pages/museum/bonafidehan-museum";
import AerialView from "@/pages/museum/genesis/aerial-view";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("@/components/header/Header", () => () => (
  <div data-testid="header" />
));
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
      title: "EDUCATION - 6529.io",
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
