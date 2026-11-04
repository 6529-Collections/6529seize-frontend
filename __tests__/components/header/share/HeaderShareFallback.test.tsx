/** @jest-environment node */

import { renderToString } from "react-dom/server";

// During a static prerender Next's useSearchParams() throws to bail the
// nearest Suspense boundary out to client rendering, so the HTML holds the
// boundary's fallback until the browser renders the Share button. The
// fallback must keep the button's 46px row where the button would appear,
// and nothing where it would not.
class MockBailoutToClientRendering extends Error {}

let mockPathname = "/network";
let mockIsCapacitor = false;
let mockIsMobileDevice = false;

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => {
    throw new MockBailoutToClientRendering("useSearchParams()");
  },
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: mockIsCapacitor }),
}));
jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  default: () => mockIsMobileDevice,
}));

const HeaderShare: typeof import("@/components/header/share/HeaderShare").default =
  require("@/components/header/share/HeaderShare").default;

function prerender(): string {
  const onError = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    return renderToString(
      <nav>
        <HeaderShare />
        <p>Update</p>
      </nav>
    );
  } finally {
    onError.mockRestore();
  }
}

beforeEach(() => {
  mockPathname = "/network";
  mockIsCapacitor = false;
  mockIsMobileDevice = false;
});

it("holds the Share button's 46px row on pages that offer Share", () => {
  const html = prerender();
  expect(html).toContain('data-testid="header-share-space"');
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain("tw-h-[2.875rem]");
  // Blank space only: no button or label before the browser renders it.
  expect(html).not.toContain("<button");
  expect(html).toContain("<p>Update</p>");
});

it.each(["/messages", "/notifications"])(
  "reserves nothing on %s, where Share is not offered",
  (pathname) => {
    mockPathname = pathname;
    expect(prerender()).not.toContain("header-share-space");
  }
);

it.each([
  ["the native app", () => (mockIsCapacitor = true)],
  ["mobile devices", () => (mockIsMobileDevice = true)],
])("reserves nothing in %s", (_label, arrange) => {
  arrange();
  expect(prerender()).not.toContain("header-share-space");
});
