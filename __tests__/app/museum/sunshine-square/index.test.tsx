import Page, { generateMetadata } from "@/app/museum/sunshine-square/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / sunshine square migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /SUNSHINE SQUARE/i,
      title: "SUNSHINE SQUARE - 6529.io",
    });
  });
});
