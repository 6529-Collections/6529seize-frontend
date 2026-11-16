import { ArrowDownTrayIcon, CheckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import ValidatorFold from "@/components/validator-page/ValidatorFold";
import {
  CODE,
  LINK,
  SECONDARY_BUTTON,
} from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich } from "@/i18n/messages";
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
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";
import AiCodeBlock from "./AiCodeBlock";
import AiGuideSteps, { AiStepBody } from "./AiGuideSteps";
import AiPageFrame, { AI_CARD, AI_H2, AI_H3, AI_MUTED } from "./AiPageFrame";
import AiSystemTabs from "./AiSystemTabs";
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

const INSTALLER_OF: Readonly<
  Partial<Record<AiGuideSystemKey, AiInstallerKind>>
> = {
  mac: "macos",
  windows: "windows",
};

/** The visitor's system, or the Mac for a phone or anything else. */
function initialSystem(platform: VisitorPlatform): AiGuideSystemKey {
  return platform.system === "other" ? "mac" : platform.system;
}

function DownloadLink({
  release,
  system,
}: {
  readonly release: AiRelease | undefined;
  readonly system: AiGuideSystem;
}) {
  const kind = INSTALLER_OF[system.key];
  const installer =
    release && kind
      ? groupAiReleaseFiles(release).installers.find(
          (item) => item.kind === kind
        )
      : undefined;
  if (!release || !installer) {
    return (
      <Link href="/ai#downloads" className={`tw-text-sm ${LINK}`}>
        {t(LOCALE, "ai.guide.downloads")}
      </Link>
    );
  }
  const size = formatAiFileSize(installer.file.size);
  return (
    <a
      href={getAiDownloadPath(release, installer.file)}
      className={SECONDARY_BUTTON}
      aria-label={t(LOCALE, "ai.files.download.label", {
        file: installer.file.name,
      })}
    >
      <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
      {t(LOCALE, "ai.guide.download", { system: system.label })}
      {size && (
        <span className="tw-font-normal tw-tabular-nums tw-text-iron-400">
          {size}
        </span>
      )}
    </a>
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
    <div className="tw-flex tw-flex-col tw-gap-10">
      <section
        aria-labelledby={`needs-${system.key}`}
        className={`${AI_CARD} tw-p-5`}
      >
        <h2 id={`needs-${system.key}`} className={AI_H3}>
          {t(LOCALE, "ai.guide.needs")}
        </h2>
        <ul className="tw-m-0 tw-mt-3 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
          {system.needs.map((need) => (
            <li key={need} className={`tw-flex tw-gap-2.5 ${AI_MUTED}`}>
              <CheckIcon
                aria-hidden="true"
                className="tw-mt-1 tw-size-4 tw-flex-none tw-text-iron-500"
              />
              <span className="tw-text-iron-300">{need}</span>
            </li>
          ))}
        </ul>
        <div className="tw-mt-4">
          <DownloadLink release={release} system={system} />
        </div>
      </section>

      <section aria-labelledby={`install-${system.key}`}>
        <h2 id={`install-${system.key}`} className={`tw-mb-5 ${AI_H2}`}>
          {t(LOCALE, "ai.guide.install")}
        </h2>
        <AiGuideSteps steps={system.steps} />
      </section>

      <div className="tw-grid tw-gap-6 sm:tw-grid-cols-2">
        <section aria-labelledby={`again-${system.key}`}>
          <h3 id={`again-${system.key}`} className={`tw-mb-2 ${AI_H3}`}>
            {t(LOCALE, "ai.guide.openAgain")}
          </h3>
          <AiStepBody step={system.openAgain} />
        </section>
        <section aria-labelledby={`log-${system.key}`}>
          <h3 id={`log-${system.key}`} className={`tw-mb-2 ${AI_H3}`}>
            {t(LOCALE, "ai.guide.log")}
          </h3>
          <AiCodeBlock
            code={system.log.code}
            what={t(LOCALE, "ai.guide.log")}
          />
        </section>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-3">
        {system.more && (
          <ValidatorFold small title={system.more.title}>
            <AiStepBody step={system.more.step} />
          </ValidatorFold>
        )}
        <ValidatorFold small title={t(LOCALE, "ai.guide.uninstall")}>
          <AiStepBody step={system.uninstall} />
        </ValidatorFold>
      </div>
    </div>
  );
}

/**
 * The install guide: a tab per system, opening on the visitor's, with
 * numbered steps and what each one shows; then the first chat.
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
      title={t(LOCALE, "ai.guide.title")}
      lead={t(LOCALE, "ai.guide.lead")}
    >
      <div className="tw-mt-10">
        <AiSystemTabs
          label={t(LOCALE, "ai.guide.tabs")}
          initial={initialSystem(platform)}
          tabs={systems.map((system) => ({
            key: system.key,
            label: system.label,
            image: IMAGES[system.key],
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
      </section>

      <div className="tw-mt-16 tw-grid tw-gap-3 sm:tw-grid-cols-2">
        <section aria-labelledby="validator" className={`${AI_CARD} tw-p-5`}>
          <h2 id="validator" className={`tw-mb-2 ${AI_H3}`}>
            {t(LOCALE, "ai.guide.validator.title")}
          </h2>
          <p className={`tw-m-0 ${AI_MUTED}`}>
            {t(LOCALE, "ai.guide.validator.body")}
          </p>
        </section>
        <section
          aria-labelledby="other-programs"
          className={`${AI_CARD} tw-p-5`}
        >
          <h2 id="other-programs" className={`tw-mb-2 ${AI_H3}`}>
            {t(LOCALE, "ai.guide.api.title")}
          </h2>
          <p className={`tw-m-0 ${AI_MUTED}`}>
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
    </AiPageFrame>
  );
}
