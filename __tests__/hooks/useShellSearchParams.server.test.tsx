/** @jest-environment node */

import { renderToString } from "react-dom/server";

// During a static prerender Next's useSearchParams() throws to bail the
// nearest Suspense boundary out to client rendering. The wave providers wrap
// every route outside any boundary, so on public routes they must not call
// it; wave and chat routes render per request and read it as before.
class MockBailoutToClientRendering extends Error {}

const mockLocation = { pathname: "/", search: "" };
const mockUseSearchParams = jest.fn(() => {
  if (mockLocation.pathname === "/") {
    throw new MockBailoutToClientRendering("useSearchParams()");
  }
  return new URLSearchParams(mockLocation.search);
});

jest.mock("next/navigation", () => ({
  usePathname: () => mockLocation.pathname,
  useSearchParams: () => mockUseSearchParams(),
}));

const {
  useShellSearchParams,
}: typeof import("@/hooks/useShellSearchParams") = require("@/hooks/useShellSearchParams");

function Reader() {
  const params = useShellSearchParams(mockLocation.pathname);
  return <output>{params === null ? "none" : params.toString()}</output>;
}

beforeEach(() => mockUseSearchParams.mockClear());

it.each(["/", "/the-memes/1", "/network"])(
  "renders public route %s without reading the query",
  (pathname) => {
    mockLocation.pathname = pathname;
    mockLocation.search = "wave=wave&serialNo=42";
    expect(renderToString(<Reader />)).toBe("<output>none</output>");
    expect(mockUseSearchParams).not.toHaveBeenCalled();
  }
);

it.each(["/waves/wave", "/waves", "/messages/dm", "/notifications"])(
  "reads the query on wave/chat route %s",
  (pathname) => {
    mockLocation.pathname = pathname;
    mockLocation.search = "serialNo=42";
    expect(renderToString(<Reader />)).toBe("<output>serialNo=42</output>");
    expect(mockUseSearchParams).toHaveBeenCalledTimes(1);
  }
);

it("prerenders WaveInformationProvider on / around the page", () => {
  mockLocation.pathname = "/";
  mockLocation.search = "";
  const {
    WaveInformationProvider,
  }: typeof import("@/contexts/WaveInformationContext") = require("@/contexts/WaveInformationContext");
  const html = renderToString(
    <WaveInformationProvider>
      <main>Page content</main>
    </WaveInformationProvider>
  );
  expect(html).toBe("<main>Page content</main>");
  expect(mockUseSearchParams).not.toHaveBeenCalled();
});
