import {
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { LINK } from "@/components/validator-page/validatorStyles";
import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  getNewestAiRelease,
  type AiRelease,
  type AiReleaseFeedSnapshot,
} from "@/lib/ai-page/releaseFeed";
import {
  getAiDownloadPath,
  groupAiReleaseFiles,
  type AiInstaller,
  type AiInstallerKind,
} from "@/lib/ai-page/releaseFiles";
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";
import { shortCommit } from "@/lib/validator-page/releaseFiles";
import AiDownloadHero, {
  type AiHeroOption,
  type AiHeroText,
} from "./AiDownloadHero";
import AiDownloads from "./AiDownloads";
import AiPageFrame, { AI_BODY, AI_CARD, AI_H2, AI_MUTED } from "./AiPageFrame";
import AiTrustBadges from "./AiTrustBadges";
import AiVerify from "./AiVerify";
import { formatAiFileSize } from "./formatAiFileSize";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
// The feed's day, as a calendar date: the same day in every time zone.
const RELEASE_DATE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const INSTALLER_TEXT: Readonly<
  Record<AiInstallerKind, { button: MessageKey; system: MessageKey }>
> = {
  macos: {
    button: "ai.download.button.macos",
    system: "ai.download.system.macos",
  },
  windows: {
    button: "ai.download.button.windows",
    system: "ai.download.system.windows",
  },
  "linux-x64": {
    button: "ai.download.button.linuxX64",
    system: "ai.download.system.linuxX64",
  },
  "linux-x64-cuda": {
    button: "ai.download.button.linuxCuda",
    system: "ai.download.system.linuxCuda",
  },
  "linux-arm64": {
    button: "ai.download.button.linuxArm64",
    system: "ai.download.system.linuxArm64",
  },
};

function toHeroOption(
  release: AiRelease,
  installer: AiInstaller
): AiHeroOption {
  const text = INSTALLER_TEXT[installer.kind];
  const buttonText = t(LOCALE, text.button);
  const system = t(LOCALE, text.system);
  const size = formatAiFileSize(installer.file.size);
  return {
    kind: installer.kind,
    href: getAiDownloadPath(release, installer.file),
    buttonText,
    buttonLabel: t(LOCALE, "ai.download.button.ariaLabel", {
      button: buttonText,
      file: installer.file.name,
    }),
    meta: size
      ? t(LOCALE, "ai.download.meta", {
          version: release.version,
          size,
          needs: installer.needs,
        })
      : `${release.version} · ${installer.needs}`,
    badges: <AiTrustBadges signed={installer.file.signed} />,
    system,
    systemLabel: t(LOCALE, "ai.download.system.label", {
      system,
      file: installer.file.name,
    }),
  };
}

function heroText(): AiHeroText {
  return {
    armNote: t(LOCALE, "ai.download.armNote"),
    otherNote: t(LOCALE, "ai.download.otherNote"),
    alsoFor: t(LOCALE, "ai.download.alsoFor"),
    allDownloads: t(LOCALE, "ai.download.allDownloads"),
  };
}

/** No release to offer: none uploaded yet, or the list failed to load. */
function NoRelease({
  state,
}: {
  readonly state: AiReleaseFeedSnapshot["state"];
}) {
  return (
    <div className={`${AI_CARD} tw-flex tw-items-start tw-gap-3 tw-p-5`}>
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-flex-none tw-text-iron-400"
      />
      <p className={`tw-m-0 ${AI_BODY}`}>
        {t(
          LOCALE,
          state === "error"
            ? "ai.download.unavailable"
            : "ai.download.notOutYet"
        )}
      </p>
    </div>
  );
}

const HOW: readonly {
  readonly title: MessageKey;
  readonly body: MessageKey;
}[] = [
  { title: "ai.how.install.title", body: "ai.how.install.body" },
  { title: "ai.how.model.title", body: "ai.how.model.body" },
  { title: "ai.how.chat.title", body: "ai.how.chat.body" },
];

/** Install, pick a model, chat: the whole path, in three lines. */
function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="tw-mt-16">
      <h2 id="how-it-works" className={AI_H2}>
        {t(LOCALE, "ai.how.heading")}
      </h2>
      <ol
        role="list"
        className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-3"
      >
        {HOW.map((step, index) => (
          <li key={step.title} className={`${AI_CARD} tw-p-5`}>
            <span
              aria-hidden="true"
              className="tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/15 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-primary-300"
            >
              {index + 1}
            </span>
            <h3 className="tw-mb-1 tw-mt-4 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
              {t(LOCALE, step.title)}
            </h3>
            <p className={`tw-m-0 ${AI_MUTED}`}>{t(LOCALE, step.body)}</p>
            {index === 0 && (
              <Link
                href="/ai/guide"
                className={`tw-mt-3 tw-inline-flex tw-items-center tw-gap-1 tw-text-sm ${LINK}`}
              >
                {t(LOCALE, "ai.how.install.link")}
                <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReleaseLine({ release }: { readonly release: AiRelease }) {
  const commit = shortCommit(release.commit);
  const params = {
    version: release.version,
    date: formatDate(LOCALE, release.date, RELEASE_DATE),
    commit: (
      <span key="commit" className="tw-font-mono">
        {commit}
      </span>
    ),
  };
  return (
    <p className={`tw-m-0 tw-tabular-nums ${AI_MUTED}`}>
      {tRich(
        LOCALE,
        commit
          ? "ai.files.release.withCommit"
          : "ai.files.release.withoutCommit",
        params
      )}
    </p>
  );
}

export default function AiDownloadPage({
  snapshot,
  platform,
}: {
  readonly snapshot: AiReleaseFeedSnapshot;
  /** The server's guess at the visitor's system, from the User-Agent. */
  readonly platform: VisitorPlatform;
}) {
  const release = getNewestAiRelease(snapshot.releases);
  const installers = release ? groupAiReleaseFiles(release).installers : [];
  return (
    <AiPageFrame
      current="download"
      eyebrow={
        release
          ? t(LOCALE, "ai.download.eyebrow.release", {
              version: release.version,
            })
          : t(LOCALE, "ai.download.eyebrow.none")
      }
      title={t(LOCALE, "ai.download.title")}
      lead={t(LOCALE, "ai.download.lead")}
    >
      <section
        id="download"
        aria-label={t(LOCALE, "ai.download.section")}
        className="tw-mt-10 tw-scroll-mt-24"
      >
        {release ? (
          <AiDownloadHero
            options={installers.map((installer) =>
              toHeroOption(release, installer)
            )}
            initial={platform}
            text={heroText()}
          />
        ) : (
          <NoRelease state={snapshot.state} />
        )}
      </section>

      <HowItWorks />

      {release && (
        <section
          id="downloads"
          aria-labelledby="downloads-title"
          className="tw-mt-16 tw-scroll-mt-24"
        >
          <div className="tw-mb-5 tw-flex tw-flex-col tw-gap-1">
            <h2 id="downloads-title" className={AI_H2}>
              {t(LOCALE, "ai.files.heading")}
            </h2>
            <ReleaseLine release={release} />
            {release.notes && (
              <p className={`tw-m-0 tw-whitespace-pre-line ${AI_MUTED}`}>
                {release.notes}
              </p>
            )}
          </div>
          <AiDownloads release={release} />
          <div className="tw-mt-4">
            <AiVerify release={release} />
          </div>
        </section>
      )}
    </AiPageFrame>
  );
}
