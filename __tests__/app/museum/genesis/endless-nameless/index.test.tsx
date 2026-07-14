import Page, { generateMetadata } from "@/app/museum/genesis/endless-nameless/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / endless nameless migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /ENDLESS NAMELESS/i,
      title: "ENDLESS NAMELESS - 6529.io",
    });
  });
});
