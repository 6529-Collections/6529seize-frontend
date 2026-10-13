import SafeCollectingPage, {
  generateMetadata,
} from "@/app/safe-collecting/page";
import { DelegationCenterSection } from "@/types/enums";

describe("Safe Collecting route", () => {
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
