/** @jest-environment node */
import { VALIDATOR_GUIDE_MARKDOWN } from "@/lib/validator-page/content/guideMarkdown";
import { VALIDATOR_KNOWN_ISSUES_MARKDOWN } from "@/lib/validator-page/content/knownIssuesMarkdown";

describe("validator page text", () => {
  it.each([
    ["guide", VALIDATOR_GUIDE_MARKDOWN],
    ["known issues", VALIDATOR_KNOWN_ISSUES_MARKDOWN],
  ])(
    "the %s hold no addresses, placeholders or retired peer steps",
    (_name, text) => {
      // This repository is public: peer addresses stay off the page.
      expect(text).not.toMatch(/\/ip4\/|\/onion3\/|12D3Koo/);
      expect(text).not.toMatch(
        /\{\{|<SHORT_COMMIT>|<CHECK_DATE>|<HISTORY_MINUTES>/
      );
      expect(text).not.toMatch(/replace_bootstrap|peers add/);
      expect(text).not.toMatch(/\brc\.[1-4]\b/);
    }
  );

  it("gives every validator command per system, since the Mac app is not on the PATH", () => {
    const outsideTables = VALIDATOR_GUIDE_MARKDOWN.split("\n").filter(
      (line) => !line.startsWith("|")
    );
    expect(outsideTables.join("\n")).not.toMatch(
      /`validator (?:--version|update|status)/
    );
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain(
      '`"/Applications/6529 Validator.app/Contents/Resources/validator" update check`'
    );
  });

  it("shows rc.5's version line and its 23 known issues in order", () => {
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain(
      "`validator 0.1.0-rc.5 (29a8caf, TDH v1.4)`"
    );
    const numbers = VALIDATOR_KNOWN_ISSUES_MARKDOWN.split("\n")
      .map((line) => /^(\d+)\. /.exec(line)?.[1])
      .filter((value): value is string => value !== undefined)
      .map(Number);
    expect(numbers).toEqual(Array.from({ length: 23 }, (_, i) => i + 1));
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toMatch(
      /^18\. On a Mac where the validator was set up as a system service/m
    );
  });

  it("carries the mainnet join test's timing and the datacenter mode", () => {
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain(
      "a fresh install was ready about 50 minutes after it started"
    );
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain("`--mode datacenter`");
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toContain("--mode rack");
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toMatch(
      /^3\. Rebuild and match can take 30 minutes or more/m
    );
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toMatch(/serve none/);
  });

  it("names every rc.5 file by system and CPU, and the .deb per CPU", () => {
    const download = VALIDATOR_GUIDE_MARKDOWN.slice(
      VALIDATOR_GUIDE_MARKDOWN.indexOf("## Download and check"),
      VALIDATOR_GUIDE_MARKDOWN.indexOf("## Install")
    );
    for (const name of [
      "6529-Validator-0.1.0.dmg",
      "6529-Validator-Setup-0.1.0-x64.exe",
      "6529-Validator-0.1.0-x64.msi",
      "6529-validator_0.1.0_amd64.deb",
      "6529-validator_0.1.0_arm64.deb",
      "6529-Validator-0.1.0-x86_64.AppImage",
      "validator-0.1.0-aarch64-apple-darwin.tar.gz",
      "validator-0.1.0-x86_64-apple-darwin.tar.gz",
      "validator-0.1.0-aarch64-unknown-linux-gnu.tar.gz",
      "validator-0.1.0-x86_64-unknown-linux-gnu.tar.gz",
      "validator-0.1.0-x86_64-pc-windows-msvc.zip",
      "SHA256SUMS",
      "release.json",
    ]) {
      expect(download).toContain(`\`${name}\``);
    }
    expect(download).toContain(
      "| Another Linux desktop | x86-64 only | `6529-Validator-0.1.0-x86_64.AppImage` |"
    );
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain(
      "On ARM64, a Raspberry Pi among them, run `sudo apt install ./6529-validator_0.1.0_arm64.deb`."
    );
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain("- AppImage (x86-64 only):");
  });

  it("keeps the owner's line word for word and names the DM account", () => {
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain(
      "6529 never starts a DM with you or asks for a seed phrase."
    );
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain("6529validators");
  });
});
