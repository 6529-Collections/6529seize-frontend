import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/incomplete-control/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / incomplete control migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /INCOMPLETE CONTROL/i,
      title: "INCOMPLETE CONTROL - 6529.io",
    });
  });
});
