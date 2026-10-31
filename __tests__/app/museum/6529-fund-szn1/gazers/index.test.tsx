import { render } from "@testing-library/react";
import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/gazers/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / gazers migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /GAZERS/i,
      title: "GAZERS - 6529.io",
    });
  });

  it("sandboxes every Art Blocks generator embed to scripts only", () => {
    const { container } = render(<Page />);

    const frames = Array.from(container.querySelectorAll("iframe"));
    expect(frames.map((frame) => frame.getAttribute("src"))).toEqual([
      "https://generator.artblocks.io/215000788",
      "https://generator.artblocks.io/215000566",
      "https://generator.artblocks.io/215000403",
    ]);
    for (const frame of frames) {
      expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    }
  });
});
