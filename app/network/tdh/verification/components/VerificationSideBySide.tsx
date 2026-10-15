import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
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
import { formatInteger, middleTruncate } from "./verificationFormat";
import { arweaveTransactionUrl } from "./verificationLinks";

type RootKey = "cycleRoot" | "walletRoot" | "historyRoot";
const ROOT_LABELS: Record<RootKey, string> = {
  cycleRoot: "cycle",
  walletRoot: "wallet",
  historyRoot: "history",
};

const MUTED = "tw-text-iron-400";

function Muted({ children }: { readonly children: ReactNode }) {
  return <span className={MUTED}>{children}</span>;
}

function HashValue({
  locale,
  value,
  name,
  display,
}: {
  readonly locale: SupportedLocale;
  readonly value: string;
  readonly name: string;
  readonly display?: string;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
      <code className="tw-font-mono tw-text-xs tw-text-iron-200" title={value}>
        {display ?? middleTruncate(value, 6)}
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

function ArweaveLink({
  locale,
  source,
  labelKey,
}: {
  readonly locale: SupportedLocale;
  readonly source: string;
  readonly labelKey:
    | "network.tdh.verify.side.upload"
    | "network.tdh.verify.side.walletUpload";
}) {
  const id = source.replace(/^arweave:/, "");
  return (
    <a
      href={arweaveTransactionUrl(id)}
      className={`${TDH_LINK} tw-whitespace-nowrap`}
      rel="noopener noreferrer"
      target="_blank"
      aria-label={t(locale, "network.tdh.verify.provenance.txLink", { id })}
    >
      {t(locale, labelKey, { id: middleTruncate(id, 5) })}
    </a>
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
  const notApplicable = t(locale, "network.tdh.impl.notApplicable");

  const count = (value: number | null | undefined) =>
    value === null || value === undefined ? (
      <Muted>{t(locale, "network.tdh.verify.tiles.liveMissing")}</Muted>
    ) : (
      formatInteger(locale, value)
    );

  const versusRust = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return null;
    }
    const difference = value - rust.totalTdh;
    let text = t(locale, "network.tdh.verify.side.equalRust");
    if (difference !== 0) {
      text = t(
        locale,
        difference > 0
          ? "network.tdh.verify.side.higherRust"
          : "network.tdh.verify.side.lowerRust",
        { amount: formatInteger(locale, Math.abs(difference)) }
      );
    }
    return (
      <span
        className={`tw-mt-0.5 tw-block tw-text-xs ${difference === 0 ? "tw-text-iron-400" : "tw-text-amber-200"}`}
      >
        {text}
      </span>
    );
  };

  const roots = (impl: VerificationImplementation) => {
    const present = (["cycleRoot", "walletRoot", "historyRoot"] as const)
      .map((key) => ({ key, value: impl[key] }))
      .filter((entry): entry is { key: RootKey; value: string } =>
        Boolean(entry.value)
      );
    if (present.length === 0) {
      return null;
    }
    return (
      <span className="tw-flex tw-flex-col tw-gap-1">
        {present.map((entry) => (
          <span
            key={entry.key}
            className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-2"
          >
            <span className="tw-w-14 tw-text-xs tw-text-iron-400">
              {ROOT_LABELS[entry.key]}
            </span>
            <HashValue
              locale={locale}
              value={entry.value}
              name={`${ROOT_LABELS[entry.key]} root`}
            />
          </span>
        ))}
      </span>
    );
  };

  const commit = (
    impl: VerificationImplementation | null,
    repository: string
  ) => {
    if (impl === null) {
      return <Muted>{notRun}</Muted>;
    }
    return impl.commit === null ? (
      <Muted>{notApplicable}</Muted>
    ) : (
      <HashValue
        locale={locale}
        value={impl.commit}
        name={repository}
        display={`${repository}@${impl.commit.slice(0, 7)}`}
      />
    );
  };

  const runtime = (impl: VerificationImplementation | null) => {
    if (impl === null) {
      return <Muted>{notRun}</Muted>;
    }
    return impl.runtimeMs === null ? (
      <Muted>{notApplicable}</Muted>
    ) : (
      t(locale, "network.tdh.verify.side.seconds", {
        seconds: formatNumber(locale, impl.runtimeMs / 1000, {
          maximumFractionDigits: 0,
        }),
      })
    );
  };

  const rustRoots = roots(rust);
  const liveTotal = live?.totalTdh ?? null;
  const walletSource = live?.sources?.wallet ?? null;

  const rows: ReadonlyArray<{
    readonly key: string;
    readonly label: ReactNode;
    readonly rust: ReactNode;
    readonly python: ReactNode;
    readonly live: ReactNode;
  }> = [
    {
      key: "totalTdh",
      label: t(locale, "network.tdh.verify.side.totalTdh"),
      rust: (
        <span className="tw-font-semibold tw-text-iron-50">
          {formatInteger(locale, rust.totalTdh)}
        </span>
      ),
      python:
        python === null ? (
          <Muted>{notRun}</Muted>
        ) : (
          <>
            <span className="tw-font-semibold tw-text-iron-50">
              {formatInteger(locale, python.totalTdh)}
            </span>
            {versusRust(python.totalTdh)}
          </>
        ),
      live:
        liveTotal === null ? (
          count(null)
        ) : (
          <>
            <span className="tw-font-semibold tw-text-iron-50">
              {formatInteger(locale, liveTotal)}
            </span>
            {versusRust(liveTotal)}
          </>
        ),
    },
    {
      key: "identities",
      label: t(locale, "network.tdh.verify.side.identities"),
      rust: formatInteger(locale, rust.identities),
      python:
        python === null ? (
          <Muted>{notRun}</Muted>
        ) : (
          formatInteger(locale, python.identities)
        ),
      live: count(live?.identities),
    },
    {
      key: "wallets",
      label: t(locale, "network.tdh.verify.side.wallets"),
      rust: formatInteger(locale, rust.wallets),
      python:
        python === null ? (
          <Muted>{notRun}</Muted>
        ) : (
          formatInteger(locale, python.wallets)
        ),
      live: count(live?.wallets),
    },
    ...(rustRoots === null
      ? []
      : [
          {
            key: "roots",
            label: (
              <>
                {t(locale, "network.tdh.verify.side.roots")}
                <span className="tw-mt-1 tw-block tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400">
                  {t(locale, "network.tdh.verify.side.rootsHelp")}
                </span>
              </>
            ),
            rust: rustRoots,
            python:
              python === null ? (
                <Muted>{notRun}</Muted>
              ) : (
                (roots(python) ?? (
                  <Muted>
                    {python.rootsNote ??
                      t(locale, "network.tdh.verify.side.pythonRoots")}
                  </Muted>
                ))
              ),
            live: (
              <Muted>{t(locale, "network.tdh.verify.side.liveRoots")}</Muted>
            ),
          },
        ]),
    {
      key: "commit",
      label: t(locale, "network.tdh.verify.side.commit"),
      rust: commit(rust, "validator"),
      python: commit(python, "6529chain"),
      live: <Muted>{notApplicable}</Muted>,
    },
    {
      key: "runtime",
      label: (
        <>
          {t(locale, "network.tdh.verify.side.runtime")}
          <span className="tw-mt-1 tw-block tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400">
            {t(locale, "network.tdh.verify.side.runtimeNote")}
          </span>
        </>
      ),
      rust: runtime(rust),
      python: runtime(python),
      live: <Muted>{notApplicable}</Muted>,
    },
    {
      key: "source",
      label: t(locale, "network.tdh.verify.side.source"),
      rust: t(locale, "network.tdh.verify.side.computedRust"),
      python:
        python === null ? (
          <Muted>{notRun}</Muted>
        ) : (
          t(locale, "network.tdh.verify.side.computedPython")
        ),
      live: live?.source ? (
        <span className="tw-flex tw-flex-col tw-gap-0.5">
          <ArweaveLink
            locale={locale}
            source={live.source}
            labelKey="network.tdh.verify.side.upload"
          />
          {walletSource && walletSource !== live.source && (
            <ArweaveLink
              locale={locale}
              source={walletSource}
              labelKey="network.tdh.verify.side.walletUpload"
            />
          )}
        </span>
      ) : (
        <Muted>
          {t(locale, "network.tdh.verify.provenance.liveSourceMissing")}
        </Muted>
      ),
    },
  ];

  return (
    <section aria-labelledby="tdh-verify-side-heading" className="tw-mt-12">
      <h2
        id="tdh-verify-side-heading"
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
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
            <div className="tw-text-sm tw-font-medium tw-text-iron-100">
              {row.label}
            </div>
            <dl className="tw-m-0 tw-mt-2 tw-grid tw-grid-cols-[6.5rem_minmax(0,1fr)] tw-items-start tw-gap-x-3 tw-gap-y-2 tw-text-sm tw-tabular-nums">
              {(["rust", "python", "live"] as const).map((series) => (
                <div key={series} className="tw-contents">
                  <dt className="tw-pt-px tw-text-xs tw-text-iron-400">
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
        <table className={`${TDH_TABLE} tw-min-w-[44rem]`}>
          <caption className={`${TDH_CAPTION} tw-sr-only`}>
            {t(locale, "network.tdh.verify.side.caption")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={`${TDH_TH} tw-w-[28%]`}>
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
                  className={`${TDH_TD} tw-font-medium tw-text-iron-200`}
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
