import Page, { generateMetadata } from "@/app/museum/1-of-1-art/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 1 of 1 art migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /1 OF 1 ART/i,
      title: "1 OF 1 ART - 6529.io",
    });
  });
});
