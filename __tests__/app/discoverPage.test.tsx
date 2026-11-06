import * as discoverPage from "@/app/discover/page";

jest.mock("@/components/waves/discovery/DiscoverWaveExplorer", () => ({
  DiscoverWaveExplorer: () => null,
}));

// /discover is a static prerender (#4674). #4678 forced per-request rendering
// after a Production E2E focus failure whose cause turned out to be a
// concurrent production deploy (build-ID skew against the edge cache), not
// this page; see the root-cause note in #4687. Changing the rendering mode
// again should be a deliberate, reviewed decision.
describe("/discover route config", () => {
  it("does not opt out of static prerendering", () => {
    const routeConfig: Record<string, unknown> = { ...discoverPage };
    expect(routeConfig["dynamic"]).not.toBe("force-dynamic");
  });
});
