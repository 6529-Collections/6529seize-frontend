/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import ValidatorAllFiles from "@/components/validator-page/ValidatorAllFiles";
import { parseReleaseFeed } from "@/lib/validator-page/releaseFeed";

import { TEST_FEED } from "../../lib/validator-page/fixtures";

const release = parseReleaseFeed(TEST_FEED).find(
  (entry) => entry.version === "0.1.0-test.2"
)!;

describe("ValidatorAllFiles copy", () => {
  const html = renderToStaticMarkup(<ValidatorAllFiles release={release} />);

  it("names the publisher column in the header and in each card label", () => {
    expect(html).toMatch(/<th scope="col"[^>]*>Publisher<\/th>/);
    expect(html).toMatch(/<span aria-hidden="true"[^>]*>Publisher<\/span>/);
  });

  it("shows None for files without a code signature", () => {
    expect(html).toContain("<span>None</span>");
  });

  it("explains where each SHA-256 comes from", () => {
    expect(html).toContain(
      "Each SHA-256 comes from 6529&#x27;s signed list of releases. This page checks that signature before it lists a file."
    );
  });

  it("labels each download link with its file name", () => {
    expect(html).toContain('aria-label="Download 6529-Validator-0.1.0.dmg"');
  });
});
