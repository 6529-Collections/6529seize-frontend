import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MuseumStudyLink } from "@/components/museum/MuseumStudyLink";

const href =
  "/museum/network/projects/century/system?work=6529NM.2026.001.01#possibility-space";

describe("MuseumStudyLink", () => {
  it("preserves a usable server-rendered link without claiming client readiness", () => {
    const html = renderToString(
      <MuseumStudyLink href={href} className="study-link">
        Locate this work in the full system
      </MuseumStudyLink>
    );
    const container = document.createElement("div");
    container.innerHTML = html;
    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveClass("study-link");
    expect(link).not.toHaveAttribute("data-client-ready");
  });

  it("marks the link ready after hydration while preserving its destination", () => {
    const element = (
      <MuseumStudyLink href={href} className="study-link">
        Locate this work in the full system
      </MuseumStudyLink>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(element);
    document.body.append(container);
    const originalLink = container.querySelector("a");
    const result = render(element, { container, hydrate: true });

    expect(screen.getByRole("link")).toBe(originalLink);
    expect(originalLink).toHaveAttribute("data-client-ready", "true");
    expect(originalLink).toHaveAttribute("href", href);
    result.unmount();
    expect(originalLink).not.toHaveAttribute("data-client-ready");
  });
});
