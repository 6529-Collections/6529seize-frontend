"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Address } from "viem";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { mediaDataUrl, prepareMedia, recordBytes, toStoredFile } from "@/lib/stream/content";
import {
  approveIndependentItem,
  openIndependentEdition,
  openWorkRecord,
  startIndependentSale,
  storeFile,
  type IndependentWorkContext,
} from "@/lib/stream/create";
import { LISTING_ACTIVE } from "@/lib/stream/independent";
import { getStreamInstance } from "@/lib/stream/instances";
import { sameAddress } from "@/lib/stream/state";

import { formatCount, shortAddress } from "./format";
import { CARD } from "./OneOfOnePanel";
import { StepRunner, type Step } from "./StepRunner";
import { STREAM_BASE } from "./StreamNav";
import { useMyCollections } from "./useStreamData";
import { useStreamWallet, WalletGate } from "./WalletGate";

const INPUT =
  "tw-block tw-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black/25 tw-px-4 tw-text-base tw-text-iron-100 placeholder:tw-text-iron-600 focus:tw-border-primary-400/70 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/20";
const FIELD_LABEL = "tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-iron-200";
const HINT = "tw-m-0 tw-mt-1.5 tw-text-xs tw-text-iron-500";
const LINK = "tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-400";

type Product = "stream" | "independent";

interface Draft {
  readonly media: { bytes: Uint8Array; mimeType: string } | null;
  readonly title: string;
  readonly description: string;
  readonly artistName: string;
  readonly royalty: string;
  readonly editions: boolean;
  readonly cap: string;
}

function ProductChoice({
  value,
  onChange,
}: {
  readonly value: Product;
  readonly onChange: (next: Product) => void;
}) {
  const locale = useBrowserLocale();
  const curatedOpen = getStreamInstance().curatedCreationOpen;
  const options: { id: Product; title: string; help: string; disabled: boolean }[] = [
    {
      id: "independent",
      title: t(locale, "streamSepolia.product.independent"),
      help: t(locale, "streamSepolia.create.independentHelp"),
      disabled: false,
    },
    {
      id: "stream",
      title: t(locale, "streamSepolia.product.stream"),
      help: curatedOpen
        ? t(locale, "streamSepolia.create.streamHelp")
        : t(locale, "streamSepolia.create.streamClosed"),
      disabled: !curatedOpen,
    },
  ];
  return (
    <fieldset className="tw-m-0 tw-border-0 tw-p-0">
      <legend className="tw-mb-2 tw-text-sm tw-font-semibold tw-text-iron-200">
        {t(locale, "streamSepolia.create.where")}
      </legend>
      <div className="tw-flex tw-flex-col tw-gap-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={`tw-flex tw-cursor-pointer tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-p-3 ${
              value === option.id ? "tw-border-primary-400/60 tw-bg-primary-500/[0.06]" : "tw-border-white/[0.08]"
            } ${option.disabled ? "tw-cursor-not-allowed tw-opacity-60" : ""}`}
          >
            <input
              type="radio"
              name="stream-product"
              className="tw-mt-1 tw-accent-primary-500"
              checked={value === option.id}
              disabled={option.disabled}
              onChange={() => onChange(option.id)}
            />
            <span>
              <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-50">{option.title}</span>
              <span className="tw-block tw-text-xs tw-text-iron-400">{option.help}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function mediaHint(busy: boolean, media: Draft["media"], locale: SupportedLocale): string {
  if (busy) return t(locale, "streamSepolia.create.artPreparing");
  if (!media) return t(locale, "streamSepolia.create.artHelp");
  return t(locale, "streamSepolia.create.artSize", {
    size: formatCount(Math.ceil(media.bytes.length / 1024), locale),
  });
}

function MediaPicker({
  media,
  onChange,
}: {
  readonly media: Draft["media"];
  readonly onChange: (media: Draft["media"]) => void;
}) {
  const locale = useBrowserLocale();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = media ? mediaDataUrl(media.bytes, media.mimeType) : null;
  return (
    <div>
      <label htmlFor="stream-create-media" className={FIELD_LABEL}>
        {t(locale, "streamSepolia.create.art")}
      </label>
      <input
        id="stream-create-media"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="tw-block tw-w-full tw-text-sm tw-text-iron-300 file:tw-mr-3 file:tw-h-10 file:tw-cursor-pointer file:tw-rounded-lg file:tw-border-0 file:tw-bg-white/[0.07] file:tw-px-4 file:tw-text-sm file:tw-font-semibold file:tw-text-iron-100"
        aria-describedby="stream-create-media-hint"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            const prepared = await prepareMedia(file);
            if (!prepared) {
              setError(t(locale, "streamSepolia.create.artTooLarge"));
              onChange(null);
            } else {
              onChange(prepared);
            }
          } finally {
            setBusy(false);
          }
        }}
      />
      <p id="stream-create-media-hint" className={HINT}>
        {mediaHint(busy, media, locale)}
      </p>
      {error ? <p role="alert" className="tw-m-0 tw-mt-1 tw-text-sm tw-text-red">{error}</p> : null}
      {preview ? (
        <div className="tw-mt-3 tw-flex tw-aspect-square tw-w-48 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={t(locale, "streamSepolia.create.artPreview")} className="tw-h-full tw-w-full tw-object-contain" />
        </div>
      ) : null}
    </div>
  );
}

function parseRoyalty(value: string): number | null {
  const number = Number(value.replace(",", "."));
  if (!Number.isFinite(number) || number < 0 || number > 25) return null;
  return Math.round(number * 1000);
}

function parseCap(value: string): number | null {
  if (value.trim() === "") return 0;
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 && number < 4_294_967_295 ? number : null;
}

function reviewLine(draft: Draft, locale: SupportedLocale): string {
  if (!draft.editions) return t(locale, "streamSepolia.create.reviewOne");
  const cap = parseCap(draft.cap) ?? 0;
  return t(locale, "streamSepolia.create.reviewEditions", {
    cap: cap > 0 ? formatCount(cap, locale) : t(locale, "streamSepolia.create.noCap"),
  });
}

function IndependentRun({
  token,
  editionsToken,
  draft,
  onDone,
}: {
  readonly token: Address;
  readonly editionsToken: Address | null;
  readonly draft: Draft;
  readonly onDone: (context: IndependentWorkContext) => void;
}) {
  const locale = useBrowserLocale();
  // One run's state, filled step by step so "Continue" resumes after a failure.
  const [context, setContext] = useState<IndependentWorkContext | null>(null);
  useEffect(() => {
    let active = true;
    const media = draft.media!;
    void Promise.all([
      toStoredFile(media.bytes, media.mimeType),
      toStoredFile(
        recordBytes({
          name: draft.title.trim(),
          description: draft.description.trim(),
          artist: draft.artistName.trim(),
          year: new Date().getUTCFullYear(),
        }),
        "application/json"
      ),
    ]).then(([mediaFile, recordFile]) => {
      if (!active) return;
      setContext({
        token,
        editionsToken: draft.editions ? editionsToken : null,
        media: mediaFile,
        record: recordFile,
        royaltyRate: parseRoyalty(draft.royalty) ?? 6529,
        editionCap: draft.editions ? (parseCap(draft.cap) ?? 0) : null,
      });
    });
    return () => {
      active = false;
    };
  }, [draft, token, editionsToken]);
  if (!context) return <p className="tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.loading")}</p>;
  const chunks = context.media.chunks.length;
  const steps: Step<IndependentWorkContext>[] = [
    {
      id: "media",
      label: t(locale, "streamSepolia.create.step.media"),
      help: t(locale, "streamSepolia.create.step.mediaHelp", { count: chunks + 1 }),
      run: async (ctx, io) => {
        const { fileId, sent } = await storeFile(ctx.media, io);
        ctx.primaryFileId = fileId;
        return sent;
      },
    },
    {
      id: "record",
      label: t(locale, "streamSepolia.create.step.record"),
      help: t(locale, "streamSepolia.create.step.recordHelp"),
      run: async (ctx, io) => {
        const { fileId, sent } = await storeFile(ctx.record, io);
        ctx.recordFileId = fileId;
        return sent;
      },
    },
    {
      id: "approve",
      label: t(locale, "streamSepolia.create.step.approve"),
      help: t(locale, "streamSepolia.create.step.approveHelp"),
      run: (ctx, io) => approveIndependentItem(ctx, io),
    },
    {
      id: "start",
      label: t(locale, "streamSepolia.create.step.start"),
      help: t(locale, "streamSepolia.create.step.startHelp"),
      run: (ctx, io) => startIndependentSale(ctx, io),
    },
  ];
  if (draft.editions && editionsToken) {
    steps.push({
      id: "edition",
      label: t(locale, "streamSepolia.create.step.edition"),
      help: t(locale, "streamSepolia.create.step.editionHelp"),
      run: (ctx, io) => openIndependentEdition(ctx, io),
    });
  }
  steps.push({
    id: "facts",
    label: t(locale, "streamSepolia.create.step.facts"),
    help: t(locale, "streamSepolia.create.step.factsHelp"),
    run: (ctx, io) => openWorkRecord(ctx, io),
  });
  return (
    <StepRunner
      steps={steps}
      context={context}
      startLabel={t(locale, "streamSepolia.create.go")}
      onFinished={onDone}
    />
  );
}

function CreateBody({ viewer }: { readonly viewer: Address }) {
  const locale = useBrowserLocale();
  const collections = useMyCollections(viewer);
  const [product, setProduct] = useState<Product>("independent");
  const [draft, setDraft] = useState<Draft>({
    media: null,
    title: "",
    description: "",
    artistName: "",
    royalty: "6.529",
    editions: false,
    cap: "",
  });
  const [reviewing, setReviewing] = useState(false);
  const [done, setDone] = useState<IndependentWorkContext | null>(null);
  if (collections.isLoading) {
    return <p className="tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.loading")}</p>;
  }
  const contracts = collections.data ?? [];
  const oneOfOne = contracts.find((contract) => !contract.editions && contract.status === LISTING_ACTIVE);
  const editions = oneOfOne
    ? contracts.find(
        (contract) =>
          contract.editions && contract.status === LISTING_ACTIVE && sameAddress(contract.partner, oneOfOne.token)
      )
    : undefined;
  if (done?.tokenId !== undefined) {
    return (
      <section className={CARD}>
        <p className="tw-m-0 tw-text-lg tw-font-semibold tw-text-emerald-400">{t(locale, "streamSepolia.create.done")}</p>
        <Link href={`${STREAM_BASE}/work/${done.token}/${done.tokenId.toString()}`} className={`${LINK} tw-mt-2 tw-inline-block tw-text-sm tw-font-semibold`}>
          {t(locale, "streamSepolia.create.viewWork")}
        </Link>
      </section>
    );
  }
  const royaltyValid = parseRoyalty(draft.royalty) !== null;
  const capValid = !draft.editions || parseCap(draft.cap) !== null;
  const ready = !!draft.media && draft.title.trim().length > 0 && royaltyValid && capValid && !!oneOfOne;
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  if (reviewing && oneOfOne) {
    return (
      <section className={CARD} aria-labelledby="stream-create-review">
        <h2 id="stream-create-review" className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          {t(locale, "streamSepolia.create.reviewTitle", { title: draft.title.trim() })}
        </h2>
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">{reviewLine(draft, locale)}</p>
        <div className="tw-mt-4">
          <IndependentRun token={oneOfOne.token} editionsToken={editions?.token ?? null} draft={draft} onDone={setDone} />
        </div>
      </section>
    );
  }
  return (
    <form
      className="tw-flex tw-flex-col tw-gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;
        if (!draft.artistName.trim()) update({ artistName: shortAddress(viewer) });
        setReviewing(true);
      }}
    >
      <ProductChoice value={product} onChange={setProduct} />
      {product === "independent" && !oneOfOne ? (
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "streamSepolia.create.needCollection")}{" "}
          <Link href={`${STREAM_BASE}/collection`} className={LINK}>
            {t(locale, "streamSepolia.create.makeCollection")}
          </Link>
        </p>
      ) : null}
      <MediaPicker media={draft.media} onChange={(media) => update({ media })} />
      <div>
        <label htmlFor="stream-create-title" className={FIELD_LABEL}>{t(locale, "streamSepolia.create.titleField")}</label>
        <input id="stream-create-title" className={INPUT} maxLength={80} value={draft.title} onChange={(event) => update({ title: event.target.value })} />
      </div>
      <div>
        <label htmlFor="stream-create-description" className={FIELD_LABEL}>{t(locale, "streamSepolia.create.description")}</label>
        <textarea
          id="stream-create-description"
          className={`${INPUT} tw-h-24 tw-py-2.5`}
          maxLength={600}
          value={draft.description}
          onChange={(event) => update({ description: event.target.value })}
        />
      </div>
      <div className="tw-grid tw-gap-5 sm:tw-grid-cols-2">
        <div>
          <label htmlFor="stream-create-artist" className={FIELD_LABEL}>{t(locale, "streamSepolia.create.artistName")}</label>
          <input
            id="stream-create-artist"
            className={INPUT}
            maxLength={48}
            placeholder={shortAddress(viewer)}
            value={draft.artistName}
            onChange={(event) => update({ artistName: event.target.value })}
          />
        </div>
        <div>
          <label htmlFor="stream-create-royalty" className={FIELD_LABEL}>{t(locale, "streamSepolia.create.royalty")}</label>
          <input
            id="stream-create-royalty"
            className={INPUT}
            inputMode="decimal"
            value={draft.royalty}
            aria-invalid={!royaltyValid}
            aria-describedby="stream-create-royalty-hint"
            onChange={(event) => update({ royalty: event.target.value })}
          />
          <p id="stream-create-royalty-hint" className={HINT}>{t(locale, "streamSepolia.create.royaltyHelp")}</p>
        </div>
      </div>
      <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-p-3">
        <label className="tw-flex tw-items-start tw-gap-3 tw-text-sm tw-text-iron-100">
          <input
            type="checkbox"
            className="tw-mt-1 tw-accent-primary-500"
            checked={draft.editions}
            disabled={!editions}
            onChange={(event) => update({ editions: event.target.checked })}
          />
          <span>
            <span className="tw-block tw-font-semibold">{t(locale, "streamSepolia.create.editions")}</span>
            <span className="tw-block tw-text-xs tw-text-iron-400">
              {editions ? t(locale, "streamSepolia.create.editionsHelp") : t(locale, "streamSepolia.create.editionsNeedContract")}
            </span>
          </span>
        </label>
        {draft.editions ? (
          <div className="tw-mt-3 tw-max-w-xs">
            <label htmlFor="stream-create-cap" className={FIELD_LABEL}>{t(locale, "streamSepolia.create.cap")}</label>
            <input
              id="stream-create-cap"
              className={INPUT}
              inputMode="numeric"
              value={draft.cap}
              aria-invalid={!capValid}
              onChange={(event) => update({ cap: event.target.value })}
            />
            <p className={HINT}>{t(locale, "streamSepolia.create.capHelp")}</p>
          </div>
        ) : null}
      </div>
      <div>
        <button
          type="submit"
          disabled={!ready}
          className="tw-h-11 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-primary-600 disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
        >
          {t(locale, "streamSepolia.create.review")}
        </button>
      </div>
    </form>
  );
}

export function CreateWork() {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  return (
    <div className="tw-max-w-2xl">
      <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-text-iron-50">{t(locale, "streamSepolia.create.title")}</h1>
      <p className="tw-m-0 tw-mb-6 tw-mt-2 tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.create.intro")}</p>
      <WalletGate reason={t(locale, "streamSepolia.create.connect")}>
        {wallet.address ? <CreateBody viewer={wallet.address} /> : null}
      </WalletGate>
    </div>
  );
}
