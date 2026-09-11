import Page, { generateMetadata } from "@/app/museum/genesis/squiggly-wtf/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / squiggly wtf migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /SQUIGGLY\.WTF/i,
      title: "SQUIGGLY.WTF - 6529.io",
    });
  });
});
