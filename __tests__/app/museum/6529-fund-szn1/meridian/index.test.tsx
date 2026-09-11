import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/meridian/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / meridian migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /MERIDIAN/i,
      title: "MERIDIAN - 6529.io",
    });
  });
});
