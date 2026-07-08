import Page, { generateMetadata } from "@/app/museum/genesis/chromie-squiggle/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / chromie squiggle migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /CHROMIE SQUIGGLE/i,
      title: "CHROMIE SQUIGGLE - 6529.io",
    });
  });
});
