import DelegationPage, {
  generateMetadata,
} from "@/app/delegation/[...section]/page";
import { DelegationCenterSection } from "@/types/enums";

describe("delegation page server", () => {
  it("returns props for known section", async () => {
    const params = Promise.resolve({ section: ["delegation-center"] });
    const searchParams = Promise.resolve({
      address: "0x1",
      collection: "c",
      use_case: "2",
    });
    const element = await DelegationPage({ params, searchParams });
    expect(element.props).toMatchObject({
      section: DelegationCenterSection.CENTER,
      addressQuery: "0x1",
      collectionQuery: "c",
      useCaseQuery: 2,
    });
    const metadata = await generateMetadata({ params });
    expect(metadata).toEqual(
      expect.objectContaining({ title: "Delegation Center" })
    );
  });

  it("returns html section for unknown path", async () => {
    const params = Promise.resolve({ section: ["unknown", "path"] });
    const element = await DelegationPage({
      params,
      searchParams: Promise.resolve({}),
    });
    expect(element.props).toMatchObject({
      section: DelegationCenterSection.HTML,
      path: ["unknown", "path"],
    });
  });
});
