// The known issues at /validator/known-issues, rendered as Markdown. Built from the tester package (KNOWN-ISSUES.md).
// Release facts still to fill have the form {{RC8_...}}; the page tests fail while any is left.
// If rc.8's join tests show a join problem (the package's join item), add it as item 1 under Joining the network and renumber.

const joinMarkdown = (lines: readonly string[]) => lines.join("\n");

export const VALIDATOR_KNOWN_ISSUES_MARKDOWN = joinMarkdown([
  "These are the issues a tester might meet in 0.1.0-rc.8 of the 6529 validator (commit `{{RC8_COMMIT}}`), each with its workaround. Checked on {{RC8_CHECKED_ON}}.",
  "",
  "## Joining the network",
  "",
  "1. Tor's built-in bridges are public, so a network can block them too. Then the validator asks the Tor Project's bridge service for others, and last the page offers Connect without Tor on this network. It asks first: peers and Ethereum servers then see this network's IP address. Workaround: add a bridge line of your own in Settings › Privacy, or use another network. On macOS 11 there are no bridges (lyrebird needs macOS 12): use another network, or Connect without Tor.",
  "",
  "## Install and download",
  "",
  '2. Windows may say "Windows protected your PC" until it has seen the signed file often. Workaround: press **More info**, check that the publisher is 6529 Collection LLC, and press **Run anyway**.',
  "3. A program copied out of its archive without `release.json` reports itself as a development build. Its log now says why and what to do. Workaround: keep the archive's folder whole, or copy `release.json` from the same download beside the program.",
  '4. Linux needs glibc 2.35 or newer. Older systems fail with "GLIBC_2.3x not found". Workaround: use Ubuntu 22.04, Debian 12, Raspberry Pi OS Bookworm or newer.',
  "5. Windows on ARM is untested. Windows 11 on ARM runs the x64 build through emulation. Windows 10 on ARM can't run it. Post what you see in the wave.",
  "6. On Windows, running rc.8's Setup.exe after rc.8's `.msi` shows two 6529 Validator entries in Installed apps. An update is always to another release, so this happens only when the same release is installed twice through the two installers. Workaround: install each release once, with Setup.exe.",
  "7. Going back from rc.8 to rc.7 or earlier starts a validator you stopped, since those releases don't know it was stopped. On Windows, going back to rc.6 or earlier also needs an uninstall first. Workaround: stop the validator again from 6529's logo menu after the install. On Windows, for rc.6 or earlier, first uninstall 6529 Validator in Settings › Apps, then run the older release's Setup.exe. Your data folder stays.",
  "8. The Mac app's window and menu-bar logo were tested on build machines only. Post a screenshot in the wave.",
  "9. On a Mac, dragging the new app over one that is running leaves the old release running, and Cmd-Q and the menu-bar item's Quit may not quit it. Workaround: choose **Quit 6529 Validator** in the app menu at the top of the screen if it is there, or else Force Quit it (Apple menu › Force Quit); then drag the new one to Applications and open it from there.",
  "",
  "## Running",
  "",
  "10. The validator finds its country from IP data in the release (DB-IP Lite), which can be wrong near a border or behind a VPN. At home with Tor on, it finds none when your router doesn't give its address, and Settings says so. Workaround: pick your country in Settings.",
  "11. Some public Ethereum servers refuse Tor. The validator moves to the next one. If all refuse, it says `WAITING_SOURCE`. Workaround: add a server that accepts Tor, use your own node, or set `[tor] ethereum = false`.",
  "12. The Mac app signs only while you are logged in and the Mac is awake. Workaround: for a Mac that signs with no one logged in, follow the macOS guide in the Mac archive (`docs/install/macos.md`).",
  "13. The AppImage opens no window and signs only while it runs. Workaround: for a validator that starts with the computer, use the `.deb`.",
  "14. Moving the Mac app to the Trash doesn't stop the validator until you log out. Workaround: first choose **Stop the validator service** in the logo's menu.",
  "15. Some wallets refuse a message that names no chain. The authorization names none on purpose. Workaround: sign with Foundry's `cast`, as the archive's `docs/install/grant.md` shows.",
  "16. One key on two computers can still vote twice. A copy started after the day's window opens now waits for another validator's answer and stops when it sees the other vote. Two copies that are both running when the window opens can still both sign: your account is then excluded for 30 days, and that authorization's keys never count again. Workaround: never copy the data folder, and let each computer make its own key.",
  "17. Settings › Peers can make a computer help new validators find the network. On a computer with a key, the validators that connect to it can tell it is yours. The page says so when you switch it on. Workaround: leave it off, or switch it on on a second computer that has no key.",
  "18. The app's Log view reads the validator service's log only where the `.msi` installed it. The `.deb` and the macOS system service set up from Terminal don't let the app read `logs/`. Workaround: on Linux, `journalctl -u 6529-validator`; on macOS, read the file with `sudo`.",
  "",
  "## Dates",
  "",
  "19. A new install must start before about {{RC8_FRESH_INSTALL_UNTIL}}. The light client starts from a checkpoint built into the release ({{RC8_LIGHT_CLIENT_CHECKPOINT}}), good for about 15 days. A validator already running keeps its own state. Workaround: after that date, install the next release.",
  "20. 0.1.0 stops signing on 2026-12-01. It checks no Ethereum block after that date, ahead of Ethereum's next upgrade. That upgrade has no date yet, and 1 December is the earliest on record. Workaround: install the next 0.1.x release before then. The Update page tells you when it is out.",
]);
