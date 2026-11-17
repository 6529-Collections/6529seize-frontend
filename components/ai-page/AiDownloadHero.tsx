"use client";

import {
  ArrowDownTrayIcon,
  CheckIcon,
  LinkIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { useVisitorPlatform } from "@/components/validator-page/useVisitorPlatform";
import { PRIMARY_BUTTON } from "@/components/validator-page/validatorStyles";
import type { AiInstallerKind } from "@/lib/ai-page/releaseFiles";
import AiSystemLogo from "./AiSystemLogo";
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
};

/** A system in "Also for", and on a phone's row of buttons. */
export type AiHeroSystem = {
  readonly key: "mac" | "windows" | "linux";
  readonly label: string;
  /** The system's logo, from /public. */
  readonly image: string;
  readonly href: string;
  readonly ariaLabel: string;
};

export type AiHeroText = {
  readonly armNote: string;
  readonly alsoFor: string;
  readonly allDownloads: string;
  readonly phoneTitle: string;
  readonly phoneBody: string;
  readonly copyLink: string;
  readonly linkCopied: string;
  readonly copyFailed: string;
  readonly shareLink: string;
  readonly phonePlatforms: string;
};

const SYSTEM_OF: Readonly<Record<AiInstallerKind, AiHeroSystem["key"]>> = {
  macos: "mac",
  windows: "windows",
  "linux-x64": "linux",
  "linux-x64-cuda": "linux",
  "linux-arm64": "linux",
};

const QUIET_LINK =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-rounded tw-font-medium tw-text-iron-200 tw-underline tw-decoration-white/25 tw-underline-offset-4 hover:tw-text-white hover:tw-decoration-white/60 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-min-h-0";
const ROW_BUTTON =
  "tw-inline-flex tw-min-h-11 tw-flex-1 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-iron-900 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-border-primary-400/60 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

/** The share sheet's support never changes while the page is open. */
function noSubscription(): () => void {
  return () => undefined;
}

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
      return [];
  }
}

/**
 * On a phone, or a computer the page can't tell: 6529 AI runs on a
 * computer, so the first action passes this page to one.
 */
function PhoneFirst({
  systems,
  text,
}: {
  readonly systems: readonly AiHeroSystem[];
  readonly text: AiHeroText;
}) {
  // The share sheet exists only in the browser, and only on some; the
  // server and the first paint offer Copy link.
  const canShare = useSyncExternalStore(
    noSubscription,
    () => typeof navigator.share === "function",
    () => false
  );
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (copy === "idle") {
      return undefined;
    }
    const timer = setTimeout(() => setCopy("idle"), 2000);
    return () => clearTimeout(timer);
  }, [copy]);

  const pass = async () => {
    const url = `${globalThis.location.origin}/ai`;
    if (canShare) {
      try {
        await navigator.share({ url });
      } catch {
        // A dismissed share sheet is the person's choice: nothing to say.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  };

  let passText = text.copyLink;
  let PassIcon = LinkIcon;
  if (copy === "copied") {
    passText = text.linkCopied;
    PassIcon = CheckIcon;
  } else if (copy === "failed") {
    passText = text.copyFailed;
  } else if (canShare) {
    passText = text.shareLink;
    PassIcon = ShareIcon;
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div>
        <p className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
          {text.phoneTitle}
        </p>
        <p className="tw-m-0 tw-mt-1 tw-text-[15px] tw-leading-6 tw-text-iron-300">
          {text.phoneBody}
        </p>
      </div>
      <button
        type="button"
        onClick={pass}
        className={`${PRIMARY_BUTTON} tw-border-0 sm:tw-w-auto sm:tw-self-start sm:tw-px-8`}
      >
        <PassIcon aria-hidden="true" className="tw-size-6" />
        <span aria-live="polite">{passText}</span>
      </button>
      <div>
        <p className="tw-m-0 tw-mb-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {text.phonePlatforms}
        </p>
        <div className="tw-flex tw-gap-2">
          {systems.map((system) => (
            <a
              key={system.key}
              href={system.href}
              aria-label={system.ariaLabel}
              className={ROW_BUTTON}
            >
              <AiSystemLogo src={system.image} size="sm" />
              {system.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The big button for this computer, what it needs under it, who signed
 * it, and quiet links to the other systems. The server picks the button
 * from the User-Agent header; Chromium's client hints then pick the Linux
 * package for this CPU. A phone gets a way to pass the page on instead.
 */
export default function AiDownloadHero({
  options,
  systems,
  initial,
  text,
}: {
  readonly options: readonly AiHeroOption[];
  readonly systems: readonly AiHeroSystem[];
  readonly initial: VisitorPlatform;
  readonly text: AiHeroText;
}) {
  const platform = useVisitorPlatform(initial);
  const primary = kindsFor(platform)
    .map((kind) => options.find((option) => option.kind === kind))
    .filter((option): option is AiHeroOption => !!option);
  if (primary.length === 0) {
    return <PhoneFirst systems={systems} text={text} />;
  }
  const shown = new Set(primary.map((option) => SYSTEM_OF[option.kind]));
  const others = systems.filter((system) => !shown.has(system.key));
  const bothLinux = primary.length === 2;

  return (
    <div>
      <div
        className={`tw-grid tw-gap-6 ${bothLinux ? "sm:tw-grid-cols-2" : ""}`}
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
      {bothLinux && (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {text.armNote}
        </p>
      )}
      <p className="tw-mb-0 tw-mt-5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-text-sm tw-leading-6">
        <span className="tw-mr-1 tw-text-iron-500">{text.alsoFor}</span>
        {others.map((system) => (
          <span
            key={system.key}
            className="tw-inline-flex tw-items-center tw-gap-2"
          >
            <a
              href={system.href}
              aria-label={system.ariaLabel}
              className={QUIET_LINK}
            >
              {system.label}
            </a>
            <span aria-hidden="true" className="tw-text-iron-600">
              ·
            </span>
          </span>
        ))}
        <a href="#downloads" className={QUIET_LINK}>
          {text.allDownloads}
        </a>
      </p>
    </div>
  );
}
