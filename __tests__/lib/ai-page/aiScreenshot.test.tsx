import { renderToStaticMarkup } from "react-dom/server";

import AiScreenshot from "@/components/ai-page/AiScreenshot";

describe("AiScreenshot", () => {
  it("shows a 2x dialog at its real size, with its caption, in a border", () => {
    const html = renderToStaticMarkup(
      <AiScreenshot
        slot={{ image: "14-mac-first-run" }}
        alt="The question"
        caption="The question."
      />
    );
    // Half the crop's 864 file pixels, and the border's two.
    expect(html).toContain("max-width:434px");
    expect(html).toContain('alt="The question"');
    expect(html).toContain("The question.</figcaption>");
    // A system dialog has its own title bar and shows whole: no zoom.
    expect(html).not.toContain("See the whole picture");
    expect(html).not.toContain(">6529 AI</span>");
  });

  it("shows the part of the capture its place is about", () => {
    const html = renderToStaticMarkup(
      <AiScreenshot slot={{ image: "31-start" }} alt="Start" caption="Start." />
    );
    expect(html).toContain("aspect-ratio:1670 / 1085");
    expect(html).toContain("max-width:837px");
    // In a window frame whose title bar holds the zoom.
    expect(html).toContain(">6529 AI</span>");
    expect(html).toContain("See the whole picture: Start");
    // The zoom fits the whole capture to the screen.
    expect(html).toContain("width:min(1280px, calc(96vw - 2px)");
  });

  it("gives a phone the app's own phone-width capture", () => {
    const html = renderToStaticMarkup(
      <AiScreenshot
        slot={{ image: "40-chat", phone: "98-phone-chat-reply" }}
        alt="A chat"
        phoneAlt="A chat on a phone"
        caption="A first chat."
      />
    );
    expect(html).toContain('class="max-sm:tw-hidden"');
    expect(html).toContain('class="sm:tw-hidden"');
    expect(html).toContain('alt="A chat on a phone"');
  });
});
