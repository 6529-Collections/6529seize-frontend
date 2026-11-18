/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import ValidatorAllFiles from "@/components/validator-page/ValidatorAllFiles";
import { parseReleaseFeed } from "@/lib/validator-page/releaseFeed";

import { TEST_FEED } from "../../lib/validator-page/fixtures";

const release = parseReleaseFeed(TEST_FEED).find(
  (entry) => entry.version === "0.1.0-test.2"
)!;

/**
 * The text of server-rendered markup: tags and React text separators are
 * dropped, repeating until nothing is left to drop.
 */
const textOf = (markup: string): string => {
  let text = markup.replaceAll("<!-- -->", "");
  let previous: string;
  do {
    previous = text;
    text = text.replaceAll(/<[^>]+>/g, "");
  } while (text !== previous);
  return text;
};

describe("ValidatorAllFiles copy", () => {
  const html = renderToStaticMarkup(<ValidatorAllFiles release={release} />);

  it("names the publisher column in the header and in each card label", () => {
    expect(html).toMatch(/<th scope="col"[^>]*>Publisher<\/th>/);
    expect(html).toMatch(/<span class="[^"]*lg:tw-hidden">Publisher<\/span>/);
  });

  it("names each card cell for screen readers where the header row is hidden", () => {
    // Below 1024 px the header row is display: none, so the cell labels are
    // what names each value; from 1024 px they are display: none instead,
    // so a column name is never read twice.
    expect(html).toMatch(/<thead class="max-lg:tw-hidden">/);
    const labels = [
      ...html.matchAll(/<span([^>]*)>(Size|SHA-256|Publisher)<\/span>/g),
    ];
    expect(labels.length).toBeGreaterThan(0);
    for (const [, attributes] of labels) {
      expect(attributes).not.toContain("aria-hidden");
      expect(attributes).toMatch(/ lg:tw-hidden"$/);
    }
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

  it("keeps the table headers, card labels and link text", () => {
    const headers = [...html.matchAll(/<th scope="col"[^>]*>(.*?)<\/th>/g)].map(
      (match) => match[1]
    );
    expect(headers).toEqual([
      "File",
      "Size",
      "SHA-256",
      "Publisher",
      '<span class="tw-sr-only">Download</span>',
    ]);
    expect(html).toMatch(/<span class="[^"]*lg:tw-hidden">Size<\/span>/);
    expect(html).toMatch(/<span class="[^"]*lg:tw-hidden">SHA-256<\/span>/);
    expect(html).toContain(
      'aria-label="Copy SHA-256 of 6529-Validator-0.1.0.dmg"'
    );
    expect(html).toMatch(/<\/svg>Download<\/a>/);
  });

  it("keeps the build line, the check steps and the SHA256SUMS block", () => {
    const text = textOf(html);
    expect(text).toContain(
      "Build 0.1.0-test.2, published 2026-11-02, commit aaaaaaa. Earlier builds are under Releases."
    );
    expect(html).toContain(">Check a file</h3>");
    expect(text).toContain(
      "In the folder with the file, run the command for your system and compare what it prints with the SHA-256 above. Windows prints capital letters; the letters and digits must match. If they differ, delete the file."
    );
    expect(text).toContain("Mac, in Terminal");
    expect(text).toContain("Windows, in PowerShell");
    expect(text).toContain("Linuxsha256sum 6529-validator_0.1.0_amd64.deb");
    expect(html).toContain('aria-label="Download SHA256SUMS"');
    expect(text).toContain(
      "It lists the SHA-256 of every file. On Linux, in a folder with it and your downloads, run sha256sum --check --ignore-missing SHA256SUMS to check them all. 6529 also signs the list of releases, and your validator checks that signature before it tells you about a new one."
    );
  });

  it("leaves the commit out when the release has none", () => {
    const text = textOf(
      renderToStaticMarkup(
        <ValidatorAllFiles release={{ ...release, commit: null }} />
      )
    );
    expect(text).toContain(
      "Build 0.1.0-test.2, published 2026-11-02. Earlier builds are under Releases."
    );
  });
});
