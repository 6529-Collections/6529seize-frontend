import {
  ArrowDownTrayIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import ValidatorFold from "@/components/validator-page/ValidatorFold";
import { CODE } from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  AI_FIRST_CHAT,
  getAiGuideSystems,
  type AiGuideSystem,
  type AiGuideSystemKey,
} from "@/lib/ai-page/content/guide";
import type { AiRelease } from "@/lib/ai-page/releaseFeed";
import {
  getAiDownloadPath,
  groupAiReleaseFiles,
  type AiInstallerKind,
} from "@/lib/ai-page/releaseFiles";
import { AI_SCREENSHOTS } from "@/lib/ai-page/screenshots";
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";
import AiCodeBlock from "./AiCodeBlock";
import AiGuideSteps, { AiStepBody } from "./AiGuideSteps";
import AiPageFrame, {
  AI_BODY,
  AI_BUTTON,
  AI_CARD,
  AI_H2,
  AI_H3,
  AI_MUTED,
} from "./AiPageFrame";
import AiReportProblem from "./AiReportProblem";
import AiScreenshot from "./AiScreenshot";
import AiSystemLogo from "./AiSystemLogo";
import AiTabs from "./AiTabs";
import { formatAiFileSize } from "./formatAiFileSize";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
const FIRST_MODEL = "qwen3-4b-gguf";
const FIRST_MODEL_SIZE = "2.5 GB";
// The name of the page's Keys screen, as the app shows it.
const KEYS_SCREEN = "Keys";

const IMAGES: Readonly<Record<AiGuideSystemKey, string>> = {
  mac: "/macos.png",
  windows: "/windows.png",
  linux: "/linux.png",
};

/** The downloads each system's "What you need" offers. */
const DOWNLOADS: Readonly<
  Record<
    AiGuideSystemKey,
    readonly { readonly kind: AiInstallerKind; readonly label?: MessageKey }[]
  >
> = {
  mac: [{ kind: "macos" }],
  windows: [{ kind: "windows" }],
  linux: [
    { kind: "linux-x64", label: "ai.files.linux.x64" },
    { kind: "linux-x64-cuda", label: "ai.files.linux.cuda" },
    { kind: "linux-arm64", label: "ai.files.linux.arm64" },
    { kind: "linux-arm64-cuda", label: "ai.files.linux.arm64Cuda" },
  ],
};

/** The visitor's system, or the Mac for a phone or anything else. */
function initialSystem(platform: VisitorPlatform): AiGuideSystemKey {
  return platform.system === "other" ? "mac" : platform.system;
}

function DownloadButtons({
  release,
  system,
}: {
  readonly release: AiRelease | undefined;
  readonly system: AiGuideSystem;
}) {
  if (!release) {
    return null;
  }
  const { installers } = groupAiReleaseFiles(release);
  const buttons = DOWNLOADS[system.key].flatMap(({ kind, label }) => {
    const installer = installers.find((item) => item.kind === kind);
    return installer ? [{ installer, label }] : [];
  });
  if (buttons.length === 0) {
    return null;
  }
  return (
    <div className="tw-mt-5 tw-grid tw-gap-2 sm:tw-flex sm:tw-flex-wrap sm:tw-items-center">
      {buttons.some((button) => button.label) && (
        <span className="tw-text-sm tw-text-iron-400 sm:tw-mr-1">
          {t(LOCALE, "ai.guide.downloadDeb")}
        </span>
      )}
      {buttons.map(({ installer, label }) => {
        const size = formatAiFileSize(installer.file.size);
        const text = label
          ? t(LOCALE, label)
          : t(LOCALE, "ai.guide.download", { system: system.label });
        return (
          <a
            key={installer.kind}
            href={getAiDownloadPath(release, installer.file)}
            className={AI_BUTTON}
            aria-label={t(LOCALE, "ai.download.button.ariaLabel", {
              button: text,
              file: installer.file.name,
            })}
          >
            <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
            {text}
            {size && !label && (
              <span className="tw-font-normal tw-tabular-nums tw-text-iron-400">
                {size}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}

function SystemPanel({
  release,
  system,
}: {
  readonly release: AiRelease | undefined;
  readonly system: AiGuideSystem;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-14">
      <section
        aria-labelledby={`needs-${system.key}`}
        className={`${AI_CARD} tw-p-5`}
      >
        <h2 id={`needs-${system.key}`} className={AI_H3}>
          {t(LOCALE, "ai.guide.needs")}
        </h2>
        <ul className="tw-m-0 tw-mt-3 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
          {system.needs.map((need) => (
            <li
              key={need}
              className="tw-flex tw-gap-2.5 tw-text-sm tw-leading-6 tw-text-iron-300"
            >
              <CheckIcon
                aria-hidden="true"
                className="tw-mt-1 tw-size-4 tw-flex-none tw-text-iron-500"
              />
              <span>{need}</span>
            </li>
          ))}
        </ul>
        <DownloadButtons release={release} system={system} />
      </section>

      <section aria-labelledby={`install-${system.key}`}>
        <h2 id={`install-${system.key}`} className={`tw-mb-5 ${AI_H2}`}>
          {t(LOCALE, "ai.guide.install")}
        </h2>
        <AiGuideSteps
          steps={system.steps}
          screenshots={{
            placement: (
              <AiScreenshot
                slot={AI_SCREENSHOTS.placement}
                alt={t(LOCALE, "ai.guide.placementShot")}
                caption={t(LOCALE, "ai.guide.placementCaption")}
              />
            ),
          }}
        />
        <div className="tw-mt-14">
          <h3 className={`tw-mb-2 ${AI_H3}`}>
            {t(LOCALE, "ai.guide.openAgain")}
          </h3>
          <AiStepBody step={system.openAgain} />
        </div>
      </section>

      <div className="tw-flex tw-flex-col tw-gap-3">
        {system.more && (
          <ValidatorFold small title={system.more.title}>
            <AiStepBody step={system.more.step} />
          </ValidatorFold>
        )}
        <ValidatorFold small title={t(LOCALE, "ai.guide.troubleshooting")}>
          <div className="tw-flex tw-flex-col tw-gap-3">
            <p className={`tw-m-0 ${AI_BODY}`}>
              {t(LOCALE, "ai.guide.troubleshooting.body")}
            </p>
            <AiCodeBlock
              code={system.log.code}
              label={system.log.label}
              what={system.log.code}
            />
          </div>
        </ValidatorFold>
        <ValidatorFold small title={t(LOCALE, "ai.guide.uninstall")}>
          <AiStepBody step={system.uninstall} />
        </ValidatorFold>
      </div>
    </div>
  );
}

/**
 * The install guide: a tab per system, opening on the visitor's, with
 * numbered steps and what each one shows; then the first chat, and where
 * to report a problem.
 */
export default function AiGuidePage({
  release,
  platform,
}: {
  readonly release: AiRelease | undefined;
  readonly platform: VisitorPlatform;
}) {
  const systems = getAiGuideSystems(release);
  return (
    <AiPageFrame
      current="guide"
      eyebrow={t(LOCALE, "ai.guide.eyebrow")}
      version={release?.version}
      title={t(LOCALE, "ai.guide.title")}
      lead={t(LOCALE, "ai.guide.lead")}
    >
      <div className="tw-mt-10">
        <AiTabs
          label={t(LOCALE, "ai.guide.tabs")}
          initial={initialSystem(platform)}
          listClassName="tw-w-full sm:tw-w-auto"
          panelClassName="tw-mt-8"
          tabs={systems.map((system) => ({
            key: system.key,
            label: system.label,
            icon: <AiSystemLogo src={IMAGES[system.key]} size="sm" />,
            panel: <SystemPanel release={release} system={system} />,
          }))}
        />
      </div>

      <section aria-labelledby="first-chat" className="tw-mt-16">
        <h2 id="first-chat" className={`tw-mb-5 ${AI_H2}`}>
          {t(LOCALE, "ai.guide.firstChat")}
        </h2>
        <AiGuideSteps steps={AI_FIRST_CHAT} />
        <div
          className={`${AI_CARD} tw-mt-6 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-px-5 tw-py-4`}
        >
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-primary-300">
            {t(LOCALE, "ai.guide.tryFirst.title")}
          </span>
          <code className="tw-font-mono tw-text-[15px] tw-text-iron-50">
            {FIRST_MODEL}
          </code>
          <span className={AI_MUTED}>
            {t(LOCALE, "ai.guide.tryFirst.body", { size: FIRST_MODEL_SIZE })}
          </span>
        </div>
        <div className="tw-mt-6 empty:tw-hidden">
          <AiScreenshot
            slot={AI_SCREENSHOTS.firstChat}
            alt={t(LOCALE, "ai.guide.chatShot")}
            caption={t(LOCALE, "ai.guide.chatCaption")}
          />
        </div>
      </section>

      <div className="tw-mt-16 tw-flex tw-flex-col tw-gap-6 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-8">
        <section aria-labelledby="validator">
          <h2 id="validator" className={`tw-mb-1 ${AI_H3}`}>
            {t(LOCALE, "ai.guide.validator.title")}
          </h2>
          <p className={`tw-m-0 tw-max-w-2xl ${AI_MUTED}`}>
            {t(LOCALE, "ai.guide.validator.body")}
          </p>
        </section>
        <section aria-labelledby="other-programs">
          <h2 id="other-programs" className={`tw-mb-1 ${AI_H3}`}>
            {t(LOCALE, "ai.guide.api.title")}
          </h2>
          <p className={`tw-m-0 tw-max-w-2xl ${AI_MUTED}`}>
            {tRich(LOCALE, "ai.guide.api.body", {
              path: (
                <code key="path" className={CODE}>
                  /v1
                </code>
              ),
              keys: (
                <strong
                  key="keys"
                  className="tw-font-semibold tw-text-iron-100"
                >
                  {KEYS_SCREEN}
                </strong>
              ),
            })}
          </p>
        </section>
      </div>

      <Link
        href="/ai/use"
        className={`${AI_CARD} tw-group tw-mt-10 tw-flex tw-items-center tw-justify-between tw-gap-4 tw-p-5 tw-no-underline tw-transition hover:tw-border-primary-400/40 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400`}
      >
        <span className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {t(LOCALE, "ai.guide.next")}
          </span>
          <span className={AI_MUTED}>{t(LOCALE, "ai.guide.nextBody")}</span>
        </span>
        <ArrowRightIcon
          aria-hidden="true"
          className="tw-size-5 tw-flex-none tw-text-primary-300 tw-transition group-hover:tw-translate-x-0.5"
        />
      </Link>

      <div className="tw-mt-10">
        <AiReportProblem />
      </div>
    </AiPageFrame>
  );
}
