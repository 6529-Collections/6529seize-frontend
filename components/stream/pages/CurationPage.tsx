"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { actionLabel } from "@/components/stream/browse/cells";
import StreamTable from "@/components/stream/browse/StreamTable";
import {
  type CurationItemState,
  type CurationRow,
  readCurationBoard,
} from "@/components/stream/curation/curationBoard";
import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  ActionMessage,
  Empty,
  Loading,
  PageHeader,
  Section,
  useStreamAction,
} from "@/components/stream/pages/common";
import { AddressChip } from "@/components/stream/ui/AddressChip";
import StatusBadge from "@/components/stream/ui/StatusBadge";
import {
  STREAM_BUTTON_PRIMARY,
  STREAM_BUTTON_SECONDARY,
  STREAM_HELP,
  STREAM_TEXT,
} from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { CurationPackage, Hex32 } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

const STATE_TONE: Readonly<
  Record<CurationItemState, "live" | "warning" | "success" | "danger">
> = {
  ready: "live",
  move: "warning",
  signatures: "warning",
  started: "success",
  revoked: "danger",
};

const ROW_BUTTON = "tw-whitespace-nowrap tw-px-3 tw-py-1.5";

function shortHash(hash: Hex32): string {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function kindText(row: CurationRow, locale: SupportedLocale): string {
  if (row.item.kind === "ORIGINAL") {
    return t(locale, "stream.curation.kind.original");
  }
  return row.item.editionCap === null || row.item.editionCap === 0
    ? t(locale, "stream.curation.kind.master")
    : t(locale, "stream.curation.kind.masterCap", {
        cap: formatInteger(locale, row.item.editionCap),
      });
}

function ItemAction({
  row,
  locale,
  run,
  pending,
}: {
  readonly row: CurationRow;
  readonly locale: SupportedLocale;
  readonly run: ReturnType<typeof useStreamAction>["run"];
  readonly pending: boolean;
}): ReactNode {
  if (row.state === "ready") {
    return (
      <button
        type="button"
        className={`${STREAM_BUTTON_PRIMARY} ${ROW_BUTTON}`}
        aria-label={actionLabel(
          locale,
          t(locale, "stream.curation.start"),
          row.item.title
        )}
        disabled={pending}
        onClick={() => {
          void run((actions, from) =>
            actions.startAuction(from, row.item.itemHash)
          );
        }}
      >
        {t(locale, "stream.curation.start")}
      </button>
    );
  }
  if (row.state === "started" && row.work !== null) {
    return (
      <Link
        href={STREAM_ROUTES.work(row.work)}
        aria-label={actionLabel(
          locale,
          t(locale, "stream.curation.view"),
          row.item.title
        )}
        className={`${STREAM_BUTTON_SECONDARY} ${ROW_BUTTON} tw-no-underline`}
      >
        {t(locale, "stream.curation.view")}
      </Link>
    );
  }
  return null;
}

function ItemsTable({
  rows,
  locale,
}: {
  readonly rows: readonly CurationRow[];
  readonly locale: SupportedLocale;
}) {
  const { run, pending, message } = useStreamAction(locale);
  if (rows.length === 0) {
    return <Empty text={t(locale, "stream.curation.empty")} />;
  }
  return (
    <>
      <StreamTable
        caption={t(locale, "stream.curation.items")}
        columns={[
          { key: "item", label: t(locale, "stream.curation.col.item") },
          {
            key: "artist",
            label: t(locale, "stream.curation.col.artist"),
            wide: true,
          },
          {
            key: "kind",
            label: t(locale, "stream.curation.col.kind"),
            wide: true,
          },
          {
            key: "signed",
            label: t(locale, "stream.curation.col.signed"),
            numeric: true,
          },
          { key: "state", label: t(locale, "stream.curation.col.state") },
          { key: "action", label: t(locale, "stream.me.col.action") },
        ]}
        rows={rows.map((row) => ({
          key: row.item.itemHash,
          cells: [
            <span
              key="item"
              className="tw-whitespace-nowrap tw-font-medium tw-text-iron-50"
            >
              {row.item.title}
            </span>,
            row.artistName,
            kindText(row, locale),
            t(locale, "stream.curation.signedCount", {
              accepted: formatInteger(locale, row.item.accepted),
              parties: formatInteger(locale, row.item.parties),
            }),
            <StatusBadge
              key="state"
              tone={STATE_TONE[row.state]}
              label={t(locale, `stream.curation.state.${row.state}`)}
            />,
            <ItemAction
              key="action"
              row={row}
              locale={locale}
              run={run}
              pending={pending}
            />,
          ],
        }))}
      />
      <ActionMessage message={message} />
    </>
  );
}

function ApprovalStatus({
  pkg,
  locale,
}: {
  readonly pkg: CurationPackage;
  readonly locale: SupportedLocale;
}) {
  if (pkg.revocation === null) {
    return (
      <StatusBadge
        tone="success"
        label={t(locale, "stream.curation.registered")}
      />
    );
  }
  return (
    <StatusBadge
      tone="danger"
      label={t(locale, "stream.curation.revokedOn", {
        date: formatUtcDate(locale, pkg.revocation.at * 1_000),
      })}
    />
  );
}

function ApprovalsTable({
  packages,
  locale,
}: {
  readonly packages: readonly CurationPackage[];
  readonly locale: SupportedLocale;
}) {
  return (
    <StreamTable
      caption={t(locale, "stream.curation.approvals")}
      columns={[
        { key: "approved", label: t(locale, "stream.curation.col.approved") },
        { key: "vote", label: t(locale, "stream.curation.col.vote") },
        {
          key: "signer",
          label: t(locale, "stream.curation.col.signer"),
          wide: true,
        },
        {
          key: "hash",
          label: t(locale, "stream.curation.col.hash"),
          wide: true,
        },
        {
          key: "items",
          label: t(locale, "stream.curation.col.items"),
          numeric: true,
        },
        { key: "status", label: t(locale, "stream.curation.col.status") },
      ]}
      rows={packages.map((pkg) => ({
        key: pkg.packageRoot,
        cells: [
          formatUtcDate(locale, pkg.registeredAt * 1_000),
          <span
            key="vote"
            className="tw-block tw-min-w-[12rem] tw-whitespace-normal"
          >
            {pkg.voteRecord?.summary ?? pkg.waveVote}
          </span>,
          <AddressChip key="signer" address={pkg.signer} locale={locale} />,
          <span key="hash" className="tw-font-mono tw-text-xs tw-text-iron-400">
            {shortHash(pkg.evidenceHash)}
          </span>,
          formatInteger(locale, pkg.items.length),
          <ApprovalStatus key="status" pkg={pkg} locale={locale} />,
        ],
      }))}
    />
  );
}

/** /stream/curation: approved items by state, and each approval's attested vote. */
export function CurationPage() {
  const locale = useBrowserLocale();
  const { data: board } = useStreamQuery(
    "curation-board",
    [],
    readCurationBoard
  );
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.curation.title")}
        intro={t(locale, "stream.curation.intro")}
      >
        <div className="tw-mt-3 tw-max-w-3xl tw-space-y-1">
          <p className={STREAM_TEXT}>{t(locale, "stream.curation.howVote")}</p>
          <p className={STREAM_TEXT}>
            {t(locale, "stream.curation.howSigner")}
          </p>
        </div>
      </PageHeader>
      {board === undefined ? (
        <Loading />
      ) : (
        <>
          <Section title={t(locale, "stream.curation.items")}>
            <ItemsTable rows={board.rows} locale={locale} />
          </Section>
          <Section title={t(locale, "stream.curation.approvals")}>
            {board.packages.length === 0 ? (
              <Empty text={t(locale, "stream.curation.approvalsEmpty")} />
            ) : (
              <>
                <ApprovalsTable packages={board.packages} locale={locale} />
                <p className={`${STREAM_HELP} tw-mt-3`}>
                  {t(locale, "stream.curation.hashNote")}
                </p>
              </>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
