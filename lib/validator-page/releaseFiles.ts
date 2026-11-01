import type { ValidatorRelease, ValidatorReleaseFile } from "./releaseFeed";

export type ValidatorInstallerKind =
  | "macos"
  | "windows"
  | "deb-x64"
  | "deb-arm64"
  | "appimage";

export type ValidatorInstaller = {
  readonly kind: ValidatorInstallerKind;
  readonly title: string;
  /** The machines it is for. */
  readonly forMachines: string;
  /** How the file is signed, or that it is not. */
  readonly signing: string;
  readonly file: ValidatorReleaseFile;
};

export type ValidatorArchive = {
  readonly title: string;
  readonly signing: string | null;
  readonly file: ValidatorReleaseFile;
};

export type ValidatorReleaseDownloads = {
  readonly installers: readonly ValidatorInstaller[];
  readonly archives: readonly ValidatorArchive[];
  readonly checksums: ValidatorReleaseFile | null;
  readonly releaseJson: ValidatorReleaseFile | null;
};

const MAC_SIGNING = "Signed by 6529 Collection LLC and notarized by Apple.";
const WINDOWS_SIGNING =
  "Authenticode signature. Publisher: 6529 Collection LLC.";
const LINUX_SIGNING = "Not signed. The SHA-256 is the check.";

const INSTALLERS: readonly {
  readonly kind: ValidatorInstallerKind;
  readonly pattern: RegExp;
  readonly title: string;
  readonly forMachines: string;
  readonly signing: string;
}[] = [
  {
    kind: "macos",
    pattern: /\.dmg$/,
    title: "macOS",
    forMachines: "Mac with Apple silicon or Intel, macOS 11 or later.",
    signing: MAC_SIGNING,
  },
  {
    kind: "windows",
    pattern: /-x64\.msi$/,
    title: "Windows",
    forMachines: "Windows 10 or 11, 64-bit.",
    signing: WINDOWS_SIGNING,
  },
  {
    kind: "deb-x64",
    pattern: /_amd64\.deb$/,
    title: "Linux .deb, x64",
    forMachines: "Ubuntu 22.04 or later, Debian 12 or later, on Intel or AMD.",
    signing: LINUX_SIGNING,
  },
  {
    kind: "deb-arm64",
    pattern: /_arm64\.deb$/,
    title: "Linux .deb, ARM64",
    forMachines:
      "Raspberry Pi 4 or 5 with a 64-bit OS, and other ARM64 machines on Ubuntu 22.04 or Debian 12 or later.",
    signing: LINUX_SIGNING,
  },
  {
    kind: "appimage",
    pattern: /-x86_64\.AppImage$/,
    title: "AppImage",
    forMachines: "Other 64-bit Linux desktops. It runs only while it is open.",
    signing: LINUX_SIGNING,
  },
];

const ARCHIVE_TARGETS: readonly {
  readonly target: string;
  readonly title: string;
  readonly signing: string | null;
}[] = [
  {
    target: "aarch64-apple-darwin",
    title: "macOS, Apple silicon",
    signing: "The program is signed by 6529 Collection LLC and notarized.",
  },
  {
    target: "x86_64-apple-darwin",
    title: "macOS, Intel",
    signing: "The program is signed by 6529 Collection LLC and notarized.",
  },
  {
    target: "x86_64-pc-windows-msvc",
    title: "Windows, x64",
    signing: "validator.exe carries an Authenticode signature.",
  },
  {
    target: "x86_64-unknown-linux-gnu",
    title: "Linux, x64",
    signing: null,
  },
  {
    target: "aarch64-unknown-linux-gnu",
    title: "Linux, ARM64",
    signing: null,
  },
];

function describeArchive(file: ValidatorReleaseFile): ValidatorArchive {
  const known = ARCHIVE_TARGETS.find(
    (entry) =>
      file.name.startsWith("validator-") &&
      (file.name.endsWith(`-${entry.target}.tar.gz`) ||
        file.name.endsWith(`-${entry.target}.zip`))
  );
  return {
    title: known?.title ?? file.name,
    signing: known?.signing ?? null,
    file,
  };
}

/**
 * Sorts a release's files into the page's buttons by their names, which stay
 * the same from release to release. Files the page does not know go under
 * "Other downloads".
 */
export function groupReleaseFiles(
  release: ValidatorRelease
): ValidatorReleaseDownloads {
  const installers: ValidatorInstaller[] = [];
  const archives: ValidatorArchive[] = [];
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
        forMachines: installer.forMachines,
        signing: installer.signing,
        file,
      });
      continue;
    }
    archives.push(describeArchive(file));
  }

  const order = INSTALLERS.map((entry) => entry.kind);
  installers.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  const archiveOrder = ARCHIVE_TARGETS.map((entry) => entry.title);
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
