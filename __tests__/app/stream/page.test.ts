import { renderToStaticMarkup } from "react-dom/server";

import StreamPage, { generateMetadata } from "@/app/stream/page";

describe("/stream placeholder", () => {
  it("says Stream is being rebuilt and links to the 6529-works repository", () => {
    const html = renderToStaticMarkup(StreamPage());

    expect(html).toContain("<h1");
    expect(html).toContain("6529 Stream is being rebuilt.");
    expect(html).toContain(
      'href="https://github.com/6529-Collections/6529-works"'
    );
    expect(html).toContain("6529-works on GitHub");
    expect(html).not.toContain("/reviews/6529-stream");
  });

  it("is not indexed", () => {
    expect(generateMetadata().robots).toEqual({ index: false, follow: true });
  });
});
