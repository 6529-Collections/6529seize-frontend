import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/fidenza/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / fidenza migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /FIDENZA/i,
      title: "FIDENZA - 6529.io",
    });
  });
});
