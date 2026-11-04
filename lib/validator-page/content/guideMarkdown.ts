// The tester guide's closed sections at /validator/guide, as Markdown. Built
// from the rc.5 tester package: the sections under "More" in TESTERS.md.

const joinMarkdown = (lines: readonly string[]) => lines.join("\n");

// Divider rows of Markdown tables.
const TWO_COLUMN_RULE = "| --- | --- |";

type ValidatorGuideFold = {
  readonly id: string;
  readonly title: string;
  readonly markdown: string;
};

export const VALIDATOR_GUIDE_FOLDS: readonly ValidatorGuideFold[] = [
  {
    id: "keep-it-awake",
    title: "Keep it awake",
    markdown: joinMarkdown([
      "The validator signs when the computer is awake, until signing closes at 19:00 UTC. A computer that sleeps through that misses the day.",
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
      "You add no peers. The validator finds 6529's sentries by itself and downloads the TDH history from the network. It accepts that history only if it matches the checkpoint built into this release, from 1 November.",
      "",
      "In 6529's test on 3 November, through Tor, a new install was ready in about 50 minutes: 10 to find the agreed day, 11 to download the history and 30 to rebuild and match it. The last step reads every Ethereum block since 1 November, so it takes a little longer each day. Leave the validator running until the app says it is ready.",
      "",
      "In the test phase, 6529 runs validators and sentries on AWS in the United States, Germany and Singapore. The goal is a network that many holders run, at home and in offices.",
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
      "To check which build you have, run the version command for your system:",
      "",
      "| System | Command |",
      TWO_COLUMN_RULE,
      '| Mac (Terminal) | `"/Applications/6529 Validator.app/Contents/Resources/validator" --version` |',
      "| Windows (a new PowerShell window) | `validator --version` |",
      "| `.deb` | `validator --version` |",
      "| AppImage | `./6529-Validator-0.1.0-x86_64.AppImage --version` |",
      "",
      "It prints `validator 0.1.0-rc.5 (29a8caf, TDH v1.4)`. If it shows another commit, tell us.",
    ]),
  },
  {
    id: "stop-pause-or-uninstall",
    title: "Stop, pause or uninstall",
    markdown: joinMarkdown([
      "On a Mac or a Windows PC, 6529's logo sits in the menu bar or by the clock (click the **^** arrow if it is hidden). Its mark shows how today is going: green, signed; grey, waiting; rose, something needs you; a hollow ring, stopped or paused. Its menu:",
      "",
      "- **Pause signing** stops signing and keeps the validator checking. **Resume signing** starts again.",
      "- **Stop the validator** stops it until you press **Start the validator**, after a restart too. Windows asks for permission first.",
      "",
      "Closing the app's window keeps the logo, and the validator signs whether the window is open or not.",
      "",
      "| System | Stop | Start | Uninstall |",
      "| --- | --- | --- | --- |",
      "| Mac | **Stop the validator** in the logo's menu | **Start the validator** | Stop it, then drag the app to the Trash |",
      "| Windows | **Stop the validator** in the logo's menu | **Start the validator** | Settings › Apps › 6529 Validator › Uninstall |",
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
      "Once an hour the validator reads 6529's signed list of releases. When a newer one is out, the top bar says so, and the Update page shows what changed. It never installs anything by itself.",
      "",
      "To update, install the new release over this one, the same way. Your key, your authorization and your records stay.",
      "",
      "To check at once:",
      "",
      "| System | Command |",
      TWO_COLUMN_RULE,
      '| Mac (Terminal) | `"/Applications/6529 Validator.app/Contents/Resources/validator" update check` |',
      "| Windows (PowerShell) | `validator update check --data-dir C:\\ProgramData\\6529-validator` |",
      "| `.deb` | `sudo -u validator6529 validator update check --data-dir /var/lib/6529-validator` |",
      "| AppImage | `./6529-Validator-0.1.0-x86_64.AppImage update check` |",
    ]),
  },
  {
    id: "your-key",
    title: "Your key",
    markdown: joinMarkdown([
      "- The validator makes its key on this computer. Each day the key signs your account's TDH result, with a short report on how your validator computed it. It can't move NFTs or funds, and it isn't your wallet.",
      "- One key, one computer. Never copy the data folder, and never restore it from a backup, a disk image or a VM snapshot. Two copies sign twice. Your account then stops counting for at least 30 days, and the keys in that authorization never count again.",
      "- Don't back up the key. If a computer is lost or replaced, install the validator on another one. It makes its own key, and one signature from your wallet swaps it in. On the page, open Keys and stop the lost computer's key.",
      "- An authorization lists up to 16 keys, one per computer, and you choose each key's share on the Keys page. A computer that is off leaves its share uncounted that day.",
      "- The key is encrypted, but its password sits beside it so the validator can start by itself. Anyone who copies the whole data folder, or controls the computer, can sign for your account.",
      "- 6529 never asks for your key, and the validator never sends it anywhere.",
    ]),
  },
  {
    id: "linux-and-the-terminal",
    title: "Linux and the terminal",
    markdown: joinMarkdown([
      "Linux needs glibc 2.35 or newer: Ubuntu 22.04, Debian 12, Linux Mint 21, Raspberry Pi OS Bookworm (64-bit) or newer. On a Raspberry Pi or another ARM computer, use the ARM64 file.",
      "",
      "In the folder with the file, run this on x86-64:",
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
      "The AppImage is for other Linux desktops on x86-64. Make it executable, then open it. It signs only while it is open.",
      "",
      "```text",
      "chmod +x 6529-Validator-0.1.0-x86_64.AppImage",
      "```",
      "",
      "For a terminal install on any system, each terminal archive holds the program and its install guide, in `docs/install/`. Skip that guide's Sigstore step: test releases don't have one. On a cloud server, keep the defaults, with Tor on.",
    ]),
  },
  {
    id: "known-issues",
    title: "Known issues",
    markdown: joinMarkdown([
      "The [known issues](/validator/known-issues) list each one with its workaround. Two dates matter: a new install must start before about 17 November, 01:30 UTC, and 0.1.0 stops signing on 1 December.",
    ]),
  },
];
