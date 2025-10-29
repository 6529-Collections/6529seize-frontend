import React from "react";
import { render, screen } from "@testing-library/react";
import Page from "@/app/museum/bharat-krymo-museum-3/page";

jest.mock("@/components/header/HeaderPlaceholder", () => () => (
  <div data-testid="header-placeholder">Header Placeholder</div>
));

describe("Bharat Krymo Musee d'Art 3 Page", () => {
  const renderComponent = () => render(<Page />);

  it("renders the page title", () => {
    renderComponent();
    const title = document.querySelector("title");
    expect(title?.textContent).toBe("BHARAT KRYMO MUSEE D'ART 3 - 6529.io");
  });

  it("includes canonical link", () => {
    renderComponent();
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).toBeInTheDocument();
    expect(canonical?.getAttribute("href")).toBe(
      "/museum/bharat-krymo-museum-3/"
    );
  });

  it("includes robots meta tag", () => {
    renderComponent();
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute("content")).toBe(
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );
  });

  it("includes Open Graph title", () => {
    renderComponent();
    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute("content")).toBe(
      "BHARAT KRYMO MUSEE D'ART 3 - 6529.io"
    );
  });

  it("has skip to content link", () => {
    renderComponent();
    const skip = screen.getByText("Skip to content");
    expect(skip).toBeInTheDocument();
    expect(skip).toHaveAttribute("href", "#content");
  });

  it("has go to top link", () => {
    renderComponent();
    const link = document.querySelector("#toTop");
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("fusion-top-top-link");
  });
});
