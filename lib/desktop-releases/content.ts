import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";

import {
  getDesktopInstallers,
  type DesktopInstallerKind,
} from "./releaseFiles";
import type { DesktopRelease } from "./releases";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/**
 * The name Windows shows for the code signature of the installer and of the
 * programs it installs. Shown as it is in every language.
 */
export const DESKTOP_WINDOWS_PUBLISHER = "6529 Collection LLC";

/** The public wave where people report problems with 6529 apps. */
export const DESKTOP_FEEDBACK_WAVE_ID = "e933d8d6-0c78-4e8f-aa12-f67d8c11b4dc";

// The names 6529 Desktop's release tool gives the installers, used while no
// release is published.
const FALLBACK_NAMES: Readonly<
  Record<DesktopInstallerKind, (version: string) => string>
> = {
  windows: (version) => `6529-Desktop_${version}_windows-x64-setup.exe`,
  macos: (version) => `6529-Desktop_${version}_macos-arm64.dmg`,
};

/** An installer's name in the release, or the name every release gives it. */
export function getDesktopInstallerName(
  release: DesktopRelease | undefined,
  kind: DesktopInstallerKind
): string {
  const installer = release
    ? getDesktopInstallers(release).find((entry) => entry.kind === kind)
    : undefined;
  return (
    installer?.file.name ??
    FALLBACK_NAMES[kind](release?.version ?? "<version>")
  );
}

/**
 * The guide: installing on each system, signing in, signing with a browser
 * wallet, updating and uninstalling. File names come from the newest
 * release, or read `<version>` while there is none.
 */
export function getDesktopGuideMarkdown(
  release: DesktopRelease | undefined
): string {
  return [
    t(LOCALE, "desktopPage.guide.windows", {
      setup: getDesktopInstallerName(release, "windows"),
      publisher: DESKTOP_WINDOWS_PUBLISHER,
    }),
    t(LOCALE, "desktopPage.guide.mac", {
      dmg: getDesktopInstallerName(release, "macos"),
    }),
    t(LOCALE, "desktopPage.guide.signIn"),
    t(LOCALE, "desktopPage.guide.browserSigning"),
    t(LOCALE, "desktopPage.guide.update"),
    t(LOCALE, "desktopPage.guide.uninstall"),
  ].join("\n\n");
}

/** The known issues of the test release, as the release notes verify them. */
export function getDesktopKnownIssuesMarkdown(): string {
  return t(LOCALE, "desktopPage.knownIssues.body", {
    publisher: DESKTOP_WINDOWS_PUBLISHER,
  });
}
