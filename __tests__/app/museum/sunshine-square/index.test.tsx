import React from "react";
import { render } from "@testing-library/react";
import Page from "@/app/museum/sunshine-square/page";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("@/components/header/Header", () => () => (
  <div data-testid="header" />
));
jest.mock("@/components/header/HeaderPlaceholder", () => () => (
  <div data-testid="header-placeholder" />
));

const renderPage = () => render(<Page />);

describe("Sunshine Square Page", () => {
  it("renders title and canonical link", () => {
    renderPage();
    expect(document.querySelector("title")?.textContent).toBe(
      "SUNSHINE SQUARE - 6529.io"
    );
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute("href")).toBe("/museum/sunshine-square/");
  });

  it("includes robots meta tag and top link", () => {
    renderPage();
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute("content")).toBe(
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );
    expect(document.querySelector("#toTop")).toHaveClass("fusion-top-top-link");
  });
});
