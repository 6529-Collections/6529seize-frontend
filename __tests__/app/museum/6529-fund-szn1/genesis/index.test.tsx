import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/genesis/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / genesis migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /GENESIS/i,
      title: "GENESIS - 6529.io",
    });
  });
});
