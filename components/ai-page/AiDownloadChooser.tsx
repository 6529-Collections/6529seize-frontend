"use client";

import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useId, useState } from "react";

import { useVisitorPlatform } from "@/components/validator-page/useVisitorPlatform";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TEXT_BUTTON,
} from "@/components/validator-page/validatorStyles";
import type { AiInstallerKind } from "@/lib/ai-page/releaseFiles";
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";

/** One package, with its words already in the page's language. */
export type AiDownloadOption = {
  readonly kind: AiInstallerKind;
  readonly title: string;
  /** One short line: the systems and CPUs it is for, and its size. */
  readonly summary: string;
  /** Under the big button: the release's full version and the summary. */
  readonly note: string;
  readonly href: string;
  readonly image: string;
  /** "Download for Mac". */
  readonly buttonText: string;
  /** The button's accessible name, with the file name. */
  readonly buttonLabel: string;
  /** The list row's accessible name, with the file name. */
  readonly rowLabel: string;
};

export type AiChooserText = {
  readonly armNote: string;
  readonly cudaText: string;
  readonly cudaButton: string;
  readonly otherSystems: string;
  readonly rowText: string;
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

function DownloadRow({
  option,
  rowText,
}: {
  readonly option: AiDownloadOption;
  readonly rowText: string;
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3">
      <span className="tw-flex tw-size-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-bg-white">
        <Image
          unoptimized
          src={option.image}
          alt=""
          width={22}
          height={22}
          className="tw-size-[22px] tw-object-contain"
        />
      </span>
      <div className="tw-min-w-0 tw-flex-1">
        <p className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
          {option.title}
        </p>
        <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400">
          {option.summary}
        </p>
      </div>
      <a
        href={option.href}
        className={SECONDARY_BUTTON}
        aria-label={option.rowLabel}
      >
        <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
        {rowText}
      </a>
    </div>
  );
}

/**
 * One big button for this computer, and every package one click away. The
 * server picks the first button from the User-Agent header; Chromium's
 * client hints then pick the Linux package for this CPU. Under each button,
 * the full version, its systems and its size.
 */
export default function AiDownloadChooser({
  options,
  initial,
  text,
}: {
  readonly options: readonly AiDownloadOption[];
  readonly initial: VisitorPlatform;
  readonly text: AiChooserText;
}) {
  const platform = useVisitorPlatform(initial);
  const [showAll, setShowAll] = useState(false);
  const listId = useId();
  const primary = kindsFor(platform)
    .map((kind) => options.find((option) => option.kind === kind))
    .filter((option): option is AiDownloadOption => !!option);
  const bothLinux =
    primary.length === 2 &&
    primary.every((option) => option.kind.startsWith("linux"));
  // The CUDA package is for x86-64 computers with an NVIDIA GPU.
  const cuda =
    platform.system === "linux" && platform.cpu !== "arm64"
      ? options.find((option) => option.kind === "linux-x64-cuda")
      : undefined;

  return (
    <div>
      {primary.length > 0 && (
        <div
          className={`tw-grid tw-gap-4 ${primary.length > 1 ? "sm:tw-grid-cols-2" : "sm:tw-max-w-md"}`}
        >
          {primary.map((option) => (
            <div key={option.kind} className="tw-flex tw-flex-col tw-gap-2">
              <a
                href={option.href}
                className={PRIMARY_BUTTON}
                aria-label={option.buttonLabel}
              >
                <ArrowDownTrayIcon aria-hidden="true" className="tw-size-6" />
                {option.buttonText}
              </a>
              <p className="tw-m-0 tw-text-center tw-text-sm tw-leading-6 tw-text-iron-400">
                {option.note}
              </p>
            </div>
          ))}
        </div>
      )}
      {bothLinux && (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          {text.armNote}
        </p>
      )}
      {cuda && (
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
          <span className="tw-text-sm tw-leading-6 tw-text-iron-300">
            {text.cudaText}
          </span>
          <a
            href={cuda.href}
            className={SECONDARY_BUTTON}
            aria-label={cuda.rowLabel}
          >
            <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
            {text.cudaButton}
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
        {text.otherSystems}
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
            <DownloadRow option={option} rowText={text.rowText} />
          </li>
        ))}
      </ul>
    </div>
  );
}
