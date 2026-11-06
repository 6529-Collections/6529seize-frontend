/** @jest-environment node */
import {
  VALIDATOR_GUIDE_FOLDS,
  VALIDATOR_UPGRADE,
} from "@/lib/validator-page/content/guideMarkdown";
import {
  DATA_CENTER,
  KEEP_ON_MINUTES,
  PARTS,
  SOURCES,
} from "@/lib/validator-page/content/hardwareText";
import { VALIDATOR_KNOWN_ISSUES_MARKDOWN } from "@/lib/validator-page/content/knownIssuesMarkdown";
import {
  VALIDATOR_FEEDBACK_TEMPLATE,
  VALIDATOR_FEEDBACK_WAVE_HREF,
} from "@/lib/validator-page/content/pageText";

// The release the pages describe: its version and short commit, as
// `validator --version` prints them and the signed release list names them.
const RELEASE = "0.1.0-rc.8";
const COMMIT = "e53fcf3";
// From rc.8's light-client checkpoint: a new install must start before it.
const FRESH_INSTALL_UNTIL = "2026-11-21 20:00 UTC";
// rc.8's join tests: the day, and the minutes to ready through Tor and with
// Tor off.
const JOIN_DATE = "6 November";
const JOIN_TOR = "21";
const JOIN_TOR_OFF = "14";

const GUIDE = [VALIDATOR_UPGRADE, ...VALIDATOR_GUIDE_FOLDS]
  .map((fold) => fold.markdown)
  .join("\n\n");
const HARDWARE = [
  ...PARTS.map((part) => `${part.answer} ${part.why}`),
  ...DATA_CENTER.map((tier) => tier.note),
  ...SOURCES,
].join("\n");
const fold = (id: string) =>
  VALIDATOR_GUIDE_FOLDS.find((entry) => entry.id === id)?.markdown ?? "";
const knownIssue = (number: number) =>
  VALIDATOR_KNOWN_ISSUES_MARKDOWN.split("\n").find((line) =>
    line.startsWith(`${number}. `)
  ) ?? "";

describe("validator page text", () => {
  // A release fact still to fill reads {{RC8_...}}, as the tester package's
  // drafts read <UPPER_CASE>. Fill them all before merging.
  it.each([
    ["guide", GUIDE],
    ["known issues", VALIDATOR_KNOWN_ISSUES_MARKDOWN],
    ["hardware page", HARDWARE],
  ])("the %s hold no release fact still to fill", (_name, text) => {
    expect(text).not.toMatch(/\{\{|\}\}|<[A-Z][A-Z0-9_]*>/);
  });

  it.each([
    ["guide", GUIDE],
    ["known issues", VALIDATOR_KNOWN_ISSUES_MARKDOWN],
  ])("the %s hold no addresses or retired steps", (_name, text) => {
    // This repository is public: peer addresses stay off the page.
    expect(text).not.toMatch(/\/ip4\/|\/onion3\/|12D3Koo/);
    expect(text).not.toMatch(/replace_bootstrap|peers add/);
    expect(text).not.toMatch(/\brc\.[1-4]\b/);
    // The owner took these out: logs go to nobody by DM, and the page
    // makes no claims about ETH, staking, pay or who signs.
    expect(text).not.toMatch(/6529validators|encrypted DM|status --json/);
    expect(text).not.toMatch(/\bno ETH\b/);
    expect(text).not.toMatch(/nothing is staked|nobody is paid|only signer/i);
    expect(text).not.toContain("Report what you find");
  });

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

  it("tells a tester on rc.7 what to do differently, as the package does", () => {
    expect(VALIDATOR_UPGRADE.id).toBe("upgrading");
    // Shown only while the signed list's newest release is this one.
    expect(VALIDATOR_UPGRADE.forVersion).toBe(RELEASE);
    expect(VALIDATOR_UPGRADE.title).toBe("Upgrading from rc.7");
    const upgrade = VALIDATOR_UPGRADE.markdown;
    expect(upgrade).toContain(
      "Install rc.8 over rc.7, the same way. There is nothing to uninstall first, and your key, your authorization and your records stay."
    );
    // On a Mac, quit first: dragging over a running app keeps the old one.
    expect(upgrade).toContain(
      "On a Mac, quit the app first: choose **Quit 6529 Validator** in the app menu at the top of the screen if it is there, or else Force Quit it (Apple menu › Force Quit). Then drag the new one to Applications and open it from there."
    );
    expect(upgrade).toContain("A validator you stopped stays stopped.");
    // The page's port is drawn once (B130), so an old bookmark breaks.
    expect(upgrade).toContain(
      "The validator's page has a new address on this computer. Open it from the app, or with `validator open` on Linux."
    );
  });

  it("keeps every validator command per system, since the Mac app is not on the PATH", () => {
    const outsideTables = GUIDE.split("\n").filter(
      (line) => !line.startsWith("|")
    );
    expect(outsideTables.join("\n")).not.toMatch(
      /`validator (?:--version|update|status)/
    );
    expect(fold("where-it-lives")).toContain(
      '`"/Applications/6529 Validator.app/Contents/Resources/validator" --version`'
    );
    expect(fold("where-it-lives")).toContain(
      `\`validator ${RELEASE} (${COMMIT}, TDH v1.4)\``
    );
  });

  it("shows rc.8's 21 known issues in order", () => {
    const numbers = VALIDATOR_KNOWN_ISSUES_MARKDOWN.split("\n")
      .map((line) => /^(\d+)\. /.exec(line)?.[1])
      .filter((value): value is string => value !== undefined)
      .map(Number);
    expect(numbers).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain(
      `in ${RELEASE} of the 6529 validator (commit \`${COMMIT}\`)`
    );
    // rc.8 fixes these: rc.7's slow peer and its block count stuck at 0.
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toMatch(
      /go blank|stays at 0|stops answering|Bridges come in/
    );
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toContain("--mode rack");
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain(
      "Windows 10 on ARM can't run it."
    );
    expect(knownIssue(18)).toMatch(/^18\. The app's Log view reads/);
  });

  it("says what rc.8 does where Tor is blocked: bridges first, Connect without Tor last and what it gives away", () => {
    const tor = knownIssue(1);
    expect(tor).toMatch(/^1\. Tor's built-in bridges are public/);
    const service = tor.indexOf("the Tor Project's bridge service");
    const without = tor.indexOf("Connect without Tor on this network");
    expect(service).toBeGreaterThan(-1);
    expect(without).toBeGreaterThan(service);
    expect(tor).toContain(
      "It asks first: peers and Ethereum servers then see this network's IP address."
    );
    // A bridge line of your own, or another network, before going without Tor.
    expect(tor).toContain(
      "Workaround: add a bridge line of your own in Settings › Privacy, or use another network."
    );
    expect(tor).toContain(
      "On macOS 11 there are no bridges (lyrebird needs macOS 12)"
    );
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toMatch(/turn Tor off there/);
  });

  it("names the validator service as rc.8's app does", () => {
    const stop = fold("stop-pause-or-uninstall");
    expect(stop).toContain("**Stop the validator service**");
    expect(stop).toContain("**Start the validator service**");
    expect(stop).toContain("through restarts and updates too");
    for (const page of [GUIDE, VALIDATOR_KNOWN_ISSUES_MARKDOWN]) {
      expect(page).not.toMatch(/\*\*(?:Stop|Start) the validator\*\*/);
    }
  });

  it("gives one last day for a fresh install, from rc.8's light-client checkpoint", () => {
    expect(fold("known-issues")).toContain(
      `A new install must start before about ${FRESH_INSTALL_UNTIL}, and 0.1.0 stops signing on 1 December.`
    );
    expect(knownIssue(20)).toContain(
      `20. A new install must start before about ${FRESH_INSTALL_UNTIL}.`
    );
    // rc.7's dates.
    expect(`${GUIDE}\n${VALIDATOR_KNOWN_ISSUES_MARKDOWN}`).not.toMatch(
      /2026-11-20 14:00|2026-11-04 21:42/
    );
  });

  it("says the day's total TDH is lower than 6529.io's until rc.9, with no holder's TDH different", () => {
    expect(knownIssue(19)).toContain(
      "19. A day's total TDH on the validator's pages is about 1.1 million lower than on 6529.io."
    );
    expect(knownIssue(19)).toContain("No holder's own TDH differs, and signing is not affected");
  });

  it("keeps the computer on for the hardware page's time, with no random wait (D161)", () => {
    expect(fold("keep-it-awake")).toContain(
      `keep it awake for about ${KEEP_ON_MINUTES} minutes from 00:15 UTC`
    );
    for (const page of [GUIDE, VALIDATOR_KNOWN_ISSUES_MARKDOWN]) {
      expect(page).not.toMatch(/random|two hours|three hours|2 hours/i);
    }
  });

  it("carries rc.8's join tests on the guide and the hardware page alike", () => {
    const ready = fold("how-long-it-takes-to-be-ready");
    expect(ready).toContain(
      `In 6529's tests of rc.8 on ${JOIN_DATE}, a new install was ready in about ${JOIN_TOR} minutes through Tor, and in about ${JOIN_TOR_OFF} with Tor off.`
    );
    expect(ready).toContain(
      "the checkpoint built into this release, from 5 November."
    );
    expect(ready).not.toMatch(/rc\.[67]|50 minutes|25 minutes/);
    expect(PARTS.find((part) => part.key === "first-start")?.why).toContain(
      `In 6529's tests of rc.8 on ${JOIN_DATE} this took about ${JOIN_TOR} minutes through Tor, and ${JOIN_TOR_OFF} with Tor off.`
    );
    expect(SOURCES.join("\n")).toContain(
      `The first start: 6529's join tests of the test release (${RELEASE}, commit ${COMMIT}) on ${JOIN_DATE} 2026`
    );
  });

  it("says a data center with Tor off needs no peer added (rc.8's install guide)", () => {
    const rack = DATA_CENTER.find((tier) => tier.key === "rack")?.note ?? "";
    expect(rack).toContain(
      "With Tor off, it reaches 6529's Bootstraps by their IP addresses, so you add no peer."
    );
    expect(HARDWARE).not.toContain("a peer's address from 6529");
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
