import { render, waitFor } from "@testing-library/react";

let mockEnvironmentUrl = "https://6529.io";

jest.mock("@/config/appEnvironment", () => {
  const actual = jest.requireActual("@/config/appEnvironment");
  return {
    ...actual,
    getBrowserAppEnvironment: () =>
      actual.getAppEnvironment(mockEnvironmentUrl),
  };
});

import RuntimeFavicon from "@/components/providers/RuntimeFavicon";

const getFaviconLinks = () =>
  Array.from(
    document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
  );

const expectFavicons = async (pngHref: string, svgHref: string) => {
  await waitFor(() => {
    const links = getFaviconLinks();
    expect(links).toHaveLength(2);
    expect(
      links.map((link) => ({
        kind: link.getAttribute("data-runtime-favicon"),
        href: link.getAttribute("href"),
        sizes: link.getAttribute("sizes"),
        type: link.getAttribute("type"),
      }))
    ).toEqual([
      {
        kind: "png",
        href: pngHref,
        sizes: "96x96",
        type: "image/png",
      },
      {
        kind: "svg",
        href: svgHref,
        sizes: "any",
        type: "image/svg+xml",
      },
    ]);
  });
};

describe("RuntimeFavicon", () => {
  beforeEach(() => {
    mockEnvironmentUrl = "https://6529.io";
    document.head.innerHTML = `
      <title>6529.io</title>
      <link data-runtime-favicon="png" rel="icon" href="/favicon.png" type="image/png" sizes="96x96" />
      <link data-runtime-favicon="svg" rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
    `;
  });

  afterEach(() => {
    document.head.innerHTML = "";
  });

  it.each([
    ["https://6529.io", "/favicon.png", "/favicon.svg"],
    ["https://www.6529.io", "/favicon.png", "/favicon.svg"],
    ["https://staging.6529.io", "/favicon-staging.png", "/favicon-staging.svg"],
    ["https://prxtstaging.6529.io", "/favicon-alt.png", "/favicon-alt.svg"],
    ["https://alicestaging.6529.io", "/favicon-alt.png", "/favicon-alt.svg"],
    ["http://localhost:3001", "/favicon-alt.png", "/favicon-alt.svg"],
    ["not-a-url", "/favicon.png", "/favicon.svg"],
  ])(
    "keeps one browser-derived PNG/SVG pair for %s",
    async (environmentUrl, pngHref, svgHref) => {
      mockEnvironmentUrl = environmentUrl;

      render(<RuntimeFavicon />);

      await expectFavicons(pngHref, svgHref);
    }
  );

  it("restores the browser favicon after an App Router metadata head update", async () => {
    mockEnvironmentUrl = "https://staging.6529.io";
    render(<RuntimeFavicon />);
    await expectFavicons("/favicon-staging.png", "/favicon-staging.svg");

    getFaviconLinks().forEach((link) => link.remove());
    const metadataIcon = document.createElement("link");
    metadataIcon.rel = "icon";
    metadataIcon.href = "/favicon.svg";
    metadataIcon.type = "image/svg+xml";
    document.head.appendChild(metadataIcon);

    await expectFavicons("/favicon-staging.png", "/favicon-staging.svg");
  });
});
