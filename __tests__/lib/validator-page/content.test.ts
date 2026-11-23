/** @jest-environment node */
import { VALIDATOR_KNOWN_ISSUES_MARKDOWN } from "@/lib/validator-page/content/knownIssuesMarkdown";
import {
  VALIDATOR_FEEDBACK_TEMPLATE,
  VALIDATOR_FEEDBACK_WAVE_HREF,
} from "@/lib/validator-page/content/pageText";
import { RC10_COMMIT_FULL } from "./fixtures";

// The release the pages describe: its version and short commit, as
// `validator --version` prints them and the signed release list names them.
const RELEASE = "0.1.0-rc.10";
const COMMIT = RC10_COMMIT_FULL.slice(0, 7);
// From rc.10's light-client checkpoint: a new install must start before it.
const FRESH_INSTALL_UNTIL = "2026-11-23 03:30 UTC";
const LIGHT_CLIENT_CHECKPOINT = "2026-11-07 11:02 UTC";
// rc.10's join tests: the day, and the minutes to ready through Tor and with
// Tor off. fill-rc10.sh fills them, here and on the pages.
const JOIN_DATE = "7 November";
const JOIN_TOR = "21";
const JOIN_TOR_OFF = "16";
// The facts above that are still placeholders. The pages may hold these and
// no other placeholder; once they are filled, none at all.
const STILL_TO_FILL = [JOIN_DATE, JOIN_TOR, JOIN_TOR_OFF].filter((fact) =>
  fact.startsWith("{{")
);

const knownIssue = (number: number) =>
  VALIDATOR_KNOWN_ISSUES_MARKDOWN.split("\n").find((line) =>
    line.startsWith(`${number}. `)
  ) ?? "";

describe("validator page text", () => {
  // A release fact still to fill reads {{RC10_...}}, as the tester package's
  // drafts read <UPPER_CASE>. Only the ones STILL_TO_FILL names may be left;
  // fill them with fill-rc10.sh before merging.
  it.each([["known issues", VALIDATOR_KNOWN_ISSUES_MARKDOWN]])(
    "the %s hold no release fact still to fill but rc.10's join tests",
    (_name, text) => {
      const rest = STILL_TO_FILL.reduce(
        (left, fact) => left.split(fact).join(""),
        text
      );
      expect(rest).not.toMatch(/\{\{|\}\}|<[A-Z][A-Z0-9_]*>/);
    }
  );

  it.each([["known issues", VALIDATOR_KNOWN_ISSUES_MARKDOWN]])(
    "the %s hold no addresses or retired steps",
    (_name, text) => {
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
    }
  );

  it("shows rc.10's 24 known issues in order", () => {
    const numbers = VALIDATOR_KNOWN_ISSUES_MARKDOWN.split("\n")
      .map((line) => /^(\d+)\. /.exec(line)?.[1])
      .filter((value): value is string => value !== undefined)
      .map(Number);
    expect(numbers).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain(
      `in ${RELEASE} of the 6529 validator (commit \`${COMMIT}\`)`
    );
    // Fixed: rc.7's slow peer and its block count stuck at 0, rc.8's day's
    // total TDH, which Sunday's switch fixes, and rc.9's menu-bar logo on
    // macOS 26.
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toMatch(
      /go blank|stays at 0|stops answering|Bridges come in|1\.1 million lower|macOS 26/
    );
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toContain("--mode rack");
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toContain(
      "Windows 10 on ARM can't run it."
    );
    expect(knownIssue(22)).toMatch(/^22\. The app's Log view reads/);
  });

  it("says a new install on Sunday waits for the evening's checkpoint", () => {
    expect(knownIssue(2)).toBe(
      "2. A new install on Sunday waits until Sunday's day is final and the update feed has its checkpoint, in the evening UTC. Workaround: install before Sunday, 00:00 UTC."
    );
  });

  it("names rc.10's installers, and says rc.8 or older no longer counts from Sunday", () => {
    expect(knownIssue(7)).toMatch(
      /^7\. On Windows, running rc\.10's Setup\.exe after rc\.10's `\.msi` shows two/
    );
    const back = knownIssue(11);
    expect(back).toMatch(
      /^11\. Going back to rc\.8 or older doesn't help from Sunday 8 November, 00:00 UTC: their signatures don't count on the new chain\./
    );
    expect(back).toContain(
      "Going back to rc.7 or earlier also starts a validator you stopped"
    );
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toMatch(
      /rc\.[89]'s Setup\.exe|from rc\.8 to rc\.7/
    );
  });

  it("says what to do when Setup.exe finds the validator's files in use", () => {
    expect(knownIssue(8)).toBe(
      '8. On Windows, Setup.exe may show "Files in use" with the 6529 Validator service; Retry shows the same window again. Workaround: press Ignore. If Setup stops with "Error writing to file: …\\validator.exe", stop the validator from 6529\'s logo menu, quit the app and press Retry.'
    );
  });

  it("says Setup and Update now show command windows that close by themselves (the coordinator's words)", () => {
    expect(knownIssue(9)).toBe(
      "9. On Windows, Setup and Update now briefly show two or three command windows while installing. They close by themselves."
    );
  });

  it("says a Windows update held by security software waits for a restart (the coordinator's words)", () => {
    expect(knownIssue(10)).toBe(
      "10. On Windows, if security software holds the validator's program during an update, Setup asks for a restart. Until Windows restarts, the release before keeps running, and Update now says so."
    );
  });

  it("gives rc.10's Mac update: Update now, or Quit for an update by hand", () => {
    const mac = knownIssue(13);
    expect(mac).toMatch(
      /^13\. On a Mac, dragging the new app over one that is running leaves the old release running\. Workaround: from rc\.10 on, use \*\*Update now\*\* on the Update page/
    );
    expect(mac).toContain(
      "first choose **Quit for an update** in the menu-bar logo's menu or the app's menu"
    );
    expect(mac).toContain(
      "follow the steps in [Upgrading from rc.9](/validator#upgrading)."
    );
    // The last item under Install and download.
    const install =
      VALIDATOR_KNOWN_ISSUES_MARKDOWN.split("## Running")[0]
        ?.trimEnd()
        .split("\n") ?? [];
    expect(install[install.length - 1]).toBe(mac);
  });

  it("says what the validator does where Tor is blocked: bridges first, Connect without Tor last and what it gives away", () => {
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
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toMatch(
      /\*\*(?:Stop|Start) the validator\*\*/
    );
  });

  it("gives one last day for a fresh install, from rc.10's light-client checkpoint", () => {
    expect(knownIssue(23)).toContain(
      `23. A new install must start before about ${FRESH_INSTALL_UNTIL}.`
    );
    expect(knownIssue(23)).toContain(
      `a checkpoint built into the release (${LIGHT_CLIENT_CHECKPOINT})`
    );
    // rc.7's, rc.8's and rc.9's dates.
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).not.toMatch(
      /2026-11-20 14:00|2026-11-04 21:42|2026-11-21 20:00|2026-11-06 03:34|2026-11-22 0[13]:30|2026-11-06 (09:13|11:09)/
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
