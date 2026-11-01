"use client";

import { type KeyboardEvent, useId, useRef, useState } from "react";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  editionsText,
  ethText,
  priceText,
} from "@/components/stream/editions/format";
import {
  PanelCard,
  PANEL_ACTION,
  PANEL_NOTE,
  PANEL_PRIMARY,
  StandingTag,
  standingOf,
} from "@/components/stream/editions/parts";
import { txErrorMessage } from "@/components/stream/ui/GasNote";
import { STREAM_FOCUS } from "@/components/stream/ui/styles";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { TxResult } from "@/lib/stream/dataSource";
import { parseEthToWei } from "@/lib/stream/eth";
import { GAS_ESTIMATES } from "@/lib/stream/gas";
import { nearestStep } from "@/lib/stream/ladder";
import type { EditionAuction, EditionQuote, Wei } from "@/lib/stream/types";

/** The bid box's own quantity bound; the contract allows up to 2^32 − 1. */
const MAX_QTY = 9_999;
/** Where the price starts before anyone bids: 0.01 ETH. */
const DEFAULT_PRICE = 10n ** 16n;

const FIELD =
  "tw-flex tw-h-11 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900";
const STEP_BUTTON = `tw-w-11 tw-flex-none tw-border-0 tw-bg-transparent tw-text-xl tw-leading-none tw-text-iron-200 hover:tw-bg-iron-800 hover:tw-text-iron-50 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 ${STREAM_FOCUS} focus-visible:-tw-outline-offset-2`;
const STEP_INPUT = `tw-min-w-0 tw-flex-1 tw-border-0 tw-border-x tw-border-solid tw-border-white/[0.07] tw-bg-transparent tw-text-center tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-50 disabled:tw-opacity-50 ${STREAM_FOCUS} focus-visible:-tw-outline-offset-2`;

function compactGas(locale: SupportedLocale, gas: number): string {
  return formatNumber(locale, gas, {
    notation: "compact",
    maximumSignificantDigits: 3,
  });
}

function parseQty(text: string): number {
  const trimmed = text.trim();
  return /^\d{1,6}$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

function parsePrice(text: string): Wei | null {
  const wei = parseEthToWei(text.trim().replace(",", "."));
  return wei === null || wei === 0n ? null : wei;
}

function Preview({
  auction,
  quote,
  qty,
  lowestIn,
  prices,
  onUse,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly quote: EditionQuote;
  readonly qty: number;
  readonly lowestIn: number | null | undefined;
  readonly prices: readonly Wei[] | undefined;
  readonly onUse: (step: number) => void;
  readonly locale: SupportedLocale;
}) {
  const standing = standingOf(quote.unitsWon, qty);
  const now = auction.clearing;
  const after = quote.result;
  let headKey: MessageKey = "stream.editionAuction.box.wouldBeOut";
  if (standing === "in") {
    headKey = "stream.editionAuction.box.wouldBeIn";
  } else if (standing === "partly") {
    headKey = "stream.editionAuction.box.wouldGetSome";
  }
  let effect: string;
  if (now.count === 0) {
    effect = t(locale, "stream.editionAuction.box.setsPrice", {
      editions: editionsText(locale, after.count),
      price: priceText(locale, after.price),
    });
  } else if (after.step === now.step) {
    effect = t(locale, "stream.editionAuction.box.priceStays", {
      price: priceText(locale, now.price),
      editions: editionsText(locale, after.count),
    });
  } else {
    effect = t(locale, "stream.editionAuction.box.priceMoves", {
      from: priceText(locale, now.price),
      to: priceText(locale, after.price),
      editions: editionsText(locale, after.count),
    });
  }
  const usePrice =
    standing !== "in" && lowestIn !== null && lowestIn !== undefined
      ? prices?.[lowestIn]
      : undefined;
  return (
    <>
      <p className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-font-semibold tw-text-iron-50">
        <StandingTag won={quote.unitsWon} qty={qty} locale={locale} />
        <span>
          {t(locale, headKey, {
            won: formatInteger(locale, quote.unitsWon),
            qty: formatInteger(locale, qty),
          })}
        </span>
      </p>
      <p className="tw-m-0 tw-tabular-nums">{effect}</p>
      {quote.unitsPushedOut > 0 ? (
        <p className="tw-m-0 tw-tabular-nums">
          {t(locale, "stream.editionAuction.box.pushesOut", {
            editions: editionsText(locale, quote.unitsPushedOut),
          })}
        </p>
      ) : null}
      {usePrice === undefined ||
      lowestIn === null ||
      lowestIn === undefined ? null : (
        <div>
          <button
            type="button"
            className={PANEL_ACTION}
            onClick={() => onUse(lowestIn)}
          >
            {t(
              locale,
              qty === 1
                ? "stream.editionAuction.box.useOne"
                : "stream.editionAuction.box.useAll",
              {
                price: priceText(locale, usePrice),
                qty: formatInteger(locale, qty),
              }
            )}
          </button>
        </div>
      )}
    </>
  );
}

function bidLabel(
  locale: SupportedLocale,
  auction: EditionAuction,
  escrow: Wei | null
): string {
  if (auction.status === "NONE") {
    return t(locale, "stream.editionAuction.box.notOpen");
  }
  if (!auction.biddingOpen) {
    return t(locale, "stream.editionAuction.box.closed");
  }
  return escrow === null
    ? t(locale, "stream.editionAuction.box.bid")
    : t(locale, "stream.editionAuction.box.bidAmount", {
        amount: ethText(locale, escrow),
      });
}

/** A labelled − [value] + field with one line of hint or error under it. */
function Stepper({
  id,
  label,
  value,
  inputMode,
  invalid,
  disabled,
  hint,
  lower,
  higher,
  onText,
  onBlur,
  onKeyDown,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly inputMode: "decimal" | "numeric";
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly hint: string | null;
  readonly lower: StepperButton;
  readonly higher: StepperButton;
  readonly onText: (text: string) => void;
  readonly onBlur?: () => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="tw-mb-3 tw-grid tw-gap-1.5">
      <label
        htmlFor={id}
        className="tw-text-[13px] tw-font-semibold tw-text-iron-200"
      >
        {label}
      </label>
      <div className={FIELD}>
        <button
          type="button"
          className={STEP_BUTTON}
          aria-label={lower.label}
          disabled={lower.disabled}
          onClick={lower.run}
        >
          −
        </button>
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          className={STEP_INPUT}
          aria-describedby={hint === null ? undefined : `${id}-hint`}
          aria-invalid={invalid}
          disabled={disabled}
          value={value}
          onChange={(event) => onText(event.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className={STEP_BUTTON}
          aria-label={higher.label}
          disabled={higher.disabled}
          onClick={higher.run}
        >
          +
        </button>
      </div>
      {hint === null ? null : (
        <p
          id={`${id}-hint`}
          className={`tw-m-0 tw-text-[12.5px] ${invalid ? "tw-text-error" : "tw-text-iron-400"}`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

interface StepperButton {
  readonly label: string;
  readonly disabled: boolean;
  readonly run: () => void;
}

function priceHint(
  locale: SupportedLocale,
  prices: readonly Wei[] | undefined,
  price: Wei | undefined,
  typed: string | null
): string {
  const typedWei = typed === null ? null : parsePrice(typed);
  const minPrice = prices?.[0];
  const maxPrice = prices?.at(-1);
  if (
    typed !== null &&
    typedWei === null &&
    minPrice !== undefined &&
    maxPrice !== undefined
  ) {
    return t(locale, "stream.editionAuction.box.priceError", {
      min: priceText(locale, minPrice),
      max: priceText(locale, maxPrice),
    });
  }
  if (typedWei !== null && price !== undefined && typedWei !== price) {
    return t(locale, "stream.editionAuction.box.snapped", {
      price: priceText(locale, price),
    });
  }
  return t(locale, "stream.editionAuction.box.steps");
}

function placedText(
  locale: SupportedLocale,
  qty: number,
  price: Wei,
  won: number
): string {
  const standing = standingOf(won, qty);
  const counts = {
    won: formatInteger(locale, won),
    qty: formatInteger(locale, qty),
  };
  return t(locale, "stream.editionAuction.box.placed", {
    qty: counts.qty,
    price: priceText(locale, price),
    standing:
      standing === "partly"
        ? t(locale, "stream.editionAuction.box.placedPartly", counts)
        : t(locale, `stream.editionAuction.box.placed.${standing}`),
  });
}

interface Notice {
  readonly ok: boolean;
  readonly text: string;
}

function noticeOf(
  locale: SupportedLocale,
  result: TxResult<{ readonly bidId: number }> | null,
  placed: () => string
): Notice {
  if (result === null) {
    return { ok: false, text: t(locale, "stream.tx.connect") };
  }
  return result.ok
    ? { ok: true, text: placed() }
    : { ok: false, text: txErrorMessage(locale, result.error) };
}

/** The quantity field: the text as typed, and the number it means. */
function useQuantity() {
  const [text, setText] = useState("1");
  const qty = parseQty(text);
  const valid = Number.isInteger(qty) && qty >= 1 && qty <= MAX_QTY;
  return { text, setText, qty, valid };
}

const ARROW_STEPS: Readonly<Record<string, number>> = {
  ArrowUp: 1,
  ArrowDown: -1,
};

/**
 * The bid box: a price stepper on the ladder (steps of about 5%), a quantity,
 * a two-line preview from `quote`, and "Use X to get all N in".
 */
export default function BidBox({
  auction,
  prices,
  submit,
  pending,
  locale,
  id,
  className,
}: {
  readonly auction: EditionAuction;
  readonly prices: readonly Wei[] | undefined;
  readonly submit: (
    step: number,
    qty: number
  ) => Promise<TxResult<{ readonly bidId: number }> | null>;
  readonly pending: boolean;
  readonly locale: SupportedLocale;
  readonly id: string;
  readonly className: string;
}) {
  const fieldId = useId();
  const bidButton = useRef<HTMLButtonElement>(null);
  const { terms } = auction;
  const ladder = terms;
  const [chosen, setChosen] = useState<number | null>(null);
  const [typed, setTyped] = useState<string | null>(null);
  const quantity = useQuantity();
  const [notice, setNotice] = useState<Notice | null>(null);
  const step =
    chosen ?? auction.clearing.step ?? nearestStep(DEFAULT_PRICE, ladder);
  const priceError = typed !== null && parsePrice(typed) === null;
  const { qty } = quantity;
  const open = auction.biddingOpen;
  const ready = open && quantity.valid && !priceError;
  const price = prices?.[step];
  const { data: quote } = useStreamQuery(
    "edition-quote",
    [auction.edition, step, ready ? qty : 0],
    (source) =>
      ready
        ? source.quoteEditionBid(auction.edition, step, qty)
        : Promise.resolve(null)
  );
  const { data: lowestIn } = useStreamQuery(
    "edition-lowest-in",
    [auction.edition, ready ? qty : 0],
    (source) =>
      ready
        ? source.lowestStepFullyIn(auction.edition, qty)
        : Promise.resolve(null)
  );

  const moveTo = (next: number) => {
    setChosen(Math.max(0, Math.min(terms.stepCount - 1, next)));
    setTyped(null);
    setNotice(null);
  };
  const setQty = (text: string) => {
    quantity.setText(text);
    setNotice(null);
  };
  const place = async () => {
    if (!ready || price === undefined) {
      return;
    }
    const won = quote?.unitsWon ?? 0;
    const result = await submit(step, qty);
    setNotice(
      noticeOf(locale, result, () => placedText(locale, qty, price, won))
    );
  };
  const onEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void place();
    }
  };
  const onPriceKey = (event: KeyboardEvent<HTMLInputElement>) => {
    const move = ARROW_STEPS[event.key];
    if (move !== undefined && !priceError) {
      event.preventDefault();
      moveTo(step + move);
    } else {
      onEnter(event);
    }
  };
  const escrow = ready && price !== undefined ? BigInt(qty) * price : null;
  const gas = GAS_ESTIMATES.editionBid;

  return (
    <PanelCard
      id={id}
      title={t(locale, "stream.editionAuction.box.title")}
      className={className}
    >
      <Stepper
        id={`${fieldId}-price`}
        label={t(locale, "stream.editionAuction.box.price")}
        value={typed ?? (price === undefined ? "" : priceText(locale, price))}
        inputMode="decimal"
        invalid={priceError}
        disabled={!open}
        hint={priceHint(locale, prices, price, typed)}
        lower={{
          label: t(locale, "stream.editionAuction.box.lower"),
          disabled: !open || priceError || step <= 0,
          run: () => moveTo(step - 1),
        }}
        higher={{
          label: t(locale, "stream.editionAuction.box.higher"),
          disabled: !open || priceError || step >= terms.stepCount - 1,
          run: () => moveTo(step + 1),
        }}
        onText={(text) => {
          setTyped(text);
          setNotice(null);
          const wei = parsePrice(text);
          if (wei !== null) {
            setChosen(nearestStep(wei, ladder));
          }
        }}
        onBlur={() => {
          if (!priceError) {
            setTyped(null);
          }
        }}
        onKeyDown={onPriceKey}
      />
      <Stepper
        id={`${fieldId}-qty`}
        label={t(locale, "stream.editionAuction.box.qty")}
        value={quantity.text}
        inputMode="numeric"
        invalid={!quantity.valid}
        disabled={!open}
        hint={
          quantity.valid
            ? null
            : t(locale, "stream.editionAuction.box.qtyError", {
                max: formatInteger(locale, MAX_QTY),
              })
        }
        lower={{
          label: t(locale, "stream.editionAuction.box.fewer"),
          disabled: !open || !quantity.valid || qty <= 1,
          run: () => setQty(String(Math.max(1, qty - 1))),
        }}
        higher={{
          label: t(locale, "stream.editionAuction.box.more"),
          disabled: !open || (quantity.valid && qty >= MAX_QTY),
          run: () =>
            setQty(String(Math.min(MAX_QTY, (quantity.valid ? qty : 0) + 1))),
        }}
        onText={setQty}
        onKeyDown={onEnter}
      />
      {open ? (
        <div
          className="tw-mb-3.5 tw-grid tw-gap-1.5 tw-rounded-lg tw-bg-iron-900 tw-p-3 tw-text-[13.5px] tw-text-iron-200"
          aria-live="polite"
        >
          {ready && quote !== null && quote !== undefined ? (
            <Preview
              auction={auction}
              quote={quote}
              qty={qty}
              lowestIn={lowestIn}
              prices={prices}
              onUse={(next) => {
                moveTo(next);
                bidButton.current?.focus();
              }}
              locale={locale}
            />
          ) : (
            <p className="tw-m-0">
              {t(locale, "stream.editionAuction.box.enter")}
            </p>
          )}
        </div>
      ) : null}
      <button
        ref={bidButton}
        type="button"
        className={`${PANEL_PRIMARY} tw-w-full`}
        disabled={!ready || pending || escrow === null}
        onClick={() => void place()}
      >
        {bidLabel(locale, auction, escrow)}
      </button>
      <p
        className={`tw-m-0 tw-mt-2 tw-min-h-5 tw-text-[13px] ${notice?.ok === false ? "tw-text-error" : "tw-text-success"}`}
        role="status"
      >
        {notice?.text ?? ""}
      </p>
      <p className={`${PANEL_NOTE} tw-mt-1`}>
        {t(locale, "stream.editionAuction.box.fine")}
      </p>
      <p className={`${PANEL_NOTE} tw-mt-1`}>
        {t(locale, "stream.editionAuction.box.gas", {
          low: compactGas(locale, gas.low),
          high: compactGas(locale, gas.high),
        })}
      </p>
    </PanelCard>
  );
}
