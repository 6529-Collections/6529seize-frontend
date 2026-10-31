import { STREAM_HELP, STREAM_LABEL } from "@/components/stream/ui/styles";
import { formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { FederatedContract } from "@/lib/stream/types";

/** "0x1234…abcd" for a vote reference or hash. */
export function shortHex(value: string): string {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

function NoticeList({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly string[];
}) {
  return (
    <div className="tw-min-w-0">
      <h3 className={STREAM_LABEL}>{title}</h3>
      <ul className="tw-m-0 tw-mt-2 tw-list-disc tw-space-y-1 tw-pl-4 tw-text-sm tw-leading-6 tw-text-iron-200">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * What a TDH-vote delisting means for a federated contract
 * (`IFederationRegistry.StatusSet`): the tokens stay; network sales and the
 * 6529.io listing stop.
 */
export default function DelistingNotice({
  entry,
  locale,
}: {
  readonly entry: FederatedContract;
  readonly locale: SupportedLocale;
}) {
  const { delisting } = entry;
  if (delisting === null && !entry.artistDelisted) {
    return null;
  }
  return (
    <section
      aria-labelledby="federated-delisted-title"
      className="tw-mb-6 tw-rounded-xl tw-border tw-border-solid tw-border-error/40 tw-bg-iron-950 tw-p-4 sm:tw-p-5"
    >
      <h2
        id="federated-delisted-title"
        className="tw-m-0 tw-text-base tw-font-semibold tw-text-error"
      >
        {t(locale, "stream.federated.delisted.title")}
      </h2>
      {delisting === null ? null : (
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-100">
          {t(locale, "stream.federated.delisted.when", {
            date: formatUtcDate(locale, delisting.at * 1_000),
            reason: t(locale, `stream.federated.reason.${delisting.reason}`),
          })}
        </p>
      )}
      {entry.artistDelisted ? (
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-100">
          {t(locale, "stream.federated.delisted.artist")}
        </p>
      ) : null}
      {delisting?.statement ? (
        <p className={`${STREAM_HELP} tw-mt-1`}>
          {delisting.statement.summary}
        </p>
      ) : null}
      {delisting === null ? null : (
        <p
          className={`${STREAM_HELP} tw-mt-1 tw-font-mono`}
          title={delisting.voteRef}
        >
          {t(locale, "stream.federated.delisted.vote", {
            ref: shortHex(delisting.voteRef),
          })}
        </p>
      )}
      <div className="tw-mt-4 tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <NoticeList
          title={t(locale, "stream.federated.delisted.kept")}
          items={[
            t(locale, "stream.federated.delisted.kept.tokens"),
            t(locale, "stream.federated.delisted.kept.owners"),
          ]}
        />
        <NoticeList
          title={t(locale, "stream.federated.delisted.stopped")}
          items={[
            t(locale, "stream.federated.delisted.stopped.sales"),
            t(locale, "stream.federated.delisted.stopped.listing"),
          ]}
        />
      </div>
      <p className={`${STREAM_HELP} tw-mt-4`}>
        {t(locale, "stream.federated.delisted.relist")}
      </p>
    </section>
  );
}
