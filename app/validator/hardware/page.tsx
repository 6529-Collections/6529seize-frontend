import type { Metadata } from "next";
import { connection } from "next/server";

import ValidatorHardwarePage, {
  type HardwareDownload,
  type HardwareDownloads,
} from "@/components/validator-page/ValidatorHardwarePage";
import {
  getLockedView,
  getValidatorMetadata,
} from "@/lib/validator-page/pageAccess";
import { getReleaseFeedSnapshot } from "@/lib/validator-page/releaseFeed";
import {
  getReleaseDownloadPath,
  groupReleaseFiles,
  type ValidatorInstallerKind,
} from "@/lib/validator-page/releaseFiles";

type CardSystem = keyof HardwareDownloads;

const CARD_FILES: Record<
  CardSystem,
  readonly { readonly kind: ValidatorInstallerKind; readonly label: string }[]
> = {
  mac: [{ kind: "macos", label: "Download for Mac" }],
  windows: [{ kind: "windows", label: "Download for Windows" }],
  linux: [
    { kind: "deb-x64", label: "Linux, x86-64" },
    { kind: "deb-arm64", label: "Linux, ARM64" },
    // Fedora and other Linux without apt: x86-64 only.
    { kind: "appimage", label: "AppImage, x86-64" },
  ],
};

/** The newest release's files for each system card, if the feed has one. */
async function getHardwareDownloads(): Promise<HardwareDownloads> {
  const release = (await getReleaseFeedSnapshot()).releases[0];
  if (!release) {
    return {};
  }
  const { installers } = groupReleaseFiles(release);
  const forSystem = (system: CardSystem): HardwareDownload[] =>
    CARD_FILES[system].flatMap((entry) => {
      const installer = installers.find((item) => item.kind === entry.kind);
      return installer
        ? [
            {
              label: entry.label,
              href: getReleaseDownloadPath(release, installer.file),
              fileName: installer.file.name,
            },
          ]
        : [];
    });
  return {
    mac: forSystem("mac"),
    windows: forSystem("windows"),
    linux: forSystem("linux"),
  };
}

export default async function ValidatorHardwareRoute() {
  await connection();
  const locked = await getLockedView("/validator/hardware");
  if (locked) {
    return locked;
  }
  return <ValidatorHardwarePage downloads={await getHardwareDownloads()} />;
}

export const metadata: Metadata = getValidatorMetadata(
  "Hardware | 6529 Validator",
  "What computer the 6529 validator needs: a Mac or PC you already have is enough."
);
