import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/cryptopunks/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / cryptopunks migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /CRYPTOPUNKS/i,
      title: "CRYPTOPUNKS - 6529.io",
    });
  });
});
