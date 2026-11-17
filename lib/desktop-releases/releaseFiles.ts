import type { ValidatorReleaseFile } from "@/lib/validator-page/releaseFeed";

import type { DesktopRelease } from "./releases";

/** The installers the page offers as a button, one per system. */
export type DesktopInstallerKind = "windows" | "macos";

/** What a file of a release is, for the words the page shows beside it. */
export type DesktopFileKind = DesktopInstallerKind | "checksums" | "other";

export type DesktopFileEntry = {
  readonly kind: DesktopFileKind;
  readonly file: ValidatorReleaseFile;
};

export type DesktopInstaller = DesktopFileEntry & {
  readonly kind: DesktopInstallerKind;
};

// The names 6529 Desktop's release tool gives the installers:
// 6529-Desktop_<version>_windows-x64-setup.exe and
// 6529-Desktop_<version>_macos-arm64.dmg. In the page's order.
const INSTALLERS: readonly {
  readonly kind: DesktopInstallerKind;
  readonly pattern: RegExp;
}[] = [
  { kind: "windows", pattern: /_windows-x64-setup\.exe$/ },
  { kind: "macos", pattern: /_macos-arm64\.dmg$/ },
];

/** The release's installers: at most one per system, Windows first. */
export function getDesktopInstallers(
  release: DesktopRelease
): readonly DesktopInstaller[] {
  const installers: DesktopInstaller[] = [];
  for (const { kind, pattern } of INSTALLERS) {
    const file = release.files.find((entry) => pattern.test(entry.name));
    if (file) {
      installers.push({ kind, file });
    }
  }
  return installers;
}

/** Every file of a release for the table: the installers, then SHA256SUMS. */
export function listDesktopReleaseFiles(
  release: DesktopRelease
): readonly DesktopFileEntry[] {
  const installers = getDesktopInstallers(release);
  const others: DesktopFileEntry[] = release.files
    .filter((file) => !installers.some((entry) => entry.file === file))
    .map((file) => ({
      kind: file.name === "SHA256SUMS" ? "checksums" : "other",
      file,
    }));
  // SHA256SUMS first, then the rest in name order. The names are machine
  // identifiers shown as written, so they sort the same in every locale.
  others.sort(
    (a, b) =>
      Number(a.kind !== "checksums") - Number(b.kind !== "checksums") ||
      a.file.name.localeCompare(b.file.name, "en")
  );
  return [...installers, ...others];
}

/**
 * The site path that hands out one file of the newest release. Only the
 * newest release's files are handed out (`findListedFile` takes only its
 * version), so link only those; older releases show their SHA-256 alone.
 */
export function getDesktopDownloadPath(
  release: Pick<DesktopRelease, "version">,
  file: Pick<ValidatorReleaseFile, "name">
): string {
  return `/desktop/download/${encodeURIComponent(release.version)}/${encodeURIComponent(file.name)}`;
}
