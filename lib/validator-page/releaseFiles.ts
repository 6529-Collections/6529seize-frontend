import type { ValidatorRelease, ValidatorReleaseFile } from "./releaseFeed";

export type ValidatorInstallerKind =
  | "macos"
  | "windows"
  | "deb-x64"
  | "deb-arm64"
  | "appimage";

/** What the page says about one file: the same words in every list. */
type FileFacts = {
  /** "Mac", "Windows", "Linux" or "Any". */
  readonly system: string;
  /** "Apple silicon or Intel", "x86-64", "ARM64", or "" for any. */
  readonly cpu: string;
  /** What kind of file it is: "App (.dmg)", "Terminal archive". */
  readonly what: string;
  /** Who signed it, or null when nobody did. */
  readonly signedBy: string | null;
};

export type ValidatorInstaller = FileFacts & {
  readonly kind: ValidatorInstallerKind;
  readonly title: string;
  /** One short line: the systems and CPUs it is for. */
  readonly summary: string;
  readonly file: ValidatorReleaseFile;
};

export type ValidatorFileEntry = FileFacts & {
  readonly title: string;
  readonly file: ValidatorReleaseFile;
};

type ValidatorReleaseDownloads = {
  readonly installers: readonly ValidatorInstaller[];
  readonly archives: readonly ValidatorFileEntry[];
  readonly checksums: ValidatorReleaseFile | null;
  readonly releaseJson: ValidatorReleaseFile | null;
};

const MAC_SIGNED = "6529 Collection LLC, notarized by Apple";
const WINDOWS_SIGNED = "6529 Collection LLC";
const DEB = ".deb package";
const TERMINAL_ARCHIVE = "Terminal archive";
const WINDOWS_SUMMARY = "Windows 10 or 11 · 64-bit";

const INSTALLERS: readonly (Omit<ValidatorInstaller, "file"> & {
  readonly pattern: RegExp;
})[] = [
  {
    kind: "macos",
    pattern: /\.dmg$/,
    title: "Mac",
    summary: "macOS 11 or newer · Apple silicon or Intel",
    system: "Mac",
    cpu: "Apple silicon or Intel",
    what: "App (.dmg)",
    signedBy: MAC_SIGNED,
  },
  {
    kind: "windows",
    pattern: /-Setup-.+-x64\.exe$/,
    title: "Windows",
    summary: WINDOWS_SUMMARY,
    system: "Windows",
    cpu: "x86-64",
    what: "Installer (Setup.exe)",
    signedBy: WINDOWS_SIGNED,
  },
  {
    kind: "deb-x64",
    pattern: /_amd64\.deb$/,
    title: "Linux, x86-64",
    summary: "Ubuntu 22.04, Debian 12 or newer · Intel or AMD",
    system: "Linux",
    cpu: "x86-64",
    what: DEB,
    signedBy: null,
  },
  {
    kind: "deb-arm64",
    pattern: /_arm64\.deb$/,
    title: "Linux, ARM64",
    summary: "Raspberry Pi 4 or 5, other ARM64 · 64-bit OS",
    system: "Linux",
    cpu: "ARM64",
    what: DEB,
    signedBy: null,
  },
  {
    kind: "appimage",
    pattern: /-x86_64\.AppImage$/,
    title: "Linux AppImage, x86-64",
    summary: "Other Linux desktops · runs only while open",
    system: "Linux",
    cpu: "x86-64",
    what: "AppImage",
    signedBy: null,
  },
];

// Setup.exe holds this installer. It goes with the other files, or takes
// the Windows button in a release without a Setup.exe.
const WINDOWS_MSI_PATTERN = /-x64\.msi$/;
const WINDOWS_MSI: FileFacts & { readonly title: string } = {
  title: "Windows .msi, x86-64",
  system: "Windows",
  cpu: "x86-64",
  what: "Installer (.msi), the one inside Setup.exe",
  signedBy: WINDOWS_SIGNED,
};

const ARCHIVE_TARGETS: readonly (FileFacts & {
  readonly target: string;
  readonly title: string;
})[] = [
  {
    target: "aarch64-apple-darwin",
    title: "Mac archive, Apple silicon",
    system: "Mac",
    cpu: "Apple silicon",
    what: TERMINAL_ARCHIVE,
    signedBy: MAC_SIGNED,
  },
  {
    target: "x86_64-apple-darwin",
    title: "Mac archive, Intel",
    system: "Mac",
    cpu: "Intel",
    what: TERMINAL_ARCHIVE,
    signedBy: MAC_SIGNED,
  },
  {
    target: "x86_64-pc-windows-msvc",
    title: "Windows archive, x86-64",
    system: "Windows",
    cpu: "x86-64",
    what: TERMINAL_ARCHIVE,
    signedBy: WINDOWS_SIGNED,
  },
  {
    target: "x86_64-unknown-linux-gnu",
    title: "Linux archive, x86-64",
    system: "Linux",
    cpu: "x86-64",
    what: TERMINAL_ARCHIVE,
    signedBy: null,
  },
  {
    target: "aarch64-unknown-linux-gnu",
    title: "Linux archive, ARM64",
    system: "Linux",
    cpu: "ARM64",
    what: TERMINAL_ARCHIVE,
    signedBy: null,
  },
];

function describeArchive(file: ValidatorReleaseFile): ValidatorFileEntry {
  if (WINDOWS_MSI_PATTERN.test(file.name)) {
    return { ...WINDOWS_MSI, file };
  }
  const known = ARCHIVE_TARGETS.find(
    (entry) =>
      file.name.startsWith("validator-") &&
      (file.name.endsWith(`-${entry.target}.tar.gz`) ||
        file.name.endsWith(`-${entry.target}.zip`))
  );
  if (!known) {
    return {
      title: file.name,
      system: "Any",
      cpu: "",
      what: "Other file",
      signedBy: null,
      file,
    };
  }
  return {
    title: known.title,
    system: known.system,
    cpu: known.cpu,
    what: known.what,
    signedBy: known.signedBy,
    file,
  };
}

/**
 * Sorts a release's files into the page's buttons by their names, which stay
 * the same from release to release. Files the page does not know go with the
 * archives.
 */
export function groupReleaseFiles(
  release: ValidatorRelease
): ValidatorReleaseDownloads {
  const installers: ValidatorInstaller[] = [];
  const archives: ValidatorFileEntry[] = [];
  let checksums: ValidatorReleaseFile | null = null;
  let releaseJson: ValidatorReleaseFile | null = null;

  for (const file of release.files) {
    if (file.name === "SHA256SUMS") {
      checksums = file;
      continue;
    }
    if (file.name === "release.json") {
      releaseJson = file;
      continue;
    }
    const installer = INSTALLERS.find((entry) => entry.pattern.test(file.name));
    if (installer && !installers.some((item) => item.kind === installer.kind)) {
      installers.push({
        kind: installer.kind,
        title: installer.title,
        summary: installer.summary,
        system: installer.system,
        cpu: installer.cpu,
        what: installer.what,
        signedBy: installer.signedBy,
        file,
      });
      continue;
    }
    archives.push(describeArchive(file));
  }

  const msiIndex = archives.findIndex(
    (archive) => archive.title === WINDOWS_MSI.title
  );
  const msi = archives[msiIndex];
  if (msi && !installers.some((item) => item.kind === "windows")) {
    archives.splice(msiIndex, 1);
    installers.push({
      ...WINDOWS_MSI,
      kind: "windows",
      title: "Windows",
      summary: WINDOWS_SUMMARY,
      file: msi.file,
    });
  }

  const order = INSTALLERS.map((entry) => entry.kind);
  installers.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  const archiveOrder = [
    WINDOWS_MSI.title,
    ...ARCHIVE_TARGETS.map((entry) => entry.title),
  ];
  archives.sort((a, b) => {
    const indexA = archiveOrder.indexOf(a.title);
    const indexB = archiveOrder.indexOf(b.title);
    return (
      (indexA === -1 ? archiveOrder.length : indexA) -
        (indexB === -1 ? archiveOrder.length : indexB) ||
      a.file.name.localeCompare(b.file.name)
    );
  });
  return { installers, archives, checksums, releaseJson };
}

/**
 * Every file of a release for the table of all files: the installers, then
 * the other files, then release.json. SHA256SUMS stays out; the page shows
 * it on its own line.
 */
export function listReleaseFiles(
  release: ValidatorRelease
): readonly ValidatorFileEntry[] {
  const { installers, archives, releaseJson } = groupReleaseFiles(release);
  const entries: ValidatorFileEntry[] = installers.map((installer) => ({
    title: installer.title,
    system: installer.system,
    cpu: installer.cpu,
    what: installer.what,
    signedBy: installer.signedBy,
    file: installer.file,
  }));
  entries.push(...archives);
  if (releaseJson) {
    entries.push({
      title: "Release record",
      system: "Any",
      cpu: "",
      what: "release.json: its commit and each program's SHA-256",
      signedBy: null,
      file: releaseJson,
    });
  }
  return entries;
}

/** The site path that hands out one file of one release. */
export function getReleaseDownloadPath(
  release: Pick<ValidatorRelease, "version">,
  file: Pick<ValidatorReleaseFile, "name">
): string {
  return `/validator/download/${encodeURIComponent(release.version)}/${encodeURIComponent(file.name)}`;
}

/** "55.1 MB" style sizes, in decimal megabytes like most download pages. */
export function formatFileSize(bytes: number | null): string | null {
  if (bytes === null) {
    return null;
  }
  if (bytes < 1_000_000) {
    return `${Math.max(1, Math.round(bytes / 1000))} kB`;
  }
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/** The first characters of a commit, as `git log --oneline` shows them. */
export function shortCommit(commit: string | null): string | null {
  return commit ? commit.slice(0, 7) : null;
}
