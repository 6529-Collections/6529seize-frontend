import Page, { generateMetadata } from "@/app/museum/6529-gradient-collector-curated/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 gradient collector curated migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /6529 GRADIENT COLLECTOR CURATED/i,
      title: "6529 GRADIENT COLLECTOR CURATED - 6529.io",
    });
  });
});
