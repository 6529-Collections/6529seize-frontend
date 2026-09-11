import Page, { generateMetadata } from "@/app/museum/bharat-krymo-museum-2/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / bharat krymo museum 2 migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /BHARAT KRYMO MUSEE D'ART 2/i,
      title: "BHARAT KRYMO MUSEE D'ART 2 - 6529.io",
    });
  });
});
