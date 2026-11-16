import type { AiRelease, AiReleaseFile, AiSystem } from "./releaseFeed";

// What the pages say about each file. The words are en-US only for now, as
// the validator's file descriptions are; see ops/docs/ai-download-page.md.

/** The packages the page offers as a button, one per system. */
export type AiInstallerKind =
  | "macos"
  | "windows"
  | "linux-x64"
  | "linux-x64-cuda"
  | "linux-arm64";

/** The groups of the downloads list. */
export type AiFileFamily = "mac" | "windows" | "linux" | "checks";

export type AiFileEntry = {
  readonly family: AiFileFamily;
  /** What kind of file it is: "Disk image", "Debian package". */
  readonly label: string;
  /** Who it is for, or what it holds: "x86-64 · NVIDIA GPU (CUDA)". */
  readonly detail: string;
  readonly file: AiReleaseFile;
};

export type AiInstaller = AiFileEntry & {
  readonly kind: AiInstallerKind;
  /** The system it needs, in a line: "macOS 13.3 or later, Apple silicon". */
  readonly needs: string;
};

type InstallerRule = Omit<AiInstaller, "file"> & {
  readonly system: AiSystem;
  readonly pattern: RegExp;
};

const DEB = "Debian package";
const DEB_NEEDS = "Ubuntu 22.04, Debian 12 or newer";

const INSTALLERS: readonly InstallerRule[] = [
  {
    kind: "macos",
    family: "mac",
    system: "macos-arm64",
    pattern: /\.dmg$/,
    label: "Disk image",
    detail: "Apple silicon",
    needs: "macOS 13.3 or later, Apple silicon",
  },
  {
    kind: "windows",
    family: "windows",
    system: "windows-x64",
    pattern: /-setup\.exe$/,
    label: "Installer",
    detail: "64-bit Intel or AMD",
    needs: "Windows 10 or 11, 64-bit",
  },
  {
    kind: "linux-x64",
    family: "linux",
    system: "linux-x86_64-cpu",
    pattern: /_amd64\.deb$/,
    label: DEB,
    detail: "x86-64",
    needs: `${DEB_NEEDS}, x86-64`,
  },
  {
    kind: "linux-x64-cuda",
    family: "linux",
    system: "linux-x86_64-cuda",
    pattern: /_amd64\.deb$/,
    label: DEB,
    detail: "x86-64 · NVIDIA GPU (CUDA)",
    needs: `${DEB_NEEDS}, NVIDIA driver 575 or later`,
  },
  {
    kind: "linux-arm64",
    family: "linux",
    system: "linux-arm64-cpu",
    pattern: /_arm64\.deb$/,
    label: DEB,
    detail: "64-bit ARM",
    needs: `${DEB_NEEDS}, 64-bit ARM`,
  },
];

const ARCHIVE_DETAILS: Readonly<Record<AiSystem, string>> = {
  "macos-arm64": "Apple silicon",
  "windows-x64": "64-bit Intel or AMD",
  "linux-x86_64-cpu": "x86-64 · any Linux with systemd",
  "linux-x86_64-cuda": "x86-64 · NVIDIA GPU (CUDA) · any Linux with systemd",
  "linux-arm64-cpu": "64-bit ARM · any Linux with systemd",
};

const FAMILY_OF_SYSTEM: Readonly<Record<AiSystem, AiFileFamily>> = {
  "macos-arm64": "mac",
  "windows-x64": "windows",
  "linux-x86_64-cpu": "linux",
  "linux-x86_64-cuda": "linux",
  "linux-arm64-cpu": "linux",
};

const CHECK_FILES: Readonly<Record<string, string>> = {
  SHA256SUMS: "The SHA-256 of every file",
  "SHA256SUMS.sig": "6529 AI's signature of SHA256SUMS",
  "manifest.json": "What each file holds, and the commit it came from",
};

function describeOther(file: AiReleaseFile): AiFileEntry {
  if (file.system) {
    return {
      family: FAMILY_OF_SYSTEM[file.system],
      label: file.name.endsWith(".tar.gz") ? "Archive" : "Other file",
      detail: ARCHIVE_DETAILS[file.system],
      file,
    };
  }
  return {
    family: "checks",
    label: file.name,
    detail: CHECK_FILES[file.name] ?? "Other file",
    file,
  };
}

type AiFileGroup = {
  readonly family: AiFileFamily;
  readonly entries: readonly AiFileEntry[];
};

type AiReleaseDownloads = {
  /** The buttons, in the order of INSTALLERS. */
  readonly installers: readonly AiInstaller[];
  /** Every file, by system: Mac, Windows, Linux, then the checks. */
  readonly groups: readonly AiFileGroup[];
};

const FAMILY_ORDER: readonly AiFileFamily[] = [
  "mac",
  "windows",
  "linux",
  "checks",
];

/**
 * Sorts a release's files into the page's buttons, by the system the feed
 * names and the file's name, and into groups for the downloads list.
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
        family: rule.family,
        label: rule.label,
        detail: rule.detail,
        needs: rule.needs,
        file,
      });
    } else {
      others.push(describeOther(file));
    }
  }
  const order = INSTALLERS.map((entry) => entry.kind);
  installers.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  // The archives in the buttons' order (x86-64, CUDA, ARM64), then by name.
  const systemOrder = INSTALLERS.map((entry) => entry.system);
  const rank = (entry: AiFileEntry) => {
    const index = entry.file.system
      ? systemOrder.indexOf(entry.file.system)
      : -1;
    return index === -1 ? systemOrder.length : index;
  };
  others.sort(
    (a, b) => rank(a) - rank(b) || a.file.name.localeCompare(b.file.name, "en")
  );
  const groups = FAMILY_ORDER.map((family) => ({
    family,
    entries: [
      ...installers.filter((entry) => entry.family === family),
      ...others.filter((entry) => entry.family === family),
    ],
  })).filter((group) => group.entries.length > 0);
  return { installers, groups };
}

/**
 * The feed's `signed` text as the badges show it: who signed the file, and
 * whether Apple notarized it. "Developer ID Application: 6529 Collection
 * LLC, notarized by Apple" reads as 6529 Collection LLC, notarized.
 */
export function describeCodeSignature(signed: string | null): {
  readonly signer: string | null;
  readonly notarized: boolean;
} {
  if (!signed) {
    return { signer: null, notarized: false };
  }
  const notarized = /,?\s*notarized by Apple$/i.test(signed);
  const signer = signed
    .replace(/,?\s*notarized by Apple$/i, "")
    .replace(/^Developer ID Application:\s*/i, "")
    .trim();
  return { signer: signer || null, notarized };
}

/** The site path that hands out one file of the newest release. */
export function getAiDownloadPath(
  release: Pick<AiRelease, "version">,
  file: Pick<AiReleaseFile, "name">
): string {
  return `/ai/download/${encodeURIComponent(release.version)}/${encodeURIComponent(file.name)}`;
}
