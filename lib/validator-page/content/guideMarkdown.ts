// The tester guide's closed sections at /validator/guide, as Markdown. Built
// from the tester package: the sections under "More" in TESTERS.md, its
// note for testers upgrading from the last release, and its section on
// Sunday's switch.
//
// Release facts still to fill have the form {{RC10_...}} (fill-rc10.sh);
// the page tests allow only the ones they name as still to fill.

const joinMarkdown = (lines: readonly string[]) => lines.join("\n");

type ValidatorGuideFold = {
  readonly id: string;
  readonly title: string;
  readonly markdown: string;
};

/** A note the pages show only while the signed list offers `forVersion`. */
export type ValidatorReleaseNote = ValidatorGuideFold & {
  readonly forVersion: string;
};

/**
 * For a tester who runs the last release: what to do differently. From
 * rc.9, the Mac's Quit for an update; from rc.8 or older, the steps the Mac
 * lane tested on 6 November.
 */
export const VALIDATOR_UPGRADE: ValidatorReleaseNote = {
  forVersion: "0.1.0-rc.10",
  id: "upgrading",
  title: "Upgrading from rc.9",
  markdown: joinMarkdown([
    "On Windows and Linux, install rc.10 over rc.9 the same way. There is nothing to uninstall first, and your key, your authorization and your records stay. A validator you stopped stays stopped.",
    "",
    "On Windows, Setup.exe stops the validator and closes the app before it writes, then starts the validator on rc.10. If it shows \"Files in use\" naming the 6529 Validator service, press **Ignore**: Setup stops the service itself. Close any `validator` command you left running in a terminal first. When it's done, open the app from the Start menu, or press **Launch** on Setup's last page.",
    "",
    "On a Mac:",
    "",
    "1. Choose **Quit for an update** in the menu-bar logo's menu or the app's menu at the top of the screen.",
    "2. Open the rc.10 download and drag the app to Applications, choosing **Replace**.",
    '3. Open 6529 Validator. It starts the validator on rc.10 by itself. If the window says "The validator service is not running.", press **Start the validator service**.',
    "",
    "From rc.10 on, **Update now** on the Update page installs the next release for you.",
    "",
    "### If you're upgrading from rc.8 or older",
    "",
    "Update before Sunday 8 November, 00:00 UTC. On Windows and Linux, it works as from rc.9. On a Mac, rc.8 has no Quit for an update:",
    "",
    "1. In Terminal, run `launchctl bootout gui/$(id -u)/io.6529.validator.agent`. This stops the validator, so Finder can replace the app.",
    "2. Quit 6529 Validator: **Quit app** in the logo's menu, or Force Quit (Option-Command-Esc). Cmd-Q doesn't work in rc.8.",
    "3. Open the rc.10 download, drag the app to Applications, choosing **Replace**, and open it.",
  ]),
};

/**
 * Sunday's switch to the new chain, 8 November, above the upgrade note:
 * TESTERS.md's section, and the release notes' line for a tester who
 * updates on Sunday.
 */
export const VALIDATOR_SWITCH: ValidatorReleaseNote = {
  forVersion: "0.1.0-rc.10",
  id: "sundays-switch",
  title: "Sunday's switch",
  markdown: joinMarkdown([
    "rc.10 runs Sunday's switch exactly as rc.9 does. From Sunday 8 November, 00:00 UTC, signed TDH counts only on the new chain, and both releases move to it by themselves.",
    "",
    "- If you run rc.9, you don't need to update before Sunday.",
    "- If you run rc.8 or older, update before Sunday 8 November, 00:00 UTC, to rc.9 or rc.10.",
    "",
    "Sunday counts as agreed once accounts holding more than 2/3 of validating TDH run rc.9 or rc.10 and have signed. Accounts still on rc.8 keep counting toward that total for seven days after their last vote, so if you run rc.8 or older, please update on Saturday. If the line isn't reached on Sunday, the day ends final but not agreed, and the first agreed day comes when it is. Nobody is penalized either way.",
    "",
    "If you update on Sunday, do it before 18:00 UTC to sign that day. Later than that, your key starts on Monday, and Sunday never shows as missed.",
  ]),
};

export const VALIDATOR_GUIDE_FOLDS: readonly ValidatorGuideFold[] = [
  {
    id: "keep-it-awake",
    title: "Keep it awake",
    markdown: joinMarkdown([
      "The validator signs while the computer is awake, until signing closes at 19:00 UTC. A computer that sleeps through that misses the day.",
      "",
      "- Windows: Settings › System › Power & battery, and set sleep to never when plugged in.",
      "- Mac: in Terminal, run `sudo pmset -c sleep 0`. The app signs only while you are logged in.",
      "- Linux desktop: Settings › Power, and turn Automatic Suspend off.",
      "- Laptops: keep it plugged in with the lid open.",
      "",
      "If the computer can't stay on all day, keep it awake for about 15 minutes from 00:15 UTC, or for 15 minutes from when it wakes. The day's data is ready 13 to 20 minutes after 00:00 UTC, the validator signs within a minute or two of that, and it sends its vote right after it signs. Leave it on until about 01:15 UTC and the day's check against 6529.io runs too.",
    ]),
  },
  {
    id: "how-long-it-takes-to-be-ready",
    title: "How long it takes to be ready",
    markdown: joinMarkdown([
      "You add no peers. The validator finds 6529's sentries by itself and downloads the TDH history from the network. It accepts that history only if it matches the checkpoint built into this release, from 6 November.",
      "",
      "In 6529's tests of rc.10 on 7 November, a new install was ready in about 21 minutes through Tor, and in about 16 with Tor off. The validator reads every Ethereum block since the release's checkpoint, so a join takes a little longer each day. Leave the validator running until the app says it is ready.",
    ]),
  },
  {
    id: "where-it-lives",
    title: "Where it lives",
    markdown: joinMarkdown([
      "| System | The app | Its data folder |",
      "| --- | --- | --- |",
      "| Mac | Applications › 6529 Validator | `~/Library/Application Support/6529-validator` |",
      "| Windows | Start menu › 6529 Validator | `C:\\ProgramData\\6529-validator` |",
      "| `.deb` | Your apps › 6529 Validator, which opens its page in your browser | `/var/lib/6529-validator` |",
      "| AppImage | The file itself | `~/.local/share/6529-validator` |",
      "",
      "The data folder holds your key. Never copy it to another computer.",
      "",
      "To check which build you have:",
      "",
      "| System | Command |",
      "| --- | --- |",
      '| Mac (Terminal) | `"/Applications/6529 Validator.app/Contents/Resources/validator" --version` |',
      "| Windows (a new PowerShell window) | `validator --version` |",
      "| `.deb` | `validator --version` |",
      "| AppImage | `./6529-Validator-0.1.0-x86_64.AppImage --version` |",
      "",
      "It prints `validator 0.1.0-rc.10 (f0a3440, TDH v1.4)`. If it shows another commit, tell us.",
    ]),
  },
  {
    id: "stop-pause-or-uninstall",
    title: "Stop, pause or uninstall",
    markdown: joinMarkdown([
      "On a Mac or a Windows PC, 6529's logo sits in the menu bar or by the clock (click the **^** arrow if it is hidden). Green means signed, grey waiting, rose that something needs you, and a hollow ring stopped or paused. Its menu:",
      "",
      "- **Pause signing** stops signing and keeps the validator checking. **Resume signing** starts again.",
      "- **Stop the validator service** stops it until you press **Start the validator service**, through restarts and updates too.",
      "",
      "The validator signs whether the app's window is open or not.",
      "",
      "| System | Stop | Start | Uninstall |",
      "| --- | --- | --- | --- |",
      "| Mac | **Stop the validator service** in the logo's menu | **Start the validator service** | Stop it, then drag the app to the Trash |",
      "| Windows | **Stop the validator service** in the logo's menu | **Start the validator service** | Settings › Apps › 6529 Validator › Uninstall |",
      "| `.deb` | `sudo systemctl stop 6529-validator` | `sudo systemctl start 6529-validator` | `sudo apt remove 6529-validator` |",
      '| AppImage | Close it, or `pkill -f "validator run"` | Open it | Delete the file |',
      "",
      "To stop for good, withdraw the authorization first, while the validator runs: on its page, open Keys, press Stop and sign. Uninstalling keeps the data folder. Delete it by hand, or run `sudo apt purge 6529-validator`.",
    ]),
  },
  {
    id: "updates",
    title: "Updates",
    markdown: joinMarkdown([
      "Once an hour the validator reads 6529's signed list of releases. When a newer one is out, the top bar says so, and the Update page offers **Update now**. It downloads this computer's file and checks it against the signed list. The app installs it only when you press **Install**, and never by itself. On Linux the page shows the `apt` command to run.",
    ]),
  },
  {
    id: "your-key",
    title: "Your key",
    markdown: joinMarkdown([
      "- The validator makes its key on this computer. Each day the key signs your account's TDH result. It can't move NFTs or funds, and it isn't your wallet.",
      "- One key, one computer. Never copy the data folder, and never restore it from a backup, a disk image or a VM snapshot. A validator that sees its key sign on another computer stops signing and says what to do. Two copies that both sign vote twice: your account then stops counting for at least 30 days.",
      "- Don't back up the key. If a computer is lost or replaced, install the validator on another one, and one signature from your wallet swaps its key in. On the page, open Keys and stop the lost computer's key.",
      "- 6529 never asks for your key, and the validator never sends it anywhere.",
    ]),
  },
  {
    id: "linux-and-the-terminal",
    title: "Linux and the terminal",
    markdown: joinMarkdown([
      "Linux needs glibc 2.35 or newer: Ubuntu 22.04, Debian 12, Linux Mint 21, Raspberry Pi OS Bookworm (64-bit) or newer. In the folder with the file, run this on x86-64:",
      "",
      "```text",
      "sudo apt install ./6529-validator_0.1.0_amd64.deb",
      "```",
      "",
      "Or this on ARM64:",
      "",
      "```text",
      "sudo apt install ./6529-validator_0.1.0_arm64.deb",
      "```",
      "",
      "It installs a service that starts with the computer. Then open **6529 Validator** from your apps, or run `validator open`, and follow the page. On a computer with no screen, follow the steps the install prints.",
      "",
      "The AppImage is for other Linux desktops on x86-64. Make it executable with `chmod +x 6529-Validator-0.1.0-x86_64.AppImage`, then open it. It signs only while it is open.",
      "",
      "Each terminal archive holds the program and its install guide, in `docs/install/`. On a cloud server, keep the defaults, with Tor on.",
    ]),
  },
  {
    id: "known-issues",
    title: "Known issues",
    markdown: joinMarkdown([
      "The [known issues](/validator/known-issues) list each one with its workaround. A new install must start before about 2026-11-23 03:30 UTC, and 0.1.0 stops signing on 1 December.",
    ]),
  },
];
