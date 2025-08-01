import React from "react";
import { render } from "@testing-library/react";
import MfersPage from "@/app/museum/6529-fund-szn1/mfers/page";
import ACMuseumPage from "@/app/museum/ac-museum/page";
import AlgorhythmsPage from "@/app/museum/genesis/algorhythms/page";
import EntretiemposPage from "@/app/museum/genesis/entretiempos/page";
import IgnitionPage from "@/app/museum/genesis/ignition/page";
import WatercolorDreamsPage from "@/app/museum/genesis/watercolor-dreams/page";

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

describe("museum pages content", () => {
  const pages = [
    {
      Component: MfersPage,
      title: "mfers - 6529.io",
      canonical: "/museum/6529-fund-szn1/mfers/",
      heading: /MFERS/i,
    },
    {
      Component: ACMuseumPage,
      title: "AC COLLECTION - 6529.io",
      canonical: "/museum/ac-museum/",
      heading: /AC COLLECTION/i,
    },
    {
      Component: AlgorhythmsPage,
      title: "ALGORHYTHMS - 6529.io",
      canonical: "/museum/genesis/algorhythms/",
      heading: /ALGORHYTHMS/i,
    },
    {
      Component: EntretiemposPage,
      title: "ENTRETIEMPOS - 6529.io",
      canonical: "/museum/genesis/entretiempos/",
      heading: /ENTRETIEMPOS/i,
    },
    {
      Component: IgnitionPage,
      title: "IGNITION - 6529.io",
      canonical: "/museum/genesis/ignition/",
      heading: /IGNITION/i,
    },
    {
      Component: WatercolorDreamsPage,
      title: "WATERCOLOR DREAMS - 6529.io",
      canonical: "/museum/genesis/watercolor-dreams/",
      heading: /WATERCOLOR DREAMS/i,
    },
  ];

  pages.forEach(({ Component, title, canonical, heading }) => {
    it(`renders ${title}`, () => {
      render(<Component />);
      checkMeta(title, canonical, heading);
    });
  });
});
