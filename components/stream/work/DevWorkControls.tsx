"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  useStream,
  useStreamNow,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import { txErrorMessage } from "@/components/stream/ui/GasNote";
import { STREAM_BUTTON_SMALL } from "@/components/stream/ui/styles";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { DISPUTE_DECISION_DELAY } from "@/lib/stream/constants";
import type { StreamDevControls, TxResult } from "@/lib/stream/dataSource";
import type { Address, StreamContracts, WorkKey } from "@/lib/stream/types";
import { parseWorkKey, workKeyFor } from "@/lib/stream/workKey";

const CONTRACT = /^0x[0-9a-f]{40}$/;

interface DevTarget {
  readonly key: WorkKey | null;
  readonly contract: Address | null;
}

function segment(pathname: string, prefix: string): string | null {
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  const rest = pathname.slice(prefix.length).split("/")[0] ?? "";
  if (rest === "") {
    return null;
  }
  try {
    return decodeURIComponent(rest);
  } catch {
    return null;
  }
}

/** The work or federated contract the current page shows, from its route. */
function targetOf(
  pathname: string,
  contracts: StreamContracts | null
): DevTarget {
  const work = segment(pathname, "/stream/works/");
  if (work !== null) {
    return { key: work, contract: null };
  }
  const edition = segment(pathname, "/stream/editions/");
  const parsed = edition === null ? null : parseWorkKey(edition);
  if (edition !== null && parsed?.kind === "stream" && contracts !== null) {
    return {
      key: workKeyFor(contracts.editions, parsed.tokenId, contracts.stream),
      contract: null,
    };
  }
  if (edition !== null) {
    return { key: edition, contract: null };
  }
  const contract = segment(pathname, "/stream/federated/")?.toLowerCase();
  return {
    key: null,
    contract:
      contract !== undefined && CONTRACT.test(contract)
        ? (contract as Address)
        : null,
  };
}

function DisputeButtons({
  dev,
  workKey,
  locale,
  report,
}: {
  readonly dev: StreamDevControls;
  readonly workKey: WorkKey;
  readonly locale: SupportedLocale;
  readonly report: (result: TxResult) => void;
}) {
  const now = useStreamNow();
  const { data: auction } = useStreamQuery(
    "auction-for-work",
    [workKey],
    (source) => source.auctionForWork(workKey)
  );
  if (!auction) {
    return null;
  }
  const paused = auction.state === "PAUSED";
  const pausedAt = auction.pause.pausedAt;
  const decisionFrom =
    pausedAt === null ? null : pausedAt + DISPUTE_DECISION_DELAY;
  return (
    <div
      className="tw-flex tw-flex-wrap tw-gap-1"
      role="group"
      aria-label={t(locale, "stream.devWork.dispute")}
    >
      <button
        type="button"
        className={STREAM_BUTTON_SMALL}
        disabled={auction.state !== "ACTIVE" || auction.pause.used}
        onClick={() => report(dev.pauseForDispute(workKey))}
      >
        {t(locale, "stream.devWork.pause")}
      </button>
      {decisionFrom !== null && now < decisionFrom ? (
        <button
          type="button"
          className={STREAM_BUTTON_SMALL}
          onClick={() => dev.advance(decisionFrom - now + 1)}
        >
          {t(locale, "stream.devWork.toDecision")}
        </button>
      ) : null}
      <button
        type="button"
        className={STREAM_BUTTON_SMALL}
        disabled={!paused}
        onClick={() => report(dev.resolveDispute(workKey, true))}
      >
        {t(locale, "stream.devWork.uphold")}
      </button>
      <button
        type="button"
        className={STREAM_BUTTON_SMALL}
        disabled={!paused}
        onClick={() => report(dev.resolveDispute(workKey, false))}
      >
        {t(locale, "stream.devWork.reject")}
      </button>
    </div>
  );
}

function DelistButton({
  dev,
  contract,
  locale,
  report,
}: {
  readonly dev: StreamDevControls;
  readonly contract: Address;
  readonly locale: SupportedLocale;
  readonly report: (result: TxResult) => void;
}) {
  const { data: entry } = useStreamQuery(
    "federated-contract",
    [contract],
    (source) => source.getFederatedContract(contract)
  );
  if (!entry) {
    return null;
  }
  const delisted = entry.status === "DELISTED";
  return (
    <button
      type="button"
      className={STREAM_BUTTON_SMALL}
      onClick={() => report(dev.setFederatedStatus(entry.address, !delisted))}
    >
      {t(locale, delisted ? "stream.devWork.relist" : "stream.devWork.delist")}
    </button>
  );
}

/**
 * Dev-panel controls for the page's work: the guardian's dispute pause, the
 * TDH vote's outcome (uphold or reject) and a federated contract's delisting.
 * Network-side actors only the mock can play; hidden on the chain.
 */
export default function DevWorkControls({
  dev,
  locale,
}: {
  readonly dev: StreamDevControls;
  readonly locale: SupportedLocale;
}) {
  const pathname = usePathname();
  const { client } = useStream();
  const [message, setMessage] = useState<{
    readonly path: string;
    readonly text: string;
  } | null>(null);
  const contracts = client?.dataSource.source().contracts ?? null;
  const target = targetOf(pathname, contracts);
  const { data: work } = useStreamQuery("work", [target.key], (source) =>
    target.key === null ? Promise.resolve(null) : source.getWork(target.key)
  );
  let auctionKey: WorkKey | null = null;
  if (work?.standard === "ERC721" && work.sale?.kind === "ENGLISH_AUCTION") {
    auctionKey = work.key;
  } else if (work?.standard === "ERC1155") {
    auctionKey = work.linked.master;
  }
  const contract = work?.federated?.contract ?? target.contract;
  if (auctionKey === null && contract === null) {
    return null;
  }
  const report = (result: TxResult) =>
    setMessage({
      path: pathname,
      text: result.ok
        ? t(locale, "stream.tx.done")
        : txErrorMessage(locale, result.error),
    });
  return (
    <div className="tw-space-y-1.5">
      <p className="tw-m-0 tw-text-xs tw-text-iron-400">
        {work
          ? t(locale, "stream.devWork.title", { title: work.title })
          : t(locale, "stream.devWork.contract")}
      </p>
      {auctionKey === null ? null : (
        <DisputeButtons
          dev={dev}
          workKey={auctionKey}
          locale={locale}
          report={report}
        />
      )}
      {contract === null ? null : (
        <DelistButton
          dev={dev}
          contract={contract}
          locale={locale}
          report={report}
        />
      )}
      <p
        className="tw-m-0 tw-min-h-4 tw-text-xs tw-text-iron-300"
        role="status"
        aria-live="polite"
      >
        {message?.path === pathname ? message.text : ""}
      </p>
    </div>
  );
}
