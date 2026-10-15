import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { formatNumber } from "@/i18n/format";
import type {
  VerificationImplementation,
  VerificationLive,
} from "@/lib/tdh/verification/schema";
import TdhCopyButton from "../../shared/TdhCopyButton";
import TdhSource from "../../shared/TdhSource";
import {
  TDH_CAPTION,
  TDH_LINK,
  TDH_TABLE,
  TDH_TABLE_WRAP,
  TDH_TD,
  TDH_TH,
  TDH_SERIES,
} from "../../shared/tdhStyles";
import {
  formatInteger,
  formatSigned,
  middleTruncate,
} from "./verificationFormat";

type RootKey = "cycleRoot" | "walletRoot" | "historyRoot";

const MUTED = "tw-text-iron-500";

function Missing({ children }: { readonly children: ReactNode }) {
  return <span className={MUTED}>{children}</span>;
}

function HashValue({
  locale,
  value,
  name,
}: {
  readonly locale: SupportedLocale;
  readonly value: string;
  readonly name: string;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1">
      <code className="tw-font-mono tw-text-xs tw-text-iron-200" title={value}>
        {middleTruncate(value, 6)}
      </code>
      <TdhCopyButton
        value={value}
        label={t(locale, "network.tdh.shared.copyNamed", {
          name: `${name} ${value}`,
        })}
        copiedLabel={t(locale, "network.tdh.shared.copied")}
        failedLabel={t(locale, "network.tdh.shared.copyFailed")}
      />
    </span>
  );
}

function SeriesHeader({
  label,
  series,
}: {
  readonly label: string;
  readonly series: keyof typeof TDH_SERIES;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-2">
      <span
        aria-hidden="true"
        className={`tw-size-2 tw-rounded-full ${TDH_SERIES[series].bg}`}
      />
      {label}
    </span>
  );
}

export default function VerificationSideBySide({
  locale,
  rust,
  python,
  live,
}: {
  readonly locale: SupportedLocale;
  readonly rust: VerificationImplementation;
  readonly python: VerificationImplementation | null;
  readonly live: VerificationLive | null;
}) {
  const notRun = t(locale, "network.tdh.verify.side.notRun");
  const notYet = t(locale, "network.tdh.verify.side.notYetPublished");
  const notPublished = t(locale, "network.tdh.verify.side.notPublished");

  const count = (value: number | null | undefined, missing: string) =>
    value === null || value === undefined ? (
      <Missing>{missing}</Missing>
    ) : (
      formatInteger(locale, value)
    );

  const deltaNote = (value: number | null | undefined, against: number) =>
    value === null || value === undefined || value === against ? null : (
      <span className="tw-mt-0.5 tw-block tw-text-xs tw-text-amber-200">
        {t(locale, "network.tdh.verify.side.deltaVsRust", {
          delta: formatSigned(locale, value - against),
        })}
      </span>
    );

  const root = (impl: VerificationImplementation | null, key: RootKey) => {
    if (impl === null) {
      return <Missing>{notRun}</Missing>;
    }
    const value = impl[key];
    return value === null ? (
      <Missing>{notYet}</Missing>
    ) : (
      <HashValue
        locale={locale}
        value={value}
        name={t(locale, `network.tdh.verify.side.${key}` as MessageKey)}
      />
    );
  };

  const commit = (impl: VerificationImplementation | null) => {
    if (impl === null) {
      return <Missing>{notRun}</Missing>;
    }
    return impl.commit === null ? (
      <Missing>{notYet}</Missing>
    ) : (
      <code className="tw-font-mono tw-text-xs tw-text-iron-200">
        {impl.commit.slice(0, 12)}
      </code>
    );
  };

  const runtime = (impl: VerificationImplementation | null) => {
    if (impl === null) {
      return <Missing>{notRun}</Missing>;
    }
    return impl.runtimeMs === null ? (
      <Missing>{notYet}</Missing>
    ) : (
      t(locale, "network.tdh.verify.side.seconds", {
        seconds: formatNumber(locale, impl.runtimeMs / 1000, {
          maximumFractionDigits: 1,
        }),
      })
    );
  };

  const liveSource = live?.source ?? null;
  const uploadId = liveSource?.replace(/^arweave:/, "") ?? null;

  const rows: ReadonlyArray<{
    readonly key: string;
    readonly label: string;
    readonly rust: ReactNode;
    readonly python: ReactNode;
    readonly live: ReactNode;
  }> = [
    {
      key: "totalTdh",
      label: t(locale, "network.tdh.verify.side.totalTdh"),
      rust: formatInteger(locale, rust.totalTdh),
      python:
        python === null ? (
          <Missing>{notRun}</Missing>
        ) : (
          <>
            {formatInteger(locale, python.totalTdh)}
            {deltaNote(python.totalTdh, rust.totalTdh)}
          </>
        ),
      live:
        live === null ? (
          <Missing>{notYet}</Missing>
        ) : (
          <>
            {count(live.totalTdh, notYet)}
            {deltaNote(live.totalTdh, rust.totalTdh)}
          </>
        ),
    },
    {
      key: "identities",
      label: t(locale, "network.tdh.verify.side.identities"),
      rust: formatInteger(locale, rust.identities),
      python:
        python === null ? (
          <Missing>{notRun}</Missing>
        ) : (
          formatInteger(locale, python.identities)
        ),
      live: count(live?.identities, notYet),
    },
    {
      key: "wallets",
      label: t(locale, "network.tdh.verify.side.wallets"),
      rust: formatInteger(locale, rust.wallets),
      python:
        python === null ? (
          <Missing>{notRun}</Missing>
        ) : (
          formatInteger(locale, python.wallets)
        ),
      live: count(live?.wallets, notYet),
    },
    ...(["cycleRoot", "walletRoot", "historyRoot"] as const).map((key) => ({
      key,
      label: t(locale, `network.tdh.verify.side.${key}` as MessageKey),
      rust: root(rust, key),
      python: root(python, key),
      live: <Missing>{notPublished}</Missing>,
    })),
    {
      key: "commit",
      label: t(locale, "network.tdh.verify.side.commit"),
      rust: commit(rust),
      python: commit(python),
      live: <Missing>{t(locale, "network.tdh.impl.notApplicable")}</Missing>,
    },
    {
      key: "runtime",
      label: t(locale, "network.tdh.verify.side.runtime"),
      rust: runtime(rust),
      python: runtime(python),
      live: <Missing>{t(locale, "network.tdh.impl.notApplicable")}</Missing>,
    },
    {
      key: "source",
      label: t(locale, "network.tdh.verify.side.source"),
      rust: t(locale, "network.tdh.verify.side.computedHere"),
      python:
        python === null ? (
          <Missing>{notRun}</Missing>
        ) : (
          t(locale, "network.tdh.verify.side.computedHere")
        ),
      live:
        uploadId === null ? (
          <Missing>
            {t(locale, "network.tdh.verify.provenance.liveSourceMissing")}
          </Missing>
        ) : (
          <a
            href={`https://arweave.net/${uploadId}`}
            className={TDH_LINK}
            rel="noopener noreferrer"
            target="_blank"
            aria-label={t(locale, "network.tdh.verify.side.uploadLink", {
              id: uploadId,
            })}
          >
            {t(locale, "network.tdh.verify.side.upload", {
              id: middleTruncate(uploadId, 5),
            })}
          </a>
        ),
    },
  ];

  return (
    <section aria-labelledby="tdh-verify-side-heading" className="tw-mt-10">
      <h2
        id="tdh-verify-side-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
      >
        {t(locale, "network.tdh.verify.side.heading")}
      </h2>
      <p className="tw-m-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdh.verify.side.caption")}
        <TdhSource refs={["P53 §12"]} locale={locale} />
      </p>
      <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-gap-2 tw-p-0 md:tw-hidden">
        {rows.map((row) => (
          <li
            key={row.key}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-3"
          >
            <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
              {row.label}
            </p>
            <dl className="tw-m-0 tw-mt-2 tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-items-baseline tw-gap-x-4 tw-gap-y-1.5 tw-text-sm tw-tabular-nums">
              {(["rust", "python", "live"] as const).map((series) => (
                <div key={series} className="tw-contents">
                  <dt className="tw-text-xs tw-text-iron-400">
                    <SeriesHeader
                      label={t(locale, `network.tdh.verify.side.${series}`)}
                      series={series}
                    />
                  </dt>
                  <dd className="tw-m-0 tw-min-w-0 tw-text-iron-100">
                    {row[series]}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div
        className={`${TDH_TABLE_WRAP} tw-mt-4 tw-hidden md:tw-block`}
        tabIndex={0}
        role="region"
        aria-labelledby="tdh-verify-side-heading"
      >
        <table className={`${TDH_TABLE} tw-min-w-[40rem]`}>
          <caption className={`${TDH_CAPTION} tw-sr-only`}>
            {t(locale, "network.tdh.verify.side.caption")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.verify.side.measure")}
              </th>
              <th scope="col" className={TDH_TH}>
                <SeriesHeader
                  label={t(locale, "network.tdh.verify.side.rust")}
                  series="rust"
                />
              </th>
              <th scope="col" className={TDH_TH}>
                <SeriesHeader
                  label={t(locale, "network.tdh.verify.side.python")}
                  series="python"
                />
              </th>
              <th scope="col" className={TDH_TH}>
                <SeriesHeader
                  label={t(locale, "network.tdh.verify.side.live")}
                  series="live"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th
                  scope="row"
                  className={`${TDH_TD} tw-font-medium tw-text-iron-300`}
                >
                  {row.label}
                </th>
                <td className={`${TDH_TD} tw-tabular-nums`}>{row.rust}</td>
                <td className={`${TDH_TD} tw-tabular-nums`}>{row.python}</td>
                <td className={`${TDH_TD} tw-tabular-nums`}>{row.live}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
