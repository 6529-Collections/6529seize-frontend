/** @jest-environment node */

import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/components/providers/Providers", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => children,
}));

jest.mock("@/components/dynamic-head/DynamicHeadTitle", () => ({
  __esModule: true,
  default: () => null,
}));

const layout: typeof import("../../standalone/standalone-memes-mint/src/app/layout") =
  require("../../standalone/standalone-memes-mint/src/app/layout");

describe("standalone mint layout (static export)", () => {
  it("is statically rendered so useSearchParams() providers can prerender /_not-found", () => {
    expect(layout.dynamic).toBe("force-static");
  });

  it("links the production favicons the export copies from public/", () => {
    const markup = renderToStaticMarkup(
      <layout.default>
        <main />
      </layout.default>
    );

    expect(markup).toContain(
      '<link rel="icon" href="/favicon.png" type="image/png" sizes="96x96"/>'
    );
    expect(markup).toContain(
      '<link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any"/>'
    );
    // PNG first: browsers that support SVG take the last icon.
    expect(markup.indexOf("/favicon.png")).toBeLessThan(
      markup.indexOf("/favicon.svg")
    );
  });
});
