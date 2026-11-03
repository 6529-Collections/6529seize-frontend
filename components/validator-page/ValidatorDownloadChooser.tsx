"use client";

import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useId, useState } from "react";

import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";
import type { ValidatorInstallerKind } from "@/lib/validator-page/releaseFiles";
import { useVisitorPlatform } from "./useVisitorPlatform";
import ValidatorDownloadRow, {
  type ValidatorDownloadOption,
} from "./ValidatorDownloadRow";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TEXT_BUTTON,
} from "./validatorStyles";

function kindsFor(platform: VisitorPlatform): ValidatorInstallerKind[] {
  switch (platform.system) {
    case "mac":
      return ["macos"];
    case "windows":
      return ["windows"];
    case "linux":
      if (platform.cpu === "arm64") {
        return ["deb-arm64"];
      }
      return platform.cpu === "x64" ? ["deb-x64"] : ["deb-x64", "deb-arm64"];
    case "other":
      return ["macos", "windows"];
  }
}

const SYSTEM_NAMES: Record<ValidatorInstallerKind, string> = {
  macos: "Mac",
  windows: "Windows",
  "deb-x64": "Linux",
  "deb-arm64": "Linux",
  appimage: "Linux",
};

function buttonLabel(
  option: ValidatorDownloadOption,
  bothLinux: boolean
): string {
  if (bothLinux) {
    return `Download for Linux, ${option.kind === "deb-arm64" ? "ARM64" : "x86-64"}`;
  }
  return `Download for ${SYSTEM_NAMES[option.kind]}`;
}

/**
 * One big button for this computer, and the other systems one click away.
 * The server picks the first button from the User-Agent header; Chromium's
 * client hints then pick the Linux file for this CPU.
 */
export default function ValidatorDownloadChooser({
  options,
  initial,
}: {
  readonly options: readonly ValidatorDownloadOption[];
  readonly initial: VisitorPlatform;
}) {
  const platform = useVisitorPlatform(initial);
  const [showAll, setShowAll] = useState(false);
  const listId = useId();
  const kinds = kindsFor(platform);
  const primary = kinds
    .map((kind) => options.find((option) => option.kind === kind))
    .filter((option): option is ValidatorDownloadOption => !!option);
  const bothLinux =
    primary.length === 2 && primary.every((item) => item.kind !== "macos");
  // Neither .deb installs on Fedora; the AppImage does, on x86-64 only, so
  // a Linux visitor who may be on x86-64 sees it too.
  const appImage =
    platform.system === "linux" && platform.cpu !== "arm64"
      ? options.find((option) => option.kind === "appimage")
      : undefined;

  return (
    <div>
      <div
        className={`tw-grid tw-gap-4 ${primary.length > 1 ? "sm:tw-grid-cols-2" : "sm:tw-max-w-md"}`}
      >
        {primary.map((option) => (
          <div key={option.kind} className="tw-flex tw-flex-col tw-gap-2">
            <a
              href={option.href}
              className={PRIMARY_BUTTON}
              aria-label={`${buttonLabel(option, bothLinux)}, ${option.fileName}`}
            >
              <ArrowDownTrayIcon aria-hidden="true" className="tw-size-6" />
              {buttonLabel(option, bothLinux)}
            </a>
            <p className="tw-m-0 tw-text-center tw-text-sm tw-leading-6 tw-text-iron-400">
              {option.summary}
              {option.size && ` · ${option.size}`}
            </p>
          </div>
        ))}
      </div>
      {bothLinux && (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          On a Raspberry Pi or another ARM computer, choose ARM64.
        </p>
      )}
      {appImage && (
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
          <span className="tw-text-sm tw-leading-6 tw-text-iron-300">
            The .deb is for Ubuntu, Debian and Mint. On Fedora or another Linux
            on Intel or AMD:
          </span>
          <a
            href={appImage.href}
            className={SECONDARY_BUTTON}
            aria-label={`Download the AppImage, ${appImage.fileName}`}
          >
            <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
            Download the AppImage
          </a>
        </div>
      )}
      <button
        type="button"
        className={`${TEXT_BUTTON} tw-mt-3`}
        aria-expanded={showAll}
        aria-controls={listId}
        onClick={() => setShowAll((value) => !value)}
      >
        Other systems
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-size-4 tw-transition ${showAll ? "tw-rotate-180" : ""}`}
        />
      </button>
      <ul
        id={listId}
        hidden={!showAll}
        className="tw-m-0 tw-mt-3 tw-list-none tw-divide-y tw-divide-white/[0.06] tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950/60 tw-p-0"
      >
        {options.map((option) => (
          <li key={option.kind}>
            <ValidatorDownloadRow option={option} />
          </li>
        ))}
      </ul>
    </div>
  );
}
