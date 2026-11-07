// The known issues at /validator/known-issues, rendered as Markdown. Built from the tester package (KNOWN-ISSUES.md).
// Release facts still to fill have the form {{RC10_...}}; the page tests allow only the ones they name as still to fill.
// If rc.10's join tests show a join problem, add it under Joining the network and renumber.

const joinMarkdown = (lines: readonly string[]) => lines.join("\n");

export const VALIDATOR_KNOWN_ISSUES_MARKDOWN = joinMarkdown([
  "These are the issues a tester might meet in 0.1.0-rc.10 of the 6529 validator (commit `f0a3440`), each with its workaround. Checked on 2026-11-07.",
  "",
  "## Joining the network",
  "",
  "1. Tor's built-in bridges are public, so a network can block them too. Then the validator asks the Tor Project's bridge service for others, and last the page offers Connect without Tor on this network. It asks first: peers and Ethereum servers then see this network's IP address. Workaround: add a bridge line of your own in Settings › Privacy, or use another network. On macOS 11 there are no bridges (lyrebird needs macOS 12): use another network, or Connect without Tor.",
  "2. A new install on Sunday waits until Sunday's day is final and the update feed has its checkpoint, in the evening UTC. Workaround: install before Sunday, 00:00 UTC.",
  "",
  "## Install and download",
  "",
  '3. Windows may say "Windows protected your PC" until it has seen the signed file often. Workaround: press **More info**, check that the publisher is 6529 Collection LLC, and press **Run anyway**.',
  "4. A program copied out of its archive without `release.json` reports itself as a development build. Its log now says why and what to do. Workaround: keep the archive's folder whole, or copy `release.json` from the same download beside the program.",
  '5. Linux needs glibc 2.35 or newer. Older systems fail with "GLIBC_2.3x not found". Workaround: use Ubuntu 22.04, Debian 12, Raspberry Pi OS Bookworm or newer.',
  "6. Windows on ARM is untested. Windows 11 on ARM runs the x64 build through emulation. Windows 10 on ARM can't run it. Post what you see in the wave.",
  "7. On Windows, running rc.10's Setup.exe after rc.10's `.msi` shows two 6529 Validator entries in Installed apps. An update is always to another release, so this happens only when the same release is installed twice through the two installers. Workaround: install each release once, with Setup.exe.",
  '8. On Windows, Setup.exe may show "Files in use" with the 6529 Validator service; Retry shows the same window again. Workaround: press Ignore. If Setup stops with "Error writing to file: …\\validator.exe", stop the validator from 6529\'s logo menu, quit the app and press Retry.',
  "9. On Windows, Setup and Update now briefly show two or three command windows while installing. They close by themselves.",
  "10. Going back to rc.8 or older doesn't help from Sunday 8 November, 00:00 UTC: their signatures don't count on the new chain. Before then, on Windows, going back to rc.6 or earlier needs an uninstall first. Workaround: uninstall 6529 Validator in Settings › Apps, then run the older release's Setup.exe. Your data folder stays. Going back to rc.7 or earlier also starts a validator you stopped, since those releases don't know it was stopped. Workaround: stop it again from 6529's logo menu after the install.",
  "11. The Mac app's window and menu-bar logo were tested on build machines only. Post a screenshot in the wave.",
  "12. On a Mac, dragging the new app over one that is running leaves the old release running. Workaround: from rc.10 on, use **Update now** on the Update page; it replaces the app and opens it again. To install by hand, first choose **Quit for an update** in the menu-bar logo's menu or the app's menu, then drag the new app to Applications and open it. From rc.8, which has no Quit for an update, follow the steps in [Upgrading from rc.9](/validator#upgrading).",
  "",
  "## Running",
  "",
  "13. The validator finds its country from IP data in the release (DB-IP Lite), which can be wrong near a border or behind a VPN. At home with Tor on, it finds none when your router doesn't give its address, and Settings says so. Workaround: pick your country in Settings.",
  "14. Some public Ethereum servers refuse Tor. The validator moves to the next one. If all refuse, it says `WAITING_SOURCE`. Workaround: add a server that accepts Tor, use your own node, or set `[tor] ethereum = false`.",
  "15. The Mac app signs only while you are logged in and the Mac is awake. Workaround: for a Mac that signs with no one logged in, follow the macOS guide in the Mac archive (`docs/install/macos.md`).",
  "16. The AppImage opens no window and signs only while it runs. Workaround: for a validator that starts with the computer, use the `.deb`.",
  "17. Moving the Mac app to the Trash doesn't stop the validator until you log out. Workaround: first choose **Stop the validator service** in the logo's menu.",
  "18. Some wallets refuse a message that names no chain. The authorization names none on purpose. Workaround: sign with Foundry's `cast`, as the archive's `docs/install/grant.md` shows.",
  "19. One key on two computers can still vote twice. A copy started after the day's window opens now waits for another validator's answer and stops when it sees the other vote. Two copies that are both running when the window opens can still both sign: your account is then excluded for 30 days, and that authorization's keys never count again. Workaround: never copy the data folder, and let each computer make its own key.",
  "20. Settings › Peers can make a computer help new validators find the network. On a computer with a key, the validators that connect to it can tell it is yours. The page says so when you switch it on. Workaround: leave it off, or switch it on on a second computer that has no key.",
  "21. The app's Log view reads the validator service's log only where the `.msi` installed it. The `.deb` and the macOS system service set up from Terminal don't let the app read `logs/`. Workaround: on Linux, `journalctl -u 6529-validator`; on macOS, read the file with `sudo`.",
  "",
  "## Dates",
  "",
  "22. A new install must start before about 2026-11-23 03:30 UTC. The light client starts from a checkpoint built into the release (2026-11-07 11:02 UTC), good for about 15 days. A validator already running keeps its own state. Workaround: after that date, install the next release.",
  "23. 0.1.0 stops signing on 2026-12-01. It checks no Ethereum block after that date, ahead of Ethereum's next upgrade. That upgrade has no date yet, and 1 December is the earliest on record. Workaround: install the next 0.1.x release before then. The Update page tells you when it is out.",
]);
