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
    expect(html).toMatch(/<span aria-hidden="true"[^>]*>Size<\/span>/);
    expect(html).toMatch(/<span aria-hidden="true"[^>]*>SHA-256<\/span>/);
    expect(html).toContain(
      'aria-label="Copy SHA-256 of 6529-Validator-0.1.0.dmg"'
    );
    expect(html).toMatch(/<\/svg>Download<\/a>/);
  });

  it("keeps the build line, the check steps and the SHA256SUMS block", () => {
    const text = html.replaceAll("<!-- -->", "").replaceAll(/<[^>]+>/g, "");
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
    const text = renderToStaticMarkup(
      <ValidatorAllFiles release={{ ...release, commit: null }} />
    )
      .replaceAll("<!-- -->", "")
      .replaceAll(/<[^>]+>/g, "");
    expect(text).toContain(
      "Build 0.1.0-test.2, published 2026-11-02. Earlier builds are under Releases."
    );
  });
});
