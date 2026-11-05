/** @jest-environment node */
import { VALIDATOR_GUIDE_FOLDS } from "@/lib/validator-page/content/guideMarkdown";
import {
  KEEP_ON_MINUTES,
  PARTS,
} from "@/lib/validator-page/content/hardwareText";
import { VALIDATOR_KNOWN_ISSUES_MARKDOWN } from "@/lib/validator-page/content/knownIssuesMarkdown";
import {
  VALIDATOR_FEEDBACK_TEMPLATE,
  VALIDATOR_FEEDBACK_WAVE_HREF,
} from "@/lib/validator-page/content/pageText";

// The release the pages describe: its version and short commit, as
// `validator --version` prints them and the signed release list names them.
const RELEASE = "0.1.0-rc.7";
const COMMIT = "214e228";

const GUIDE = VALIDATOR_GUIDE_FOLDS.map((fold) => fold.markdown).join("\n\n");
const fold = (id: string) =>
  VALIDATOR_GUIDE_FOLDS.find((entry) => entry.id === id)?.markdown ?? "";

describe("validator page text", () => {
  it.each([
    ["guide", GUIDE],
    ["known issues", VALIDATOR_KNOWN_ISSUES_MARKDOWN],
  ])(
    "the %s hold no addresses, placeholders or retired steps",
    (_name, text) => {
      // This repository is public: peer addresses stay off the page.
      expect(text).not.toMatch(/\/ip4\/|\/onion3\/|12D3Koo/);
      expect(text).not.toMatch(
        /\{\{|<SHORT_COMMIT>|<CHECK_DATE>|<HISTORY_MINUTES>/
      );
      expect(text).not.toMatch(/replace_bootstrap|peers add/);
      expect(text).not.toMatch(/\brc\.[1-4]\b/);
      // The owner took these out: logs go to nobody by DM, and the page
      // makes no claims about ETH, staking, pay or who signs.
      expect(text).not.toMatch(/6529validators|encrypted DM|status --json/);
      expect(text).not.toMatch(/\bno ETH\b/);
      expect(text).not.toMatch(/nothing is staked|nobody is paid|only signer/i);
      expect(text).not.toContain("Report what you find");
    }
  );

  it("folds the guide's deeper sections in the order of the package", () => {
    expect(VALIDATOR_GUIDE_FOLDS.map((entry) => entry.title)).toEqual([
      "Keep it awake",
      "How long it takes to be ready",
      "Where it lives",
      "Stop, pause or uninstall",
      "Updates",
      "Your key",
      "Linux and the terminal",
      "Known issues",
    ]);
  });

  it("keeps every validator command per system, since the Mac app is not on the PATH", () => {
    const outsideTables = GUIDE.split("\n").filter(
      (line) => !line.startsWith("|")
    );
    expect(outsideTables.join("\n")).not.toMatch(
      /`validator (?:--version|update|status)/
    );
    expect(fold("updates")).toContain(
      '`"/Applications/6529 Validator.app/Contents/Resources/validator" update check`'
    );
    expect(fold("where-it-lives")).toContain(
      `\`validator ${RELEASE} (${COMMIT}, TDH v1.4)\``
    );
  });

  it("shows rc.7's 20 known issues in order, with no blank window", () => {
    const numbers = VALIDATOR_KNOWN_ISSUES_MARKDOWN.split("\n")
      .map((line) => /^(\d+)\. /.exec(line)?.[1])
      .filter((value): value is string => value !== undefined)
      .map(Number);
    expect(numbers).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain(
      `in ${RELEASE} of the 6529 validator (commit \`${COMMIT}\`)`
    );
    // B99 is fixed in rc.7: a page that stops comes back by itself.
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toMatch(/go blank/);
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toContain("--mode rack");
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain(
      "Windows 10 on ARM can't run it."
    );
  });

  it("says what rc.7 does where Tor is blocked, and nothing it lacks", () => {
    const tor =
      VALIDATOR_KNOWN_ISSUES_MARKDOWN.split("\n").find((line) =>
        line.startsWith("3. ")
      ) ?? "";
    expect(tor).toMatch(
      /^3\. On a network that blocks Tor, the page opens, says Tor is blocked, and keeps trying\. Bridges come in rc\.8\. /
    );
    // Bridge lines by hand come before Tor off, which says what it gives away.
    const bridges = tor.indexOf(
      "add bridge lines by hand in Settings › Privacy"
    );
    const torOff = tor.indexOf("As a last resort, turn Tor off there.");
    expect(bridges).toBeGreaterThan(-1);
    expect(torOff).toBeGreaterThan(bridges);
    expect(tor).toMatch(
      /turn Tor off there\. Peers and Ethereum servers then see this network's IP address\.$/
    );
    // rc.7 carries no bridge programs and has no Connect without Tor.
    for (const page of [GUIDE, VALIDATOR_KNOWN_ISSUES_MARKDOWN]) {
      expect(page).not.toMatch(/connect without tor/i);
      expect(page).not.toMatch(/snowflake|obfs4|webtunnel|lyrebird/i);
    }
  });

  it("names the validator service as rc.7's app and Windows do", () => {
    const stop = fold("stop-pause-or-uninstall");
    expect(stop).toContain("**Stop the validator service**");
    expect(stop).toContain("**Start the validator service**");
    expect(stop).toContain(
      "On Windows, Services and Task Manager list the part that signs as 6529 Validator service."
    );
    for (const page of [GUIDE, VALIDATOR_KNOWN_ISSUES_MARKDOWN]) {
      expect(page).not.toMatch(/\*\*(?:Stop|Start) the validator\*\*/);
    }
    expect(fold("updates")).toContain(
      "On Windows, from rc.7 the installer replaces any earlier test release"
    );
  });

  it("gives one last day for a fresh install, from rc.7's light-client checkpoint", () => {
    expect(fold("known-issues")).toContain(
      "a new install must start before about 2026-11-20 14:00 UTC"
    );
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain(
      "19. A new install must start before about 2026-11-20 14:00 UTC."
    );
    expect(`${GUIDE}\n${VALIDATOR_KNOWN_ISSUES_MARKDOWN}`).not.toContain(
      "2026-11-19"
    );
  });

  it("keeps the computer on for the hardware page's time, with no random wait (D161)", () => {
    expect(fold("keep-it-awake")).toContain(
      `keep it awake for about ${KEEP_ON_MINUTES} minutes from 00:15 UTC`
    );
    for (const page of [GUIDE, VALIDATOR_KNOWN_ISSUES_MARKDOWN]) {
      expect(page).not.toMatch(/random|two hours|three hours|2 hours/i);
    }
  });

  it("carries rc.7's join tests' timing and the test phase's machines", () => {
    const ready = fold("how-long-it-takes-to-be-ready");
    expect(ready).toContain("In 6529's tests of rc.7 on 5 November");
    expect(ready).toContain(
      "Through Tor it was ready in about 25 minutes: 1 to find the agreed day, 6 to download the history and 17 to rebuild and match it. With Tor off it was ready in about 10 minutes."
    );
    expect(ready).not.toMatch(/50 minutes|rc\.6/);
    // Known issue 2 gives the same step's time, and the hardware page the
    // same first start.
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain(
      "In 6529's tests of rc.7 on 5 November the step took 17 minutes through Tor, and 9 with Tor off."
    );
    expect(PARTS.find((part) => part.key === "first-start")?.why).toContain(
      "In 6529's tests of rc.7 on 5 November this took about 25 minutes through Tor, and 10 with Tor off."
    );
    expect(ready).toContain(
      "the checkpoint built into this release, from 4 November."
    );
    expect(ready).toContain(
      "In the test phase, 6529 runs validators and sentries on AWS in the United States, Germany and Singapore. The goal is a network that many holders run, at home and in offices."
    );
  });

  it("gives the Linux steps with both .deb files and the glibc floor", () => {
    const linux = fold("linux-and-the-terminal");
    expect(linux).toContain("glibc 2.35 or newer");
    expect(linux).toContain(
      "\nsudo apt install ./6529-validator_0.1.0_amd64.deb\n"
    );
    expect(linux).toContain(
      "\nsudo apt install ./6529-validator_0.1.0_arm64.deb\n"
    );
    expect(fold("known-issues")).toContain(
      "The [known issues](/validator/known-issues) list each one"
    );
  });

  it("links the feedback wave by the app's own route, with the owner's template", () => {
    expect(VALIDATOR_FEEDBACK_WAVE_HREF).toBe(
      "/waves/3c1072f4-4f74-4657-8ad2-c7acf3c9c36d"
    );
    expect(VALIDATOR_FEEDBACK_TEMPLATE.split("\n")).toEqual([
      "Computer and system:",
      "File installed:",
      "Home or data center:",
      "Tor, on or off:",
      "What happened:",
      "Times, in UTC:",
    ]);
  });
});
