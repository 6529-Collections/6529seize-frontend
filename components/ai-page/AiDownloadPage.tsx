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
  getOfferedAiRelease,
  type AiRelease,
  type AiReleaseFeedSnapshot,
} from "@/lib/ai-page/releaseFeed";
import {
  getAiDownloadPath,
  groupAiReleaseFiles,
  type AiInstaller,
  type AiInstallerKind,
} from "@/lib/ai-page/releaseFiles";
import { AI_SCREENSHOTS } from "@/lib/ai-page/screenshots";
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";
import { shortCommit } from "@/lib/validator-page/releaseFiles";
import AiDownloadHero, {
  type AiHeroOption,
  type AiHeroSystem,
  type AiHeroText,
} from "./AiDownloadHero";
import AiDownloads from "./AiDownloads";
import AiPageFrame, { AI_BODY, AI_CARD, AI_H2, AI_MUTED } from "./AiPageFrame";
import AiReleaseAlert from "./AiReleaseAlert";
import AiScreenshot from "./AiScreenshot";
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

const BUTTON_TEXT: Readonly<Record<AiInstallerKind, MessageKey>> = {
  macos: "ai.download.button.macos",
  windows: "ai.download.button.windows",
  "linux-x64": "ai.download.button.linuxX64",
  "linux-x64-cuda": "ai.download.button.linuxCuda",
  "linux-arm64": "ai.download.button.linuxArm64",
  "linux-arm64-cuda": "ai.download.button.linuxArm64Cuda",
};

function toHeroOption(
  release: AiRelease,
  installer: AiInstaller
): AiHeroOption {
  const buttonText = t(LOCALE, BUTTON_TEXT[installer.kind]);
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
      : t(LOCALE, "ai.download.metaWithoutSize", {
          version: release.version,
          needs: installer.needs,
        }),
    badges: <AiTrustBadges file={installer.file} />,
  };
}

/**
 * Mac, Windows and Linux for "Also for" and a phone's row of buttons: the
 * Mac and Windows downloads, and the Linux card, which has a choice.
 */
function heroSystems(
  release: AiRelease,
  installers: readonly AiInstaller[]
): AiHeroSystem[] {
  const systems: AiHeroSystem[] = [];
  for (const [key, kind, message, image] of [
    ["mac", "macos", "ai.download.system.macos", "/macos.png"],
    ["windows", "windows", "ai.download.system.windows", "/windows.png"],
  ] as const) {
    const installer = installers.find((item) => item.kind === kind);
    if (installer) {
      const label = t(LOCALE, message);
      systems.push({
        key,
        label,
        image,
        href: getAiDownloadPath(release, installer.file),
        ariaLabel: t(LOCALE, "ai.download.system.label", {
          system: label,
          file: installer.file.name,
        }),
      });
    }
  }
  if (installers.some((item) => item.family === "linux")) {
    const label = t(LOCALE, "ai.download.system.linux");
    systems.push({
      key: "linux",
      label,
      image: "/linux.png",
      href: "#downloads-linux",
      ariaLabel: label,
    });
  }
  return systems;
}

function heroText(): AiHeroText {
  return {
    armNote: t(LOCALE, "ai.download.armNote"),
    alsoFor: t(LOCALE, "ai.download.alsoFor"),
    allDownloads: t(LOCALE, "ai.download.allDownloads"),
    phoneTitle: t(LOCALE, "ai.download.phone.title"),
    phoneBody: t(LOCALE, "ai.download.phone.body"),
    copyLink: t(LOCALE, "ai.download.phone.copy"),
    linkCopied: t(LOCALE, "ai.download.phone.copied"),
    copyFailed: t(LOCALE, "ai.code.copyFailed"),
    shareLink: t(LOCALE, "ai.download.phone.share"),
    phonePlatforms: t(LOCALE, "ai.download.phone.platforms"),
  };
}

function noReleaseText(
  state: AiReleaseFeedSnapshot["state"],
  newest: AiRelease | undefined
): string {
  if (newest?.unsafeReason) {
    return t(LOCALE, "ai.download.unsafe", { version: newest.version });
  }
  return t(
    LOCALE,
    state === "error" ? "ai.download.unavailable" : "ai.download.notOutYet"
  );
}

/**
 * No release to offer: none uploaded yet, the list failed to load, or it
 * calls the newest release unsafe.
 */
function NoRelease({
  state,
  newest,
}: {
  readonly state: AiReleaseFeedSnapshot["state"];
  readonly newest: AiRelease | undefined;
}) {
  return (
    <div className={`${AI_CARD} tw-flex tw-items-start tw-gap-3 tw-p-5`}>
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-flex-none tw-text-iron-400"
      />
      <p className={`tw-m-0 ${AI_BODY}`}>{noReleaseText(state, newest)}</p>
    </div>
  );
}

const HOW: readonly {
  readonly title: MessageKey;
  readonly body: MessageKey;
  /** Where to read more, and the link's words. */
  readonly href: string;
  readonly link: MessageKey;
}[] = [
  {
    title: "ai.how.install.title",
    body: "ai.how.install.body",
    href: "/ai/guide",
    link: "ai.how.install.link",
  },
  {
    title: "ai.how.model.title",
    body: "ai.how.model.body",
    href: "/ai/models",
    link: "ai.download.more.models",
  },
  {
    title: "ai.how.chat.title",
    body: "ai.how.chat.body",
    href: "/ai/use",
    link: "ai.download.more.use",
  },
];

/** Install, pick a model, chat: the whole path, in three lines. */
function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="tw-mt-16">
      <h2 id="how-it-works" className={AI_H2}>
        {t(LOCALE, "ai.how.heading")}
      </h2>
      <ol className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-3">
        {HOW.map((step, index) => (
          <li
            key={step.title}
            className={`${AI_CARD} tw-flex tw-gap-4 tw-p-4 sm:tw-block sm:tw-p-5`}
          >
            <span
              aria-hidden="true"
              className="tw-flex tw-size-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/15 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-primary-300"
            >
              {index + 1}
            </span>
            <div className="tw-min-w-0">
              <h3 className="tw-mb-1 tw-mt-0.5 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 sm:tw-mt-4">
                {t(LOCALE, step.title)}
              </h3>
              <p className={`tw-m-0 ${AI_MUTED}`}>{t(LOCALE, step.body)}</p>
              <Link
                href={step.href}
                className={`tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1 tw-text-sm sm:tw-min-h-0 ${LINK}`}
              >
                {t(LOCALE, step.link)}
                <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
              </Link>
            </div>
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
  const newest = getNewestAiRelease(snapshot.releases);
  const release = getOfferedAiRelease(snapshot.releases);
  const installers = release ? groupAiReleaseFiles(release).installers : [];
  return (
    <AiPageFrame
      current="download"
      eyebrow={t(LOCALE, "ai.download.eyebrow")}
      version={newest?.version}
      title={t(LOCALE, "ai.download.title")}
      lead={t(LOCALE, "ai.download.lead")}
      alert={
        newest && <AiReleaseAlert release={newest} support={snapshot.support} />
      }
    >
      <section
        id="download"
        aria-label={t(LOCALE, "ai.download.section")}
        className="tw-mt-8 tw-scroll-mt-24"
      >
        {release ? (
          <AiDownloadHero
            options={installers.map((installer) =>
              toHeroOption(release, installer)
            )}
            systems={heroSystems(release, installers)}
            initial={platform}
            text={heroText()}
          />
        ) : (
          <NoRelease state={snapshot.state} newest={newest} />
        )}
      </section>

      <div className="tw-mt-10 empty:tw-hidden">
        <AiScreenshot
          slot={AI_SCREENSHOTS.models}
          alt={t(LOCALE, "ai.download.screenshot")}
          phoneAlt={t(LOCALE, "ai.download.screenshotPhone")}
          caption={t(LOCALE, "ai.download.screenshotCaption")}
        />
      </div>

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
          </div>
          <AiDownloads release={release} platform={platform} />
          <div className="tw-mt-4">
            <AiVerify release={release} />
          </div>
        </section>
      )}
    </AiPageFrame>
  );
}
