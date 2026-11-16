"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

import { useVisitorPlatform } from "@/components/validator-page/useVisitorPlatform";
import { PRIMARY_BUTTON } from "@/components/validator-page/validatorStyles";
import type { AiInstallerKind } from "@/lib/ai-page/releaseFiles";
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";

/** One package, with its words already in the page's language. */
export type AiHeroOption = {
  readonly kind: AiInstallerKind;
  readonly href: string;
  /** "Download for Mac". */
  readonly buttonText: string;
  /** The button's accessible name, with the file name. */
  readonly buttonLabel: string;
  /** Under the button: "0.1.0-rc.1 · 95.5 MB · macOS 13.3 or later". */
  readonly meta: string;
  /** Who signed it, as badges; null for a file with no code signature. */
  readonly badges: ReactNode;
  /** The short name in "Also for": "Windows". */
  readonly system: string;
  /** That link's accessible name, with the file name. */
  readonly systemLabel: string;
};

export type AiHeroText = {
  readonly armNote: string;
  /** For a phone or another computer it can't tell: what 6529 AI runs on. */
  readonly otherNote: string;
  readonly alsoFor: string;
  readonly allDownloads: string;
};

function kindsFor(platform: VisitorPlatform): AiInstallerKind[] {
  switch (platform.system) {
    case "mac":
      return ["macos"];
    case "windows":
      return ["windows"];
    case "linux":
      if (platform.cpu === "arm64") {
        return ["linux-arm64"];
      }
      return platform.cpu === "x64"
        ? ["linux-x64"]
        : ["linux-x64", "linux-arm64"];
    case "other":
      return ["macos", "windows"];
  }
}

/**
 * The big button for this computer, what it needs under it, who signed
 * it, and quiet links to every other system. The server picks the button
 * from the User-Agent header; Chromium's client hints then pick the Linux
 * package for this CPU.
 */
export default function AiDownloadHero({
  options,
  initial,
  text,
}: {
  readonly options: readonly AiHeroOption[];
  readonly initial: VisitorPlatform;
  readonly text: AiHeroText;
}) {
  const platform = useVisitorPlatform(initial);
  const primary = kindsFor(platform)
    .map((kind) => options.find((option) => option.kind === kind))
    .filter((option): option is AiHeroOption => !!option);
  const others = options.filter((option) => !primary.includes(option));
  const bothLinux =
    primary.length === 2 &&
    primary.every((option) => option.kind.startsWith("linux"));

  return (
    <div>
      <div
        className={`tw-grid tw-gap-6 ${primary.length > 1 ? "sm:tw-grid-cols-2" : ""}`}
      >
        {primary.map((option) => (
          <div key={option.kind} className="tw-flex tw-flex-col tw-gap-3">
            <a
              href={option.href}
              className={`${PRIMARY_BUTTON} sm:tw-w-auto sm:tw-self-start sm:tw-px-8`}
              aria-label={option.buttonLabel}
            >
              <ArrowDownTrayIcon aria-hidden="true" className="tw-size-6" />
              {option.buttonText}
            </a>
            <p className="tw-m-0 tw-text-sm tw-tabular-nums tw-leading-6 tw-text-iron-400">
              {option.meta}
            </p>
            {option.badges}
          </div>
        ))}
      </div>
      {platform.system === "other" && (
        <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
          {text.otherNote}
        </p>
      )}
      {bothLinux && (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {text.armNote}
        </p>
      )}
      <p className="tw-mb-0 tw-mt-6 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-4 tw-gap-y-1 tw-text-sm tw-leading-6">
        {others.length > 0 && (
          <span className="tw-text-iron-500">{text.alsoFor}</span>
        )}
        {others.map((option) => (
          <a
            key={option.kind}
            href={option.href}
            aria-label={option.systemLabel}
            className="tw-rounded tw-font-medium tw-text-iron-200 tw-underline tw-decoration-white/20 tw-underline-offset-4 hover:tw-text-white hover:tw-decoration-white/60 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {option.system}
          </a>
        ))}
        <a
          href="#downloads"
          className="tw-rounded tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-4 hover:tw-decoration-primary-300 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {text.allDownloads}
        </a>
      </p>
    </div>
  );
}
