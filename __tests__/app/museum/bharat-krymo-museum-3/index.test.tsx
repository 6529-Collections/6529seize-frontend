import Page, { generateMetadata } from "@/app/museum/bharat-krymo-museum-3/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / bharat krymo museum 3 migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /BHARAT KRYMO MUSEE D'ART 3/i,
      title: "BHARAT KRYMO MUSEE D'ART 3 - 6529.io",
    });
  });
});
