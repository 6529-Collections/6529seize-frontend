import Page, { generateMetadata } from "@/app/museum/genesis/cryptoarte/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / cryptoarte migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /CRYPTOARTE/i,
      title: "CRYPTOARTE - 6529.io",
    });
  });
});
