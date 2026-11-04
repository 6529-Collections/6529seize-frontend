/** @jest-environment node */
import { VALIDATOR_GUIDE_FOLDS } from "@/lib/validator-page/content/guideMarkdown";
import { KEEP_ON_MINUTES } from "@/lib/validator-page/content/hardwareText";
import { VALIDATOR_KNOWN_ISSUES_MARKDOWN } from "@/lib/validator-page/content/knownIssuesMarkdown";
import {
  VALIDATOR_FEEDBACK_TEMPLATE,
  VALIDATOR_FEEDBACK_WAVE_HREF,
} from "@/lib/validator-page/content/pageText";

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
      "`validator 0.1.0-rc.6 (6a26503, TDH v1.4)`"
    );
  });

  it("shows rc.6's 18 known issues in order, the blank window among them", () => {
    const numbers = VALIDATOR_KNOWN_ISSUES_MARKDOWN.split("\n")
      .map((line) => /^(\d+)\. /.exec(line)?.[1])
      .filter((value): value is string => value !== undefined)
      .map(Number);
    expect(numbers).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    // B99: the app's window can go blank until rc.7.
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toMatch(
      /^8\. The app's window can go blank, white or black\./m
    );
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toContain("--mode rack");
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain(
      "Windows 10 on ARM can't run it."
    );
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain("commit `6a26503`");
  });

  it("keeps the computer on for the hardware page's time, with no random wait (D161)", () => {
    expect(fold("keep-it-awake")).toContain(
      `keep it awake for about ${KEEP_ON_MINUTES} minutes from 00:15 UTC`
    );
    for (const page of [GUIDE, VALIDATOR_KNOWN_ISSUES_MARKDOWN]) {
      expect(page).not.toMatch(/random|two hours|three hours|2 hours/i);
    }
  });

  it("carries the mainnet join test's timing and the test phase's machines", () => {
    const ready = fold("how-long-it-takes-to-be-ready");
    expect(ready).toContain("was ready in about 50 minutes");
    expect(ready).toContain("In 6529's test on 4 November");
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
