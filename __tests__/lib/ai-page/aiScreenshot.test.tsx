import { renderToStaticMarkup } from "react-dom/server";

import AiScreenshot from "@/components/ai-page/AiScreenshot";

describe("AiScreenshot", () => {
  it("shows a 2x dialog at its real size, with its caption", () => {
    const html = renderToStaticMarkup(
      <AiScreenshot
        slot={{ image: "14-mac-first-run" }}
        alt="The question"
        caption="The question."
      />
    );
    // Half the crop's 864 file pixels.
    expect(html).toContain("max-width:432px");
    expect(html).toContain('alt="The question"');
    expect(html).toContain("The question.</figcaption>");
    // A click shows the whole capture.
    expect(html).toContain("See the whole picture: The question");
  });

  it("shows the part of the capture its place is about", () => {
    const html = renderToStaticMarkup(
      <AiScreenshot slot={{ image: "31-start" }} alt="Start" caption="Start." />
    );
    expect(html).toContain("aspect-ratio:1670 / 1085");
    expect(html).toContain("max-width:835px");
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
