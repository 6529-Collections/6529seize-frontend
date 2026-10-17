import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatNumber } from "@/i18n/format";
import type {
  VerificationImplementation,
  VerificationLive,
} from "@/lib/tdh/verification/schema";
import TdhHeading from "../../shared/TdhHeading";
import TdhCopyButton from "../../shared/TdhCopyButton";
import TdhDisclosure from "../../shared/TdhDisclosure";
import TdhSourcesNote from "../../shared/TdhSourcesNote";
import {
  TDH_LINK,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD,
  TDH_TH,
} from "../../shared/tdhStyles";
import TdhProgramMark, { type TdhProgram } from "../../shared/TdhProgramMark";
import {
  formatInteger,
  middleTruncate,
  shortCommit,
} from "./verificationFormat";
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
  readonly series: TdhProgram;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-2">
      <TdhProgramMark program={series} />
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
      className={`${TDH_LINK} tw-inline-flex tw-min-h-6 tw-items-center tw-break-words`}
      rel="noopener noreferrer"
      target="_blank"
      aria-label={t(locale, "network.tdh.verify.provenance.txLink", { id })}
    >
      <span title={id}>{t(locale, labelKey)}</span>
    </a>
  );
}

export default function VerificationSideBySide({
  locale,
  rust,
  python,
  live,
  historyChecked = false,
}: {
  readonly locale: SupportedLocale;
  readonly rust: VerificationImplementation;
  readonly python: VerificationImplementation | null;
  readonly live: VerificationLive | null;
  /**
   * Whether the day's file says the history was checked (`mode`
   * `checked`): the Rust core's source and run time are then described as
   * checked, never as taken as reported.
   */
  readonly historyChecked?: boolean;
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
        className={`tw-mt-0.5 tw-block tw-text-sm ${difference === 0 ? "tw-text-iron-400" : "tw-text-amber-200"}`}
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
            <span className="tw-w-14 tw-text-sm tw-text-iron-400">
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
        display={`${repository}@${shortCommit(impl.commit)}`}
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
            label: t(locale, "network.tdh.verify.side.roots"),
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
      label: t(locale, "network.tdh.verify.side.runtime"),
      rust: runtime(rust),
      python: runtime(python),
      live: <Muted>{notApplicable}</Muted>,
    },
    {
      key: "source",
      label: t(locale, "network.tdh.verify.side.source"),
      rust: t(
        locale,
        historyChecked
          ? "network.tdh.verify.side.computedRustChecked"
          : "network.tdh.verify.side.computedRust"
      ),
      python:
        python === null ? (
          <Muted>{notRun}</Muted>
        ) : (
          t(locale, "network.tdh.verify.side.computedPython")
        ),
      live: live?.source ? (
        <span className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-1">
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
    <section
      id="side"
      aria-labelledby="side-heading"
      className="tw-mt-12 tw-scroll-mt-24"
    >
      <TdhHeading
        id="side"
        title={t(locale, "network.tdh.verify.side.heading")}
        locale={locale}
        className="tw-text-balance tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-2xl"
      />
      <p className="tw-m-0 tw-mt-2 tw-max-w-[34rem] tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.verify.side.caption")}
      </p>
      {/* One card per measure below lg, in one column, so no card is
          stretched beside a taller one; inside a card the three values sit
          beside their labels from 17rem and under them below. */}
      <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-gap-2 tw-p-0 lg:tw-hidden">
        {rows.map((row) => (
          <li
            key={row.key}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-3 tw-@container"
          >
            <div className="tw-text-sm tw-font-medium tw-text-iron-100">
              {row.label}
            </div>
            <dl className="tw-m-0 tw-mt-2 tw-grid tw-grid-cols-1 tw-items-start tw-gap-x-3 tw-gap-y-1 tw-text-sm tw-tabular-nums @[17rem]:tw-grid-cols-[6.5rem_minmax(0,1fr)] @[17rem]:tw-gap-y-2">
              {(["rust", "python", "live"] as const).map((series) => (
                <div key={series} className="tw-contents">
                  <dt className="tw-pt-px tw-text-sm tw-text-iron-400">
                    <SeriesHeader
                      label={t(locale, `network.tdh.verify.side.${series}`)}
                      series={series}
                    />
                  </dt>
                  <dd className="tw-m-0 tw-mb-1.5 tw-min-w-0 tw-break-words tw-text-iron-100 @[17rem]:tw-mb-0">
                    {row[series]}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div className={`${TDH_TABLE_FRAME} tw-mt-4 tw-hidden lg:tw-block`}>
        <table
          className={TDH_TABLE}
          aria-label={t(locale, "network.tdh.verify.side.caption")}
        >
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
      {/* What two rows mean: a line each, the detail one click away. */}
      <dl className="tw-m-0 tw-mt-4 tw-grid tw-max-w-[34rem] tw-gap-y-1 tw-text-sm tw-leading-6">
        {(
          [
            ...(rustRoots === null
              ? []
              : [["roots", "rootsShort", "rootsHelp"] as const]),
            [
              "runtime",
              "runtimeShort",
              historyChecked ? "runtimeNoteChecked" : "runtimeNote",
            ] as const,
          ] as const
        ).map(([key, short, help]) => (
          <div key={key}>
            <dt className="tw-inline tw-font-medium tw-text-iron-100">
              {t(locale, `network.tdh.verify.side.${key}`)}:{" "}
            </dt>
            <dd className="tw-m-0 tw-inline tw-text-iron-300">
              {t(locale, `network.tdh.verify.side.${short}`)}
            </dd>
            {/* A dl's div holds only dt and dd, so the detail is a dd. */}
            <dd className="tw-m-0">
              <TdhDisclosure
                summary={t(locale, "network.tdh.verify.side.more", {
                  name: t(locale, `network.tdh.verify.side.${key}`),
                })}
                summaryClassName="tw-text-[13px]"
              >
                <p className="tw-m-0 tw-pb-2 tw-pl-6 tw-text-iron-300">
                  {t(locale, `network.tdh.verify.side.${help}`)}
                </p>
              </TdhDisclosure>
            </dd>
          </div>
        ))}
      </dl>
      <TdhSourcesNote
        locale={locale}
        refs={[
          "P53 §12",
          "P53 §4.2",
          "P28 §4.4",
          "P53 §4.6",
          "D130",
          "P52 §3.4",
        ]}
      />
    </section>
  );
}
