import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

import { SECONDARY_BUTTON } from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import type { AiRelease } from "@/lib/ai-page/releaseFeed";
import {
  getAiDownloadPath,
  groupAiReleaseFiles,
  type AiFileEntry,
  type AiFileFamily,
} from "@/lib/ai-page/releaseFiles";
import AiCopyButton from "./AiCopyButton";
import { AI_CARD } from "./AiPageFrame";
import AiTrustBadges from "./AiTrustBadges";
import { formatAiFileSize } from "./formatAiFileSize";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

const FAMILY: Readonly<
  Record<
    AiFileFamily,
    {
      readonly title: MessageKey;
      readonly needs: MessageKey;
      readonly image: string | null;
    }
  >
> = {
  mac: {
    title: "ai.files.family.mac",
    needs: "ai.files.needs.mac",
    image: "/macos.png",
  },
  windows: {
    title: "ai.files.family.windows",
    needs: "ai.files.needs.windows",
    image: "/windows.png",
  },
  linux: {
    title: "ai.files.family.linux",
    needs: "ai.files.needs.linux",
    image: "/linux.png",
  },
  checks: {
    title: "ai.files.family.checks",
    needs: "ai.files.needs.checks",
    image: null,
  },
};

function FileRow({
  release,
  entry,
}: {
  readonly release: AiRelease;
  readonly entry: AiFileEntry;
}) {
  const { file } = entry;
  const size = formatAiFileSize(file.size);
  return (
    <li className="tw-flex tw-flex-col tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-4 first:tw-border-t-0 sm:tw-flex-row sm:tw-items-center sm:tw-gap-4 sm:tw-px-5">
      <div className="tw-min-w-0 tw-flex-1">
        <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-text-[15px] tw-leading-6">
          <span className="tw-font-semibold tw-text-iron-50">
            {entry.label}
          </span>
          <span className="tw-text-iron-400">{entry.detail}</span>
        </p>
        <p className="tw-m-0 tw-mt-0.5 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-text-xs tw-leading-5 tw-text-iron-500">
          <span className="tw-break-all tw-font-mono">{file.name}</span>
          {size && (
            <span className="tw-whitespace-nowrap tw-tabular-nums tw-text-iron-400">
              {size}
            </span>
          )}
        </p>
        <div className="tw-mt-2 empty:tw-hidden">
          <AiTrustBadges signed={file.signed} />
        </div>
      </div>
      <div className="tw-flex tw-flex-none tw-items-center tw-gap-2">
        <AiCopyButton
          value={file.sha256}
          text={t(LOCALE, "ai.files.sha256")}
          copiedText={t(LOCALE, "ai.code.copied")}
          label={t(LOCALE, "ai.files.sha256.label", { file: file.name })}
          copiedLabel={t(LOCALE, "ai.code.copied")}
        />
        <span className="tw-sr-only">{file.sha256}</span>
        <a
          href={getAiDownloadPath(release, file)}
          className={`${SECONDARY_BUTTON} max-sm:tw-flex-1`}
          aria-label={t(LOCALE, "ai.files.download.label", {
            file: file.name,
          })}
        >
          <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
          {t(LOCALE, "ai.files.download.text")}
        </a>
      </div>
    </li>
  );
}

/**
 * Every file of the release, by system, each with who signed it, its
 * SHA-256 behind a copy button, and its download.
 */
export default function AiDownloads({
  release,
}: {
  readonly release: AiRelease;
}) {
  const { groups } = groupAiReleaseFiles(release);
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {groups.map((group) => {
        const family = FAMILY[group.family];
        const headingId = `downloads-${group.family}`;
        return (
          <section
            key={group.family}
            aria-labelledby={headingId}
            className={AI_CARD}
          >
            <div className="tw-flex tw-items-center tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 sm:tw-px-5">
              {family.image && (
                <span className="tw-flex tw-size-8 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-bg-white">
                  <Image
                    unoptimized
                    src={family.image}
                    alt=""
                    width={18}
                    height={18}
                    className="tw-size-[18px] tw-object-contain"
                  />
                </span>
              )}
              <div className="tw-min-w-0">
                <h3
                  id={headingId}
                  className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
                >
                  {t(LOCALE, family.title)}
                </h3>
                <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
                  {t(LOCALE, family.needs)}
                </p>
              </div>
            </div>
            <ul className="tw-m-0 tw-list-none tw-p-0">
              {group.entries.map((entry) => (
                <FileRow
                  key={entry.file.name}
                  release={release}
                  entry={entry}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
