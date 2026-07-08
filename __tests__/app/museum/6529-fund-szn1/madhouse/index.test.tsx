import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/madhouse/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / madhouse migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /MADHOUSE/i,
      title: "MADHOUSE - 6529.io",
    });
  });
});
