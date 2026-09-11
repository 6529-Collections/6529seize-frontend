import Page, { generateMetadata } from "@/app/museum/genesis/cryptocube/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / cryptocube migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /CRYPTOCUBE/i,
      title: "CRYPTOCUBE - 6529.io",
    });
  });
});
