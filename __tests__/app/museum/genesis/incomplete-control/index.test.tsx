import Page, { generateMetadata } from "@/app/museum/genesis/incomplete-control/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / incomplete control migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /INCOMPLETE CONTROL/i,
      title: "INCOMPLETE CONTROL - 6529.io",
    });
  });
});
