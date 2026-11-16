import { formatFileSize } from "@/lib/validator-page/releaseFiles";

import type { AiRelease, AiReleaseFile, AiSystem } from "./releaseFeed";

/** The packages the page offers as a button, one per system. */
export type AiInstallerKind =
  | "macos"
  | "windows"
  | "linux-x64"
  | "linux-x64-cuda"
  | "linux-arm64";

/**
 * What the page says about a file. The words are en-US only for now, as
 * the validator's file descriptions are; see `ops/docs/ai-download-page.md`.
 */
type AiFileEntry = {
  /** "Mac", "Windows, x86-64", "Linux, x86-64 with an NVIDIA GPU". */
  readonly title: string;
  /** What kind of file it is: "App (.dmg)", ".tar.gz for any Linux". */
  readonly what: string;
  readonly file: AiReleaseFile;
};

export type AiInstaller = AiFileEntry & {
  readonly kind: AiInstallerKind;
  /** One short line: the systems and CPUs it is for. */
  readonly summary: string;
  /** The logo beside it, from /public. */
  readonly image: string;
};

type InstallerRule = Omit<AiInstaller, "file"> & {
  readonly system: AiSystem;
  readonly pattern: RegExp;
};

const INSTALLERS: readonly InstallerRule[] = [
  {
    kind: "macos",
    system: "macos-arm64",
    pattern: /\.dmg$/,
    title: "Mac",
    what: "App (.dmg)",
    summary: "macOS 13.3 or later · Apple silicon (M1 or later)",
    image: "/macos.png",
  },
  {
    kind: "windows",
    system: "windows-x64",
    pattern: /-setup\.exe$/,
    title: "Windows",
    what: "Installer (setup.exe)",
    summary: "Windows 10 (1809) or 11 · 64-bit Intel or AMD",
    image: "/windows.png",
  },
  {
    kind: "linux-x64",
    system: "linux-x86_64-cpu",
    pattern: /_amd64\.deb$/,
    title: "Linux, x86-64",
    what: ".deb package",
    summary: "Ubuntu 22.04, Debian 12 or newer · Intel or AMD",
    image: "/linux.png",
  },
  {
    kind: "linux-x64-cuda",
    system: "linux-x86_64-cuda",
    pattern: /_amd64\.deb$/,
    title: "Linux, x86-64 with an NVIDIA GPU",
    what: ".deb package, CUDA",
    summary: "Ubuntu 22.04, Debian 12 or newer · NVIDIA driver 575 or later",
    image: "/linux.png",
  },
  {
    kind: "linux-arm64",
    system: "linux-arm64-cpu",
    pattern: /_arm64\.deb$/,
    title: "Linux, ARM64",
    what: ".deb package",
    summary: "Ubuntu 22.04, Debian 12 or newer · 64-bit ARM, Raspberry Pi 5",
    image: "/linux.png",
  },
];

const ARCHIVE_TITLES: Readonly<Record<AiSystem, string>> = {
  "macos-arm64": "Mac",
  "windows-x64": "Windows",
  "linux-x86_64-cpu": "Linux, x86-64",
  "linux-x86_64-cuda": "Linux, x86-64 with an NVIDIA GPU",
  "linux-arm64-cpu": "Linux, ARM64",
};

const RELEASE_LIST_FILES: Readonly<Record<string, string>> = {
  SHA256SUMS: "The SHA-256 of every file",
  "SHA256SUMS.sig": "6529 AI's signature of SHA256SUMS",
  "manifest.json": "What each file holds, and the commit it was built from",
};

function describeOther(file: AiReleaseFile): AiFileEntry {
  if (file.system) {
    return {
      title: ARCHIVE_TITLES[file.system],
      what: file.name.endsWith(".tar.gz")
        ? ".tar.gz for any Linux with systemd"
        : "Other file",
      file,
    };
  }
  const releaseListFile = RELEASE_LIST_FILES[file.name];
  return releaseListFile
    ? { title: "Release list", what: releaseListFile, file }
    : { title: file.name, what: "Other file", file };
}

type AiReleaseDownloads = {
  /** The buttons, in the order of INSTALLERS. */
  readonly installers: readonly AiInstaller[];
  /** Every other file: the .tar.gz packages, then the release list's. */
  readonly others: readonly AiFileEntry[];
};

/**
 * Sorts a release's files into the page's buttons by the system the feed
 * names and the file's name, and the rest for the table of all files.
 */
export function groupAiReleaseFiles(release: AiRelease): AiReleaseDownloads {
  const installers: AiInstaller[] = [];
  const others: AiFileEntry[] = [];
  for (const file of release.files) {
    const rule = INSTALLERS.find(
      (entry) => entry.system === file.system && entry.pattern.test(file.name)
    );
    if (rule && !installers.some((item) => item.kind === rule.kind)) {
      installers.push({
        kind: rule.kind,
        title: rule.title,
        what: rule.what,
        summary: rule.summary,
        image: rule.image,
        file,
      });
    } else {
      others.push(describeOther(file));
    }
  }
  const order = INSTALLERS.map((entry) => entry.kind);
  installers.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  // Packages before the release list's files, each group in name order.
  others.sort(
    (a, b) =>
      Number(a.file.system === null) - Number(b.file.system === null) ||
      a.file.name.localeCompare(b.file.name, "en")
  );
  return { installers, others };
}

/** Every file of a release for the table: the buttons' files first. */
export function listAiReleaseFiles(release: AiRelease): readonly AiFileEntry[] {
  const { installers, others } = groupAiReleaseFiles(release);
  return [...installers, ...others];
}

/**
 * "95.5 MB", as the validator page writes sizes, and "1.2 GB" from a
 * gigabyte up: the CUDA packages are over a gigabyte.
 */
export function formatAiFileSize(bytes: number | null): string | null {
  if (bytes !== null && bytes >= 1_000_000_000) {
    return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  }
  return formatFileSize(bytes);
}

/** The site path that hands out one file of the newest release. */
export function getAiDownloadPath(
  release: Pick<AiRelease, "version">,
  file: Pick<AiReleaseFile, "name">
): string {
  return `/ai/download/${encodeURIComponent(release.version)}/${encodeURIComponent(file.name)}`;
}
