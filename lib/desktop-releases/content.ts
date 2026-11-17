import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
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
 * How the guide names an installer: its file name in the newest release,
 * as code, or a description while no release is published.
 */
function guideFileRef(
  release: DesktopRelease | undefined,
  kind: DesktopInstallerKind
): string {
  if (release) {
    return `\`${getDesktopInstallerName(release, kind)}\``;
  }
  const description: MessageKey =
    kind === "windows"
      ? "desktopPage.guide.file.windows"
      : "desktopPage.guide.file.macos";
  return t(LOCALE, description);
}

/** A section of the guide, so the page can put a screenshot after it. */
export type DesktopGuideSection =
  | "before"
  | "windows"
  | "mac"
  | "signIn"
  | "browserSigning"
  | "update"
  | "uninstall";

/**
 * The guide, section by section: what you need, installing on each
 * system, signing in, signing with a browser wallet, updating and
 * uninstalling. File names come from the newest release, or read
 * `<version>` while there is none.
 */
export function getDesktopGuideSections(
  release: DesktopRelease | undefined
): readonly { readonly id: DesktopGuideSection; readonly markdown: string }[] {
  return [
    { id: "before", markdown: t(LOCALE, "desktopPage.guide.before") },
    {
      id: "windows",
      markdown: t(LOCALE, "desktopPage.guide.windows", {
        setup: guideFileRef(release, "windows"),
        publisher: DESKTOP_WINDOWS_PUBLISHER,
      }),
    },
    {
      id: "mac",
      markdown: t(LOCALE, "desktopPage.guide.mac", {
        dmg: guideFileRef(release, "macos"),
      }),
    },
    { id: "signIn", markdown: t(LOCALE, "desktopPage.guide.signIn") },
    {
      id: "browserSigning",
      markdown: t(LOCALE, "desktopPage.guide.browserSigning"),
    },
    { id: "update", markdown: t(LOCALE, "desktopPage.guide.update") },
    { id: "uninstall", markdown: t(LOCALE, "desktopPage.guide.uninstall") },
  ];
}

/** The known issues of the test release, as the release notes verify them. */
export function getDesktopKnownIssuesMarkdown(): string {
  return t(LOCALE, "desktopPage.knownIssues.body", {
    publisher: DESKTOP_WINDOWS_PUBLISHER,
  });
}
