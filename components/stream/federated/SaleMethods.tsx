"use client";

import Link from "next/link";
import { type FormEvent, useId, useState } from "react";

import { useStream } from "@/components/stream/data/StreamProvider";
import {
  FIELD_ERROR,
  FIELD_INPUT,
} from "@/components/stream/federated/formStyles";
import { useStreamAction } from "@/components/stream/pages/common";
import { txErrorMessage } from "@/components/stream/ui/GasNote";
import {
  STREAM_BUTTON_PRIMARY,
  STREAM_BUTTON_SECONDARY,
  STREAM_HELP,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type {
  Address,
  FederatedContract,
  KnownSaleKind,
  SaleKindId,
  WorkKey,
} from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

/**
 * A federated contract's sale methods, read from the registry entry as a list
 * (owner decision 14): every contract starts with the two auctions, and
 * governance can admit another adapter later without a redeploy. A kind this
 * page doesn't know renders as a plain "not shown here yet" row.
 */

type MethodMode = "start" | "withMaster" | "unsupported";

interface SaleMethod {
  readonly kind: SaleKindId;
  /** The contract (or pair half) the method mints into. */
  readonly contract: FederatedContract;
  readonly mode: MethodMode;
}

const KNOWN_KINDS: readonly KnownSaleKind[] = [
  "ENGLISH_AUCTION",
  "UNIFORM_EDITION_AUCTION",
];

function isKnownKind(kind: SaleKindId): kind is KnownSaleKind {
  return (KNOWN_KINDS as readonly string[]).includes(kind);
}

function modeOf(contract: FederatedContract, kind: SaleKindId): MethodMode {
  if (kind === "ENGLISH_AUCTION" && contract.standard === "ERC721") {
    return "start";
  }
  if (kind === "UNIFORM_EDITION_AUCTION" && contract.standard === "ERC1155") {
    // A pair's editions open with each 1/1, as in 6529 Stream Editions.
    return contract.form === "PAIR" ? "withMaster" : "start";
  }
  return "unsupported";
}

/** Every method across a contract and its pair partner, the 1/1 half first. */
function saleMethodsOf(
  entry: FederatedContract,
  partner: FederatedContract | null
): readonly SaleMethod[] {
  const halves = [entry, ...(partner === null ? [] : [partner])].sort(
    (left, right) =>
      Number(left.standard === "ERC1155") - Number(right.standard === "ERC1155")
  );
  return halves.flatMap((contract) =>
    contract.saleKinds.map((kind) => ({
      kind,
      contract,
      mode: modeOf(contract, kind),
    }))
  );
}

function methodName(locale: SupportedLocale, kind: SaleKindId): string {
  return isKnownKind(kind)
    ? t(locale, `stream.federated.method.${kind}.name`)
    : t(locale, "stream.federated.method.unknown", { kind });
}

function startLabel(locale: SupportedLocale, kind: SaleKindId): string {
  return isKnownKind(kind)
    ? t(locale, `stream.federated.sell.start.${kind}`)
    : methodName(locale, kind);
}

function methodLine(locale: SupportedLocale, method: SaleMethod): string {
  if (!isKnownKind(method.kind)) {
    return t(locale, "stream.federated.method.unknownLine");
  }
  return method.mode === "withMaster"
    ? t(locale, "stream.federated.sell.withMaster")
    : t(locale, `stream.federated.method.${method.kind}.line`);
}

/** The read-only list on the contract page. */
export function SaleMethodList({
  entry,
  partner,
  locale,
}: {
  readonly entry: FederatedContract;
  readonly partner: FederatedContract | null;
  readonly locale: SupportedLocale;
}) {
  const methods = saleMethodsOf(entry, partner);
  return (
    <div>
      <ul className="tw-m-0 tw-list-none tw-divide-y tw-divide-solid tw-divide-iron-800 tw-border-0 tw-border-y tw-border-solid tw-border-iron-800 tw-p-0">
        {methods.map((method) => (
          <li
            key={`${method.contract.address}:${method.kind}`}
            className="tw-flex tw-flex-col tw-gap-0.5 tw-py-3 sm:tw-flex-row sm:tw-items-baseline sm:tw-gap-4"
          >
            <span className="tw-text-sm tw-font-semibold tw-text-iron-50 sm:tw-w-40 sm:tw-flex-none">
              {methodName(locale, method.kind)}
            </span>
            <span className="tw-text-sm tw-leading-6 tw-text-iron-300">
              {methodLine(locale, method)}
              {partner === null ? null : (
                <span className="tw-block tw-text-xs tw-text-iron-400">
                  {t(locale, "stream.federated.method.half", {
                    form: t(
                      locale,
                      `stream.federated.form.${method.contract.standard}`
                    ),
                  })}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className={`${STREAM_HELP} tw-mt-3`}>
        {t(locale, "stream.federated.contract.methodsNote")}
      </p>
    </div>
  );
}

const CAP = /^[1-9]\d{0,8}$/;

interface Started {
  readonly key: WorkKey;
  readonly title: string;
  readonly kind: SaleKindId;
}

function StartedNote({
  started,
  locale,
}: {
  readonly started: Started;
  readonly locale: SupportedLocale;
}) {
  const href =
    started.kind === "UNIFORM_EDITION_AUCTION"
      ? STREAM_ROUTES.edition(started.key)
      : STREAM_ROUTES.work(started.key);
  return (
    <div
      className="tw-flex tw-flex-wrap tw-items-center tw-gap-3"
      role="status"
    >
      <p className="tw-m-0 tw-text-sm tw-text-success">
        {t(locale, "stream.federated.sell.started", { title: started.title })}
      </p>
      <Link
        href={href}
        className={`${STREAM_BUTTON_SECONDARY} tw-no-underline`}
      >
        {t(locale, "stream.federated.sell.openWork")}
      </Link>
    </div>
  );
}

/** One line on how the chosen method closes. */
function methodNote(locale: SupportedLocale, method: SaleMethod): string {
  if (method.contract.form === "PAIR") {
    return t(locale, "stream.federated.sell.pairNote");
  }
  return method.kind === "UNIFORM_EDITION_AUCTION"
    ? t(locale, "stream.federated.sell.standaloneNote")
    : t(locale, "stream.federated.method.ENGLISH_AUCTION.line");
}

function MethodPicker({
  methods,
  choice,
  onChoose,
  locale,
}: {
  readonly methods: readonly SaleMethod[];
  readonly choice: number;
  readonly onChoose: (index: number) => void;
  readonly locale: SupportedLocale;
}) {
  const id = useId();
  const chosen = methods[choice];
  if (methods.length === 1 && chosen !== undefined) {
    return (
      <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
        {methodName(locale, chosen.kind)}
      </p>
    );
  }
  return (
    <fieldset className="tw-m-0 tw-border-0 tw-p-0">
      <legend className={STREAM_LABEL}>
        {t(locale, "stream.federated.sell.method")}
      </legend>
      <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-2">
        {methods.map((option, index) => (
          <label
            key={`${option.contract.address}:${option.kind}`}
            className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-100"
          >
            <input
              type="radio"
              name={`${id}-method`}
              checked={index === choice}
              onChange={() => onChoose(index)}
              className="tw-size-4 tw-accent-primary-500"
            />
            {methodName(locale, option.kind)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A labelled text input with its help line, which turns into the error when invalid. */
function SellField({
  label,
  value,
  onChange,
  error,
  help,
  numeric = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error: string | null;
  readonly help?: string;
  readonly numeric?: boolean;
}) {
  const id = useId();
  const note = error ?? help ?? null;
  return (
    <div>
      <label htmlFor={`${id}-input`} className={STREAM_LABEL}>
        {label}
      </label>
      <input
        id={`${id}-input`}
        type="text"
        inputMode={numeric ? "numeric" : undefined}
        value={value}
        maxLength={numeric ? 9 : 120}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error !== null}
        aria-describedby={note === null ? undefined : `${id}-note`}
        className={`${FIELD_INPUT} ${numeric ? "sm:tw-max-w-[12rem]" : ""}`}
      />
      {note === null ? null : (
        <p
          id={`${id}-note`}
          className={error === null ? `${STREAM_HELP} tw-mt-1` : FIELD_ERROR}
        >
          {note}
        </p>
      )}
    </div>
  );
}

function SellForm({
  methods,
  locale,
}: {
  readonly methods: readonly SaleMethod[];
  readonly locale: SupportedLocale;
}) {
  const [choice, setChoice] = useState(0);
  const [title, setTitle] = useState("");
  const [cap, setCap] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState<Started | null>(null);
  const { run, pending } = useStreamAction(locale);
  const method = methods[Math.min(choice, methods.length - 1)];
  if (method === undefined) {
    return null;
  }
  const isEdition = method.kind === "UNIFORM_EDITION_AUCTION";
  const titleError =
    title.trim() === "" ? t(locale, "stream.federated.sell.titleError") : null;
  const capError =
    isEdition && cap.trim() !== "" && !CAP.test(cap.trim())
      ? t(locale, "stream.federated.sell.capError")
      : null;

  async function start(chosen: SaleMethod) {
    const name = title.trim();
    const contract = chosen.contract.address;
    const result = await run((actions, from) =>
      chosen.kind === "UNIFORM_EDITION_AUCTION"
        ? actions.openFederatedEditionAuction(
            from,
            contract,
            name,
            Number(cap.trim() || "0")
          )
        : actions.mintViaAuction(from, contract, name)
    );
    if (result === null) {
      setError(t(locale, "stream.tx.connect"));
    } else if (result.ok) {
      setStarted({ key: result.value, title: name, kind: chosen.kind });
      setTitle("");
      setCap("");
      setShowErrors(false);
    } else {
      setError(txErrorMessage(locale, result.error));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setShowErrors(true);
    if (method !== undefined && titleError === null && capError === null) {
      void start(method);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="tw-flex tw-flex-col tw-gap-4">
      <MethodPicker
        methods={methods}
        choice={choice}
        onChoose={setChoice}
        locale={locale}
      />
      <p className={STREAM_HELP}>{methodNote(locale, method)}</p>
      <SellField
        label={t(locale, "stream.federated.sell.title")}
        value={title}
        onChange={setTitle}
        error={showErrors ? titleError : null}
      />
      {isEdition ? (
        <SellField
          label={t(locale, "stream.federated.sell.cap")}
          value={cap}
          onChange={setCap}
          error={showErrors ? capError : null}
          help={t(locale, "stream.federated.sell.capHelp")}
          numeric
        />
      ) : null}
      <div>
        <button
          type="submit"
          disabled={pending}
          className={STREAM_BUTTON_PRIMARY}
        >
          {startLabel(locale, method.kind)}
        </button>
      </div>
      {error === null ? null : (
        <p className="tw-m-0 tw-text-sm tw-text-error" role="alert">
          {error}
        </p>
      )}
      {started === null ? null : (
        <StartedNote started={started} locale={locale} />
      )}
    </form>
  );
}

/**
 * The artist starts a sale on their contract: a title (and an optional cap for
 * a standalone edition auction), then one action. The mint runs through the
 * admitted adapter (`mintViaAuction`, `openFederatedEditionAuction`).
 */
export function SellPanel({
  entry,
  partner,
  owner,
  locale,
}: {
  readonly entry: FederatedContract;
  readonly partner: FederatedContract | null;
  /** The artist's authority: only it can start a sale. */
  readonly owner: Address;
  readonly locale: SupportedLocale;
}) {
  const { account } = useStream();
  if (entry.status !== "ACTIVE" || entry.artistDelisted) {
    return (
      <p className={STREAM_HELP}>
        {t(locale, "stream.federated.sell.delisted")}
      </p>
    );
  }
  if (account?.toLowerCase() !== owner.toLowerCase()) {
    return (
      <p className={STREAM_HELP}>
        {t(locale, "stream.federated.sell.notArtist")}
      </p>
    );
  }
  const methods = saleMethodsOf(entry, partner).filter(
    (method) => method.mode === "start"
  );
  return <SellForm methods={methods} locale={locale} />;
}
