import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import type { AiRelease, AiSystem } from "@/lib/ai-page/releaseFeed";
import {
  getAiDownloadPath,
  groupAiReleaseFiles,
  type AiFileEntry,
} from "@/lib/ai-page/releaseFiles";
import AiCopyButton from "./AiCopyButton";
import { AI_BUTTON, AI_CARD } from "./AiPageFrame";
import AiSystemLogo from "./AiSystemLogo";
import AiTabs from "./AiTabs";
import AiTrustBadges from "./AiTrustBadges";
import { formatAiFileSize } from "./formatAiFileSize";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

const LINUX_VARIANTS: readonly {
  readonly key: string;
  readonly system: AiSystem;
  readonly label: MessageKey;
}[] = [
  { key: "x64", system: "linux-x86_64-cpu", label: "ai.files.linux.x64" },
  { key: "cuda", system: "linux-x86_64-cuda", label: "ai.files.linux.cuda" },
  { key: "arm64", system: "linux-arm64-cpu", label: "ai.files.linux.arm64" },
];

/** The system a single-file card is for: its name, logo and needs. */
type FileRowSystem = {
  readonly id: string;
  readonly title: string;
  readonly needs: string;
  readonly image: string;
};

/**
 * One file: what it is, its name and size, who signed it, its actions.
 * With `system`, the row is a whole card: the system's logo and name lead
 * it, and its needs replace the file's detail line.
 */
function FileRow({
  release,
  entry,
  system,
}: {
  readonly release: AiRelease;
  readonly entry: AiFileEntry;
  readonly system?: FileRowSystem | undefined;
}) {
  const { file } = entry;
  const size = formatAiFileSize(file.size);
  return (
    <li className="tw-flex tw-flex-col tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-4 first:tw-border-t-0 sm:tw-flex-row sm:tw-items-center sm:tw-gap-4 sm:tw-px-5">
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
        {system && <AiSystemLogo src={system.image} />}
        <div className="tw-min-w-0 tw-flex-1">
          {system ? (
            <>
              <h3
                id={system.id}
                className="tw-m-0 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
              >
                {system.title}
                <span className="tw-text-[13px] tw-font-normal tw-text-iron-400">
                  {entry.label}
                </span>
              </h3>
              <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-400">
                {system.needs}
              </p>
            </>
          ) : (
            <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-text-[15px] tw-leading-6">
              <span className="tw-font-semibold tw-text-iron-50">
                {entry.label}
              </span>
              <span className="tw-text-[13px] tw-text-iron-400">
                {entry.detail}
              </span>
            </p>
          )}
          <p className="tw-m-0 tw-mt-0.5 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-text-[13px] tw-leading-5">
            <span className="tw-break-all tw-font-mono tw-text-iron-400">
              {file.name}
            </span>
            {size && (
              <span className="tw-whitespace-nowrap tw-tabular-nums tw-text-iron-300">
                {size}
              </span>
            )}
          </p>
          <div className="tw-mt-2 empty:tw-hidden">
            <AiTrustBadges signed={file.signed} />
          </div>
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
          className={`${AI_BUTTON} max-sm:tw-flex-1`}
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

function SystemCard({
  id,
  title,
  needs,
  image,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly needs: string;
  readonly image: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`${AI_CARD} tw-scroll-mt-24`}
    >
      <div className="tw-flex tw-flex-col tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-px-5">
        <div className="tw-flex tw-items-center tw-gap-3">
          <AiSystemLogo src={image} />
          <div className="tw-min-w-0">
            <h3
              id={`${id}-title`}
              className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
            >
              {title}
            </h3>
            <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-400">
              {needs}
            </p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * The downloads by system: the Mac app, the Windows installer, and for
 * Linux the .deb and the .tar.gz of the CPU chosen in a switch. Each row
 * has its signature badges and its SHA-256 behind a copy button.
 */
export default function AiDownloads({
  release,
  linuxCpu,
}: {
  readonly release: AiRelease;
  /** The visitor's Linux CPU when the page knows it, for the switch. */
  readonly linuxCpu: "x64" | "arm64" | null;
}) {
  const { groups } = groupAiReleaseFiles(release);
  const entries = (family: string) =>
    groups.find((group) => group.family === family)?.entries ?? [];
  const linux = entries("linux");
  const variants = LINUX_VARIANTS.map((variant) => ({
    ...variant,
    files: linux.filter((entry) => entry.file.system === variant.system),
  })).filter((variant) => variant.files.length > 0);

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {(["mac", "windows"] as const).map((family) => {
        const [entry] = entries(family);
        if (!entry) {
          return null;
        }
        const id = `downloads-${family}`;
        return (
          <section
            key={family}
            id={id}
            aria-labelledby={`${id}-title`}
            className={`${AI_CARD} tw-scroll-mt-24`}
          >
            <ul className="tw-m-0 tw-list-none tw-p-0">
              <FileRow
                release={release}
                entry={entry}
                system={{
                  id: `${id}-title`,
                  title: t(LOCALE, `ai.files.family.${family}`),
                  needs: t(LOCALE, `ai.files.needs.${family}`),
                  image: family === "mac" ? "/macos.png" : "/windows.png",
                }}
              />
            </ul>
          </section>
        );
      })}
      {variants.length > 0 && (
        <SystemCard
          id="downloads-linux"
          title={t(LOCALE, "ai.files.family.linux")}
          needs={t(LOCALE, "ai.files.needs.linux")}
          image="/linux.png"
        >
          <AiTabs
            label={t(LOCALE, "ai.files.linux.switch")}
            initial={linuxCpu === "arm64" ? "arm64" : "x64"}
            listClassName="tw-mx-4 tw-mt-3 sm:tw-mx-5"
            panelClassName="tw-mt-1"
            tabs={variants.map((variant) => ({
              key: variant.key,
              label: t(LOCALE, variant.label),
              panel: (
                <ul className="tw-m-0 tw-list-none tw-p-0">
                  {variant.files.map((entry) => (
                    <FileRow
                      key={entry.file.name}
                      release={release}
                      entry={entry}
                    />
                  ))}
                </ul>
              ),
            }))}
          />
        </SystemCard>
      )}
    </div>
  );
}
