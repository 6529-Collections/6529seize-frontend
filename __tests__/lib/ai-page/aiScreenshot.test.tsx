import { renderToStaticMarkup } from "react-dom/server";

import AiScreenshot from "@/components/ai-page/AiScreenshot";

const SLOT = { src: "/ai/placement.png", width: 1040, height: 640 };

describe("AiScreenshot", () => {
  it("renders nothing while the slot has no file", () => {
    const html = renderToStaticMarkup(
      <AiScreenshot
        slot={{ ...SLOT, src: null }}
        alt="The question"
        caption="The question."
      />
    );
    expect(html).toBe("");
  });

  it("shows a 2x dialog at its real size, centred", () => {
    const html = renderToStaticMarkup(
      <AiScreenshot
        slot={SLOT}
        alt="The question"
        caption="The question."
        realSize
      />
    );
    expect(html).toContain("max-width:520px");
    expect(html).toContain("tw-mx-auto");
    expect(html).toContain('sizes="520px"');
    expect(html).toContain("<figcaption");
  });

  it("fills the column otherwise", () => {
    const html = renderToStaticMarkup(
      <AiScreenshot slot={SLOT} alt="The models" caption="The models." />
    );
    expect(html).not.toContain("max-width");
    expect(html).toContain('alt="The models"');
  });
});
