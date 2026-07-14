import Page, { generateMetadata } from "@/app/museum/genesis/fidenza/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / fidenza migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /FIDENZA/i,
      title: "FIDENZA - 6529.io",
    });
  });
});
