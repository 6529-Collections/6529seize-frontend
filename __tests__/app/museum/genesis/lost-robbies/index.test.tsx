import Page, { generateMetadata } from "@/app/museum/genesis/lost-robbies/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / lost robbies migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /THE LOST ROBBIES/i,
      title: "THE LOST ROBBIES - 6529.io",
    });
  });
});
