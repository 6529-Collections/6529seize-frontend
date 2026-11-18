"use client";

import Image from "next/image";
import { type KeyboardEvent, type ReactNode, useId, useState } from "react";

import { ABOUT_CARD_CLASS_NAME } from "@/components/about/AboutLayout";
import {
  CONNECTED_TAB_INTERACTION_CLASSES,
  CONNECTED_TAB_SURFACE_CLASSES,
  getConnectedTabStateClasses,
} from "@/components/utils/select/tabs/connectedTabStyles";
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";
import CopyChecksumButton from "./CopyChecksumButton";
import { useVisitorPlatform } from "./useVisitorPlatform";
import ValidatorFold from "./ValidatorFold";
import { BODY, CODE, LINK } from "./validatorStyles";

type SystemKey = "mac" | "windows" | "linux";

/** This release's two .deb file names, or null while no release is out. */
export type ValidatorDebs = {
  readonly x64: string;
  readonly arm64: string;
} | null;

type Picture = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  /** A drawing says so under it; a screenshot says where it is from. */
  readonly drawing: boolean;
};

type Step = {
  readonly title: string;
  readonly text: ReactNode;
  readonly picture: Picture | "linux-commands";
};

const OPEN_ON_MAC: Picture = {
  src: "/validator/mac-open.svg",
  width: 400,
  height: 240,
  alt: "A drawing of the macOS question: “6529 Validator” is an app downloaded from the Internet. Are you sure you want to open it? The Open button is circled.",
  drawing: true,
};
const OPEN_ON_WINDOWS: Picture = {
  src: "/validator/windows-smartscreen.svg",
  width: 400,
  height: 240,
  alt: "A drawing of Windows protected your PC after More info. App: 6529-Validator-Setup-0.1.0-x64.exe. Publisher: 6529 Collection LLC, circled, and the Run anyway button, circled.",
  drawing: true,
};
const STOP_ON_MAC: Picture = {
  src: "/validator/mac-stop.svg",
  width: 400,
  height: 240,
  alt: "A drawing of the macOS 15 warning: “6529 Validator” Not Opened. Apple could not verify “6529 Validator” is free of malware that may harm your Mac or compromise your privacy. Buttons: Done, Move to Trash.",
  drawing: true,
};
const WINDOWS_PERMISSION: Picture = {
  src: "/validator/windows-uac.svg",
  width: 400,
  height: 240,
  alt: "A drawing of User Account Control: Do you want to allow this app to make changes to your device? 6529 Validator. Verified publisher: 6529 Collection LLC, circled. Buttons: Yes, No.",
  drawing: true,
};
const AUTHORIZE: Picture = {
  src: "/validator/app-authorize.webp",
  width: 760,
  height: 358,
  alt: "The app's Authorize step: Authorize with your wallet. Your wallet signs one message. It costs no gas and moves nothing.",
  drawing: false,
};
const TODAY: Picture = {
  src: "/validator/app-today.webp",
  width: 760,
  height: 372,
  alt: "The app's Today page after setup: You're set. Your first signature is tomorrow.",
  drawing: false,
};

// Step 2, from TESTERS.md; from rc.10 a wallet on a phone signs from a code.
const SIGN_ONCE =
  "It makes this computer's key and asks your wallet to sign once. That sends no transaction and costs nothing. If your wallet is in another browser, press Copy sign-in link and open the link there. If it's on your phone, choose Your phone (Use your phone in the app's window), paste the wallet's address and scan the code.";

// The app's Starting screen and its stuck step (rc.8, crates/app pages.rs).
const WHILE_IT_STARTS =
  "While the validator service starts, the app shows each step and what it is doing now. If one takes too long, the app says which, with Restart the validator service and Show the log.";

const LEAVE_IT_RUNNING: Step = {
  title: "Leave it running",
  text: "It signs once a day by itself.",
  picture: TODAY,
};

const STEPS: Record<SystemKey, readonly Step[]> = {
  mac: [
    {
      title: "Open it",
      text: "Drag 6529 Validator to Applications, then open it from Applications, never from the disk image. When macOS asks if you're sure, press Open.",
      picture: OPEN_ON_MAC,
    },
    { title: "Follow the app", text: SIGN_ONCE, picture: AUTHORIZE },
    LEAVE_IT_RUNNING,
  ],
  windows: [
    {
      title: "Open it",
      text: "If Windows warns you, press More info, check it says 6529 Collection LLC, then Run anyway.",
      picture: OPEN_ON_WINDOWS,
    },
    { title: "Follow the app", text: SIGN_ONCE, picture: AUTHORIZE },
    LEAVE_IT_RUNNING,
  ],
  linux: [
    {
      title: "Install it",
      text: "In a terminal, in the folder you saved it to, run:",
      picture: "linux-commands",
    },
    {
      title: "Follow the page",
      text: (
        <>
          Open 6529 Validator from your apps, or run{" "}
          <code className={CODE}>validator open</code>. {SIGN_ONCE}
        </>
      ),
      picture: AUTHORIZE,
    },
    LEAVE_IT_RUNNING,
  ],
};

const SYSTEMS: readonly { readonly key: SystemKey; readonly label: string }[] =
  [
    { key: "mac", label: "Mac" },
    { key: "windows", label: "Windows" },
    { key: "linux", label: "Linux" },
  ];

function defaultSystem(platform: VisitorPlatform): SystemKey {
  if (platform.system === "windows" || platform.system === "linux") {
    return platform.system;
  }
  return "mac";
}

function StepPicture({ picture }: { readonly picture: Picture }) {
  return (
    <figure className="tw-m-0 tw-w-full max-lg:tw-max-w-md">
      <Image
        unoptimized
        src={picture.src}
        alt={picture.alt}
        width={picture.width}
        height={picture.height}
        className="tw-block tw-h-auto tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08]"
      />
      <figcaption className="tw-mt-2 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
        {picture.drawing ? "What you'll see (a drawing)" : "From the app"}
      </figcaption>
    </figure>
  );
}

function LinuxCommands({
  platform,
  debs,
}: {
  readonly platform: VisitorPlatform;
  readonly debs: ValidatorDebs;
}) {
  if (!debs) {
    return (
      <p
        className={`tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black tw-p-4 ${BODY}`}
      >
        The command appears here once the test release is out.
      </p>
    );
  }
  const commands = [
    { cpu: "x86-64", command: `sudo apt install ./${debs.x64}` },
    { cpu: "ARM64", command: `sudo apt install ./${debs.arm64}` },
  ].filter(
    (entry) =>
      platform.cpu === null ||
      (platform.cpu === "arm64") === (entry.cpu === "ARM64")
  );
  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black tw-p-4 max-lg:tw-max-w-md">
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
        Ubuntu, Debian, Mint and Raspberry Pi OS
      </p>
      {commands.map((entry) => (
        <div key={entry.cpu}>
          {commands.length > 1 && (
            <p className="tw-mb-1 tw-mt-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
              {entry.cpu}
            </p>
          )}
          <div className="tw-flex tw-items-start tw-gap-3">
            <code className="tw-min-w-0 tw-flex-1 tw-break-all tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100">
              {entry.command}
            </code>
            <CopyChecksumButton
              value={entry.command}
              label={`the ${entry.cpu} install command`}
            />
          </div>
        </div>
      ))}
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        On Fedora or another Linux on Intel or AMD, use the AppImage instead:
        make it executable and open it.
      </p>
    </div>
  );
}

function MoreForSystem({ system }: { readonly system: SystemKey }) {
  if (system === "mac") {
    return (
      <ValidatorFold small title="What else you'll see on a Mac">
        <ul
          className={`tw-mb-4 tw-mt-0 tw-list-disc tw-space-y-2 tw-pl-6 ${BODY}`}
        >
          <li>
            macOS says Background Items Added. That is the validator, which runs
            whenever you are logged in.
          </li>
          <li>{WHILE_IT_STARTS}</li>
          <li>
            If macOS says it could not verify the app, or that Apple can&apos;t
            check it, press Move to Trash and tell us. Don&apos;t press Open
            Anyway in System Settings.
          </li>
        </ul>
        <div className="tw-max-w-sm">
          <StepPicture picture={STOP_ON_MAC} />
        </div>
      </ValidatorFold>
    );
  }
  if (system === "windows") {
    return (
      <ValidatorFold small title="What else you'll see on Windows">
        <ol
          className={`tw-mb-4 tw-mt-0 tw-list-decimal tw-space-y-2 tw-pl-6 ${BODY}`}
        >
          <li>In the installer&apos;s window, press Install.</li>
          <li>
            Windows asks if you want to allow changes. Check that it says
            Verified publisher: 6529 Collection LLC, then press Yes. If it names
            another publisher, or none, press No.
          </li>
          <li>
            When it&apos;s done, press Launch. The app&apos;s window opens, and
            6529&apos;s logo appears by the clock.
          </li>
          <li>{WHILE_IT_STARTS}</li>
        </ol>
        <p className={`tw-mb-4 tw-mt-0 ${BODY}`}>
          If an earlier test release is installed, run the new Setup.exe over
          it. It replaces the earlier release, removes any extra 6529 Validator
          entries in Installed apps, and keeps your key and your records.
        </p>
        <div className="tw-max-w-sm">
          <StepPicture picture={WINDOWS_PERMISSION} />
        </div>
      </ValidatorFold>
    );
  }
  return (
    <ValidatorFold small title="What else you need on Linux">
      <p className={`tw-m-0 ${BODY}`}>
        Linux needs glibc 2.35 or newer: Ubuntu 22.04, Debian 12, Linux Mint 21,
        Raspberry Pi OS Bookworm (64-bit) or newer. The rest is under{" "}
        <a href="#linux-and-the-terminal" className={LINK}>
          Linux and the terminal
        </a>
        .
      </p>
    </ValidatorFold>
  );
}

/**
 * The three steps, for this computer's system first and the others one tab
 * away. The app explains everything else on its own screens.
 */
export default function ValidatorSteps({
  initial,
  debs,
}: {
  readonly initial: VisitorPlatform;
  /** The .deb file names, for the Linux install command. */
  readonly debs: ValidatorDebs;
}) {
  const platform = useVisitorPlatform(initial);
  const [chosen, setChosen] = useState<SystemKey | null>(null);
  const system = chosen ?? defaultSystem(platform);
  const baseId = useId();
  const tabId = (key: SystemKey) => `${baseId}-tab-${key}`;
  const panelId = `${baseId}-panel`;

  // Arrow keys, Home and End move between the tabs, as in the ARIA
  // Authoring Practices.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = SYSTEMS.findIndex((entry) => entry.key === system);
    const targets: Record<string, number> = {
      ArrowRight: (index + 1) % SYSTEMS.length,
      ArrowLeft: (index + SYSTEMS.length - 1) % SYSTEMS.length,
      Home: 0,
      End: SYSTEMS.length - 1,
    };
    const nextIndex = targets[event.key];
    if (nextIndex === undefined) {
      return;
    }
    event.preventDefault();
    const next = SYSTEMS[nextIndex]!.key;
    setChosen(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Steps for your system"
        onKeyDown={onKeyDown}
        className={`${CONNECTED_TAB_SURFACE_CLASSES} tw-mb-4 tw-inline-flex tw-border tw-border-solid tw-p-1`}
      >
        {SYSTEMS.map((entry) => {
          const selected = entry.key === system;
          return (
            <button
              key={entry.key}
              id={tabId(entry.key)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setChosen(entry.key)}
              className={`tw-min-h-9 tw-rounded-md tw-border-0 tw-px-4 tw-text-sm tw-font-medium ${CONNECTED_TAB_INTERACTION_CLASSES} ${getConnectedTabStateClasses({ isActive: selected })}`}
            >
              {entry.label}
            </button>
          );
        })}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={tabId(system)}>
        <ol className="tw-m-0 tw-grid tw-list-none tw-gap-4 tw-p-0">
          {STEPS[system].map((step, index) => (
            <li
              key={step.title}
              className={`${ABOUT_CARD_CLASS_NAME} tw-grid tw-items-center tw-gap-5 tw-p-5 md:tw-p-6 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:tw-gap-8`}
            >
              <div className="tw-min-w-0">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <span
                    aria-hidden="true"
                    className="tw-text-primary-200 tw-flex tw-size-8 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/15 tw-text-sm tw-font-semibold"
                  >
                    {index + 1}
                  </span>
                  <h3 className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-8 tw-text-iron-50">
                    <span className="tw-sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                </div>
                <p className={`tw-mb-0 tw-mt-2 ${BODY}`}>{step.text}</p>
              </div>
              {step.picture === "linux-commands" ? (
                <LinuxCommands platform={platform} debs={debs} />
              ) : (
                <StepPicture picture={step.picture} />
              )}
            </li>
          ))}
        </ol>
        <div className="tw-mt-4">
          <MoreForSystem system={system} />
        </div>
      </div>
    </div>
  );
}
