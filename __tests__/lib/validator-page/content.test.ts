/** @jest-environment node */
import {
  VALIDATOR_GUIDE_FOLDS,
  VALIDATOR_SWITCH,
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
import { RC9_COMMIT_FULL } from "./fixtures";

// The release the pages describe: its version and short commit, as
// `validator --version` prints them and the signed release list names them.
const RELEASE = "0.1.0-rc.9";
const COMMIT = RC9_COMMIT_FULL.slice(0, 7);
// From rc.9's light-client checkpoint: a new install must start before it.
const FRESH_INSTALL_UNTIL = "2026-11-22 01:30 UTC";
const LIGHT_CLIENT_CHECKPOINT = "2026-11-06 09:13 UTC";
// rc.9's join tests: the day, and the minutes to ready through Tor and with
// Tor off. fill-rc9.sh fills them, here and on the pages.
const JOIN_DATE = "{{RC9_JOIN_DATE}}";
const JOIN_TOR = "{{RC9_JOIN_TOR_MINUTES}}";
const JOIN_TOR_OFF = "{{RC9_JOIN_TOR_OFF_MINUTES}}";
// The facts above that are still placeholders. The pages may hold these and
// no other placeholder; once they are filled, none at all.
const STILL_TO_FILL = [JOIN_DATE, JOIN_TOR, JOIN_TOR_OFF].filter((fact) =>
  fact.startsWith("{{")
);

const GUIDE = [VALIDATOR_SWITCH, VALIDATOR_UPGRADE, ...VALIDATOR_GUIDE_FOLDS]
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
  // A release fact still to fill reads {{RC9_...}}, as the tester package's
  // drafts read <UPPER_CASE>. Only the ones STILL_TO_FILL names may be left;
  // fill them with fill-rc9.sh before merging.
  it.each([
    ["guide", GUIDE],
    ["known issues", VALIDATOR_KNOWN_ISSUES_MARKDOWN],
    ["hardware page", HARDWARE],
  ])(
    "the %s hold no release fact still to fill but rc.9's join tests",
    (_name, text) => {
      const rest = STILL_TO_FILL.reduce(
        (left, fact) => left.split(fact).join(""),
        text
      );
      expect(rest).not.toMatch(/\{\{|\}\}|<[A-Z][A-Z0-9_]*>/);
    }
  );

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

  it("tells a tester on rc.8 what to do differently, with the Mac steps the Mac lane tested", () => {
    expect(VALIDATOR_UPGRADE.id).toBe("upgrading");
    // Shown only while the signed list's newest release is this one.
    expect(VALIDATOR_UPGRADE.forVersion).toBe(RELEASE);
    expect(VALIDATOR_UPGRADE.title).toBe("Upgrading from rc.8");
    const upgrade = VALIDATOR_UPGRADE.markdown;
    expect(upgrade).toContain(
      "On Windows and Linux, install rc.9 over rc.8 the same way. There is nothing to uninstall first, and your key, your authorization and your records stay. A validator you stopped stays stopped."
    );
    // rc.8's Mac app can't quit itself, and Finder can't replace a running
    // app: stop the agent, quit, replace, open.
    const steps = upgrade
      .split("\n")
      .filter((line) => /^\d\. /.test(line))
      .map((line) => line.slice(0, 40));
    expect(steps).toEqual([
      "1. In Terminal, run `launchctl bootout g",
      "2. Quit 6529 Validator: **Quit app** in ",
      "3. Open the rc.9 download and drag the a",
      "4. Open 6529 Validator. It starts the va",
    ]);
    expect(upgrade).toContain(
      "`launchctl bootout gui/$(id -u)/io.6529.validator.agent`"
    );
    expect(upgrade).toContain("Cmd-Q doesn't work in rc.8.");
    expect(upgrade).toContain(
      'If the window says "The validator service is not running.", press **Start the validator service**.'
    );
    expect(upgrade).toContain(
      "From rc.9 on, steps 1 and 2 are one menu item: **Quit for an update**"
    );
    // rc.8's own upgrade note.
    expect(upgrade).not.toMatch(/rc\.7|127\.0\.0\.1|Quit 6529 Validator\*\*/);
  });

  it("says to update before Sunday's switch, as TESTERS.md does", () => {
    expect(VALIDATOR_SWITCH.forVersion).toBe(RELEASE);
    expect(VALIDATOR_SWITCH.id).toBe("update-before-sunday");
    expect(VALIDATOR_SWITCH.title).toBe(
      "Update before Sunday 8 November, 00:00 UTC"
    );
    const sunday = VALIDATOR_SWITCH.markdown;
    expect(sunday).toContain(
      "From then, signed TDH counts only on the new chain that rc.9 runs. rc.9 moves to it by itself at 00:00 UTC; until then it works as rc.8 does."
    );
    expect(sunday).toContain(
      "Sunday counts as agreed once accounts holding more than 2/3 of validating TDH run rc.9 and have signed."
    );
    expect(sunday).toContain("Nobody is penalized either way.");
    expect(sunday).toContain(
      "If you update on Sunday, do it before 18:00 UTC to sign that day."
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

  it("shows rc.9's 21 known issues in order", () => {
    const numbers = VALIDATOR_KNOWN_ISSUES_MARKDOWN.split("\n")
      .map((line) => /^(\d+)\. /.exec(line)?.[1])
      .filter((value): value is string => value !== undefined)
      .map(Number);
    expect(numbers).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain(
      `in ${RELEASE} of the 6529 validator (commit \`${COMMIT}\`)`
    );
    // Fixed: rc.7's slow peer and its block count stuck at 0, and rc.8's
    // day's total TDH, which Sunday's switch fixes.
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toMatch(
      /go blank|stays at 0|stops answering|Bridges come in|1\.1 million lower/
    );
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toContain("--mode rack");
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain(
      "Windows 10 on ARM can't run it."
    );
    expect(knownIssue(19)).toMatch(/^19\. The app's Log view reads/);
  });

  it("says a new install on Sunday waits for the evening's checkpoint", () => {
    expect(knownIssue(2)).toBe(
      "2. A new install on Sunday waits until Sunday's day is final and the update feed has its checkpoint, in the evening UTC."
    );
  });

  it("gives rc.9's Mac update: Quit for an update, and the way off rc.8", () => {
    const mac = knownIssue(10);
    expect(mac).toMatch(
      /^10\. On a Mac, dragging the new app over one that is running leaves the old release running, and Cmd-Q doesn't quit rc\.8\./
    );
    expect(mac).toContain(
      "Workaround: from rc.9 on, choose **Quit for an update** in the menu-bar logo's menu or the app's menu"
    );
    expect(mac).toContain(
      "first run `launchctl bootout gui/$(id -u)/io.6529.validator.agent` in Terminal"
    );
    expect(mac).toContain(
      "as [Upgrading from rc.8](/validator#upgrading) describes."
    );
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

  it("names the validator service as the app does", () => {
    const stop = fold("stop-pause-or-uninstall");
    expect(stop).toContain("**Stop the validator service**");
    expect(stop).toContain("**Start the validator service**");
    expect(stop).toContain("through restarts and updates too");
    for (const page of [GUIDE, VALIDATOR_KNOWN_ISSUES_MARKDOWN]) {
      expect(page).not.toMatch(/\*\*(?:Stop|Start) the validator\*\*/);
    }
  });

  it("gives one last day for a fresh install, from rc.9's light-client checkpoint", () => {
    expect(fold("known-issues")).toContain(
      `A new install must start before about ${FRESH_INSTALL_UNTIL}, and 0.1.0 stops signing on 1 December.`
    );
    expect(knownIssue(20)).toContain(
      `20. A new install must start before about ${FRESH_INSTALL_UNTIL}.`
    );
    expect(knownIssue(20)).toContain(
      `a checkpoint built into the release (${LIGHT_CLIENT_CHECKPOINT})`
    );
    // rc.7's and rc.8's dates.
    expect(`${GUIDE}\n${VALIDATOR_KNOWN_ISSUES_MARKDOWN}`).not.toMatch(
      /2026-11-20 14:00|2026-11-04 21:42|2026-11-21 20:00|2026-11-06 03:34/
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

  it("carries rc.9's join tests on the guide and the hardware page alike", () => {
    const ready = fold("how-long-it-takes-to-be-ready");
    expect(ready).toContain(
      `In 6529's tests of rc.9 on ${JOIN_DATE}, a new install was ready in about ${JOIN_TOR} minutes through Tor, and in about ${JOIN_TOR_OFF} with Tor off.`
    );
    expect(ready).toContain(
      "the checkpoint built into this release, from 5 November."
    );
    expect(ready).not.toMatch(/rc\.[678]|50 minutes|25 minutes/);
    expect(PARTS.find((part) => part.key === "first-start")?.why).toContain(
      `In 6529's tests of rc.9 on ${JOIN_DATE} this took about ${JOIN_TOR} minutes through Tor, and ${JOIN_TOR_OFF} with Tor off.`
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
