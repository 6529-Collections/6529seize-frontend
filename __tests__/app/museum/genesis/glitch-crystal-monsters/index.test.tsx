import Page, { generateMetadata } from "@/app/museum/genesis/glitch-crystal-monsters/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / glitch crystal monsters migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /GLITCH CRYSTAL MONSTERS/i,
      title: "GLITCH CRYSTAL MONSTERS - 6529.io",
    });
  });
});
