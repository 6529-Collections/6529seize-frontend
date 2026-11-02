import SafeCollectingPage, {
  generateMetadata,
} from "@/app/safe-collecting/page";
import { DelegationCenterSection } from "@/types/enums";
import SafeCollectingSectionPage, {
  generateMetadata as generateSectionMetadata,
} from "@/app/safe-collecting/[...section]/page";
import { getSafeCollectingSectionPath } from "@/components/delegation/safe-collecting-routes";

describe("Safe Collecting route", () => {
  it.each([
    [
      "tap-guide",
      DelegationCenterSection.WALLET_ARCHITECTURE,
      "The Three Address Protocol (TAP)",
    ],
    ["faq", DelegationCenterSection.FAQ, "FAQ"],
    [
      "consolidation-use-cases",
      DelegationCenterSection.CONSOLIDATION_USE_CASES,
      "Consolidation Use Cases",
    ],
    ["wallet-checker", DelegationCenterSection.CHECKER, "Wallet Checker"],
    [
      "build-consolidation",
      DelegationCenterSection.BUILD_CONSOLIDATION,
      "Build a Consolidation",
    ],
  ])("renders %s with canonical metadata", async (slug, section, title) => {
    const params = Promise.resolve({ section: [slug] });
    const element = await SafeCollectingSectionPage({
      params,
      searchParams: Promise.resolve({}),
    });
    expect(element.props.section).toBe(section);
    const metadata = await generateSectionMetadata({ params });
    expect(metadata.title).toBe(`${title} | 6529.io`);
    expect(metadata.alternates?.canonical).toBe(
      `https://test.6529.io/safe-collecting/${slug}`
    );
  });

  it("renders an FAQ article without changing its action title", async () => {
    const params = Promise.resolve({ section: ["faq", "register-delegation"] });
    const element = await SafeCollectingSectionPage({
      params,
      searchParams: Promise.resolve({}),
    });
    expect(element.props).toMatchObject({
      section: DelegationCenterSection.HTML,
      path: ["delegation-faq", "register-delegation"],
    });
    const metadata = await generateSectionMetadata({ params });
    expect(metadata.title).toBe("How to Register a Delegation? | 6529.io");
    expect(metadata.alternates?.canonical).toBe(
      "https://test.6529.io/safe-collecting/faq/register-delegation"
    );
  });

  it("keeps every action and collection route in the Safe Collecting family", async () => {
    for (const section of Object.values(DelegationCenterSection).filter(
      (value) =>
        value !== DelegationCenterSection.HTML &&
        value !== DelegationCenterSection.CENTER
    )) {
      const path = getSafeCollectingSectionPath(section);
      const element = await SafeCollectingSectionPage({
        params: Promise.resolve({ section: path.split("/").slice(2) }),
        searchParams: Promise.resolve({}),
      });
      expect(path).toMatch(/^\/safe-collecting\//);
      expect(element.props.section).toBe(section);
    }
  });
  it("renders the hub with legacy query prefill available to its tools", async () => {
    const element = await SafeCollectingPage({
      searchParams: Promise.resolve({
        address: "name.eth",
        collection: "collection",
        use_case: "2",
      }),
    });
    expect(element.props).toMatchObject({
      section: DelegationCenterSection.CENTER,
      addressQuery: "name.eth",
      collectionQuery: "collection",
      useCaseQuery: 2,
    });
  });

  it("ignores ambiguous repeated prefill parameters", async () => {
    const element = await SafeCollectingPage({
      searchParams: Promise.resolve({
        address: ["a", "b"],
        collection: ["a", "b"],
        use_case: ["1", "2"],
      }),
    });
    expect(element.props).toMatchObject({
      addressQuery: "",
      collectionQuery: "",
      useCaseQuery: 0,
    });
  });

  it("sets the canonical and social URLs to the top-level hub", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe("Safe Collecting | 6529.io");
    expect(metadata.alternates?.canonical).toBe(
      "https://test.6529.io/safe-collecting"
    );
    expect(metadata.openGraph?.url).toBe(
      "https://test.6529.io/safe-collecting"
    );
  });
});
