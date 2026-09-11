import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/grifters/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / grifters migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /GRIFTERS/i,
      title: "GRIFTERS - 6529.io",
    });
  });
});
