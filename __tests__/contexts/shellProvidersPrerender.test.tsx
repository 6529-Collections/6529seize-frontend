/** @jest-environment node */

import { renderToString } from "react-dom/server";

// During a static prerender Next's useSearchParams() throws to bail the
// nearest Suspense boundary out to client rendering. The title and history
// providers wrap every page, so their query readers must sit in their own
// boundaries for the page to prerender.
class MockBailoutToClientRendering extends Error {}

jest.mock("next/navigation", () => ({
  usePathname: () => "/network",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => {
    throw new MockBailoutToClientRendering("useSearchParams()");
  },
}));
jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: () => ({ hardBack: jest.fn() }),
}));
jest.mock("@/contexts/WaveInformationContext", () => ({
  useWaveInformation: () => null,
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => null,
}));

const {
  TitleProvider,
}: typeof import("@/contexts/TitleContext") = require("@/contexts/TitleContext");
const {
  NavigationHistoryProvider,
}: typeof import("@/contexts/NavigationHistoryContext") = require("@/contexts/NavigationHistoryContext");

it("renders the page inside the title and history providers without the query", () => {
  const onError = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    const html = renderToString(
      <TitleProvider>
        <NavigationHistoryProvider>
          <main>Page content</main>
        </NavigationHistoryProvider>
      </TitleProvider>
    );
    expect(html).toContain("<main>Page content</main>");
  } finally {
    onError.mockRestore();
  }
});
