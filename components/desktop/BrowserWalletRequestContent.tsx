"use client";

import type { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type {
  WalletDropContent,
  WalletRequestContent,
} from "@/lib/desktop/walletRequestContext";

type Locale = ReturnType<typeof useBrowserLocale>;

const BOX_CLASS =
  "tw-m-0 tw-max-h-72 tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-lg tw-bg-iron-900 tw-p-3 tw-text-sm tw-text-iron-100";
const SUMMARY_CLASS =
  "tw-cursor-pointer tw-font-semibold focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

function DropSummary({
  drop,
  locale,
}: {
  readonly drop: WalletDropContent;
  readonly locale: Locale;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <p className="tw-m-0 tw-break-all tw-text-sm tw-text-iron-300">
        {t(locale, "browserConnector.wallet.content.wave", {
          waveId: drop.waveId,
        })}
      </p>
      {drop.replyToDropId !== null && (
        <p className="tw-m-0 tw-break-all tw-text-sm tw-text-iron-300">
          {t(locale, "browserConnector.wallet.content.replyTo", {
            dropId: drop.replyToDropId,
          })}
        </p>
      )}
      {drop.title !== null && (
        <p className="tw-m-0 tw-break-words tw-font-semibold">{drop.title}</p>
      )}
      {drop.parts.map((part, index) => (
        // Parts have no ids; their order is part of what is signed.
        <div key={`part-${index}`} className="tw-flex tw-flex-col tw-gap-1">
          <p className={BOX_CLASS}>
            {part.text ?? t(locale, "browserConnector.wallet.content.noText")}
          </p>
          {part.quotedDropId !== null && (
            <p className="tw-m-0 tw-break-all tw-text-sm tw-text-iron-300">
              {t(locale, "browserConnector.wallet.content.quote", {
                dropId: part.quotedDropId,
              })}
            </p>
          )}
          {part.media.map((media) => (
            <p
              key={`${media.mimeType} ${media.url}`}
              className="tw-m-0 tw-break-all tw-text-sm tw-text-iron-300"
            >
              {t(locale, "browserConnector.wallet.content.media", {
                mimeType: media.mimeType,
                url: media.url,
              })}
            </p>
          ))}
          {part.attachments > 0 && (
            <p className="tw-m-0 tw-text-sm tw-text-iron-300">
              {t(locale, "browserConnector.wallet.content.attachments", {
                count: formatNumber(locale, part.attachments),
              })}
            </p>
          )}
        </div>
      ))}
      {drop.metadata.length > 0 && (
        <dl className="tw-m-0 tw-flex tw-flex-col tw-gap-1 tw-text-sm">
          {drop.metadata.map((item) => (
            <div key={`${item.key}=${item.value}`} className="tw-flex tw-gap-2">
              <dt className="tw-text-iron-400">{item.key}</dt>
              <dd className="tw-m-0 tw-break-all tw-text-iron-100">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function ContentSummary({
  content,
  locale,
}: {
  readonly content: WalletRequestContent;
  readonly locale: Locale;
}) {
  if (content.kind === "decisionVote") {
    return (
      <div className="tw-flex tw-flex-col tw-gap-1">
        <p className="tw-m-0 tw-break-all tw-font-semibold">
          {t(locale, "browserConnector.wallet.content.vote", {
            value: formatNumber(locale, content.value, {
              maximumFractionDigits: 20,
            }),
            entryId: content.entryId,
          })}
        </p>
        <p className="tw-m-0 tw-break-all tw-text-sm tw-text-iron-300">
          {t(locale, "browserConnector.wallet.content.decision", {
            competitionId: content.competitionId,
            waveId: content.waveId,
          })}
        </p>
      </div>
    );
  }
  if (content.kind === "decisionEntry") {
    return (
      <div className="tw-flex tw-flex-col tw-gap-2">
        <p className="tw-m-0 tw-break-all tw-text-sm tw-text-iron-300">
          {t(locale, "browserConnector.wallet.content.decision", {
            competitionId: content.competitionId,
            waveId: content.waveId,
          })}
        </p>
        <DropSummary drop={content.drop} locale={locale} />
      </div>
    );
  }
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <DropSummary drop={content.drop} locale={locale} />
      {content.terms !== null && (
        <>
          <p className="tw-m-0 tw-text-sm tw-font-semibold">
            {t(locale, "browserConnector.wallet.content.terms")}
          </p>
          <p className={BOX_CLASS}>{content.terms}</p>
        </>
      )}
    </div>
  );
}

/**
 * What a drop or decision signature commits to, for the browser page. With
 * verified content: the content in words, then the exact committed JSON and
 * the message. Without (the app sent none): the message and a plain warning
 * that the content is known only by its fingerprint.
 */
export default function BrowserWalletRequestContent({
  text,
  fingerprint,
  content,
  locale,
}: {
  readonly text: string;
  readonly fingerprint: string;
  readonly content: WalletRequestContent | null;
  readonly locale: Locale;
}) {
  const fingerprintLine = (
    <p className="tw-m-0 tw-font-mono tw-text-sm tw-text-iron-200">
      {t(locale, "browserConnector.wallet.fingerprint", { fingerprint })}
    </p>
  );
  if (content === null) {
    return (
      <>
        {fingerprintLine}
        <p className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-p-3 tw-text-sm tw-text-iron-100">
          {t(locale, "browserConnector.wallet.fingerprintOnly")}
        </p>
        <pre className={`${BOX_CLASS} tw-font-mono`}>{text}</pre>
      </>
    );
  }
  return (
    <>
      <ContentSummary content={content} locale={locale} />
      {fingerprintLine}
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(locale, "browserConnector.wallet.contentVerified")}
      </p>
      <details className="tw-rounded-lg tw-bg-iron-900 tw-p-3">
        <summary className={SUMMARY_CLASS}>
          {t(locale, "browserConnector.wallet.content.committed")}
        </summary>
        <code className="tw-mt-3 tw-block tw-max-h-72 tw-overflow-auto tw-whitespace-pre-wrap tw-break-all tw-font-mono tw-text-xs tw-text-iron-100">
          {content.committed}
        </code>
      </details>
      <details className="tw-rounded-lg tw-bg-iron-900 tw-p-3">
        <summary className={SUMMARY_CLASS}>
          {t(locale, "browserConnector.wallet.content.message")}
        </summary>
        <pre className="tw-m-0 tw-mt-3 tw-max-h-72 tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-font-mono tw-text-sm tw-text-iron-100">
          {text}
        </pre>
      </details>
    </>
  );
}
