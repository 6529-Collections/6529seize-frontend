import Page, { generateMetadata } from "@/app/museum/6529-general-assembly/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 general assembly migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /6529 GENERAL ASSEMBLY/i,
      title: "6529 GENERAL ASSEMBLY - 6529.io",
    });
  });
});
