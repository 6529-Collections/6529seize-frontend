import Page, { generateMetadata } from "@/app/museum/genesis/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /GENESIS/i,
      title: "GENESIS - 6529.io",
    });
  });
});
