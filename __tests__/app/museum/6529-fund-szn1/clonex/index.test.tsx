import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/clonex/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / clonex migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /CLONEX/i,
      title: "CLONEX - 6529.io",
    });
  });
});
