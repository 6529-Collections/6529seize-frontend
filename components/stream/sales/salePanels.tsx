"use client";

import type { ComponentType } from "react";

import {
  useStreamNow,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import EditionAuctionPanel from "@/components/stream/editions/EditionAuctionPanel";
import EnglishAuctionPanel from "@/components/stream/work/english/EnglishAuctionPanel";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { STREAM_CARD } from "@/components/stream/ui/styles";
import type {
  KnownSaleKind,
  SaleRef,
  SaleViewByKind,
} from "@/lib/stream/types";

/**
 * One panel per sale kind; a new sale method adds one panel here and one mock
 * adapter. The 1/1 English auction panel lives in
 * `components/stream/work/english/`, the edition auction panel in
 * `components/stream/editions/`.
 */
interface SalePanelProps<K extends KnownSaleKind> {
  readonly sale: SaleViewByKind[K];
  readonly locale: SupportedLocale;
  readonly now: number;
}

const PANEL = `${STREAM_CARD} tw-p-4`;

const SALE_PANELS: {
  readonly [K in KnownSaleKind]: ComponentType<SalePanelProps<K>>;
} = {
  ENGLISH_AUCTION: EnglishAuctionPanel,
  UNIFORM_AUCTION: EditionAuctionPanel,
};

/** Reads a sale of any kind and renders its registered panel. */
export function SalePanel({
  saleRef,
  locale,
}: {
  readonly saleRef: SaleRef;
  readonly locale: SupportedLocale;
}) {
  const now = useStreamNow();
  const { data } = useStreamQuery(
    "sale",
    [saleRef.kind, saleRef.saleId],
    (source) => source.getSale(saleRef)
  );
  if (data === undefined) {
    return (
      <div className={`${PANEL} tw-h-40 tw-animate-pulse`} aria-busy="true" />
    );
  }
  switch (data.kind) {
    case "ENGLISH_AUCTION":
      return (
        <SALE_PANELS.ENGLISH_AUCTION
          sale={data.sale}
          locale={locale}
          now={now}
        />
      );
    case "UNIFORM_AUCTION":
      return (
        <SALE_PANELS.UNIFORM_AUCTION
          sale={data.sale}
          locale={locale}
          now={now}
        />
      );
    case "unsupported":
      return (
        <p className={`${PANEL} tw-m-0 tw-text-sm tw-text-iron-300`}>
          {t(locale, "stream.sale.unsupported", { kind: data.ref.kind })}
        </p>
      );
  }
}
