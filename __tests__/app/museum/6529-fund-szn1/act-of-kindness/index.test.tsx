import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/act-of-kindness/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / act of kindness migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /ACT OF KINDNESS/i,
      title: "ACT OF KINDNESS - 6529.io",
    });
  });
});
