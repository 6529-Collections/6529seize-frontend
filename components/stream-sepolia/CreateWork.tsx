"use client";

import { darkInputClassName } from "@/components/utils/input/dark-input-styles";
import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";
import Link from "next/link";
import { useState } from "react";
import type { Address } from "viem";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { MAX_MEDIA_BYTES, mediaDataUrl, prepareMedia, type StoredFile } from "@/lib/stream/content";
import {
  approveIndependentItem,
  openIndependentEdition,
  openWorkRecord,
  startIndependentSale,
  storeStartFile,
  storeFile,
  type IndependentWorkContext,
} from "@/lib/stream/create";
import type { IndependentContract } from "@/lib/stream/activity";
import { LISTING_ACTIVE } from "@/lib/stream/independent";
import { getStreamInstance } from "@/lib/stream/instances";
import { sameAddress } from "@/lib/stream/state";

import { draftReady, parseCap, parseRoyalty, type Draft } from "@/lib/stream/createDraft";

import { FIELD_LABEL, FilesFailed, HINT, LINK, RunHeader, useStoredFiles } from "./createShared";
import { CollectionField, CuratedRun, type CreatedWork } from "./CuratedRun";
import { formatCount, shortAddress } from "./format";
import { CARD } from "./OneOfOnePanel";
import { StepRunner, type Step } from "./StepRunner";
import { STREAM_BASE } from "./StreamNav";
import { useMyCollections } from "./useStreamData";
import { useStreamWallet, WalletGate } from "./WalletGate";
import { StreamLoading } from "./StreamLoading";

type Product = "stream" | "independent";

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
          <CommonBorderedRadioButton
            key={option.id}
            type={option.id}
            selected={value}
            name="stream-product"
            variant="subtle"
            nativeSelection
            multiline
            disabled={option.disabled}
            onChange={onChange}
          >
            <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-50">{option.title}</span>
            <span className="tw-block tw-text-xs tw-font-normal tw-text-iron-400">{option.help}</span>
          </CommonBorderedRadioButton>
        ))}
      </div>
    </fieldset>
  );
}

function mediaHint(busy: boolean, media: Draft["media"], locale: SupportedLocale): string {
  if (busy) return t(locale, "streamSepolia.create.artPreparing");
  if (!media) {
    return t(locale, "streamSepolia.create.artHelp", {
      max: formatCount(Math.floor(MAX_MEDIA_BYTES / 1024), locale),
    });
  }
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

function reviewLine(draft: Draft, locale: SupportedLocale): string {
  if (!draft.editions) return t(locale, "streamSepolia.create.reviewOne");
  const cap = parseCap(draft.cap) ?? 0;
  return t(locale, "streamSepolia.create.reviewEditions", {
    cap: cap > 0 ? formatCount(cap, locale) : t(locale, "streamSepolia.create.noCap"),
  });
}

function IndependentRun(props: {
  readonly viewer: Address;
  readonly token: Address;
  readonly editionsToken: Address | null;
  readonly draft: Draft;
  readonly onDone: (work: CreatedWork) => void;
}) {
  const { files, failed, retry } = useStoredFiles(props.draft, props.viewer);
  if (failed) return <FilesFailed onRetry={retry} />;
  if (!files) return <StreamLoading />;
  return <IndependentSteps {...props} files={files} />;
}

function IndependentSteps({
  viewer,
  token,
  editionsToken,
  draft,
  files,
  onDone,
}: {
  readonly viewer: Address;
  readonly token: Address;
  readonly editionsToken: Address | null;
  readonly draft: Draft;
  readonly files: { readonly media: StoredFile; readonly record: StoredFile };
  readonly onDone: (work: CreatedWork) => void;
}) {
  const locale = useBrowserLocale();
  // One run's state, created once and filled step by step so "Continue" resumes after a failure.
  const [context] = useState<IndependentWorkContext>(() => ({
    artist: viewer,
    token,
    editionsToken: draft.editions ? editionsToken : null,
    media: files.media,
    record: files.record,
    royaltyRate: parseRoyalty(draft.royalty) ?? 6529,
    editionCap: draft.editions ? (parseCap(draft.cap) ?? 0) : null,
  }));
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
      id: "startFile",
      label: t(locale, "streamSepolia.create.step.startFile"),
      help: t(locale, "streamSepolia.create.step.startFileHelp"),
      run: (ctx, io) => storeStartFile(ctx, io),
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
    <>
      <RunHeader files={files} curated={false} newCollection={false} editions={draft.editions && !!editionsToken} />
      <StepRunner
        steps={steps}
        context={context}
        startLabel={t(locale, "streamSepolia.create.go")}
        onFinished={(ctx) => {
          if (ctx.tokenId !== undefined) onDone({ token: ctx.token, tokenId: ctx.tokenId, editions: draft.editions });
        }}
      />
    </>
  );
}

function EditionsField({
  draft,
  available,
  capValid,
  onChange,
}: {
  readonly draft: Draft;
  readonly available: boolean;
  readonly capValid: boolean;
  readonly onChange: (patch: Partial<Draft>) => void;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-p-3">
      <label className="tw-flex tw-items-start tw-gap-3 tw-text-sm tw-text-iron-100">
        <input
          type="checkbox"
          className="tw-mt-1 tw-accent-primary-500"
          checked={draft.editions}
          disabled={!available}
          onChange={(event) => onChange({ editions: event.target.checked })}
        />
        <span>
          <span className="tw-block tw-font-semibold">{t(locale, "streamSepolia.create.editions")}</span>
          <span className="tw-block tw-text-xs tw-text-iron-400">
            {available ? t(locale, "streamSepolia.create.editionsHelp") : t(locale, "streamSepolia.create.editionsNeedContract")}
          </span>
        </span>
      </label>
      {draft.editions ? (
        <div className="tw-mt-3 tw-max-w-xs">
          <label htmlFor="stream-create-cap" className={FIELD_LABEL}>{t(locale, "streamSepolia.create.cap")}</label>
          <input
            id="stream-create-cap"
            className={darkInputClassName}
            inputMode="numeric"
            value={draft.cap}
            aria-invalid={!capValid}
            aria-describedby="stream-create-cap-hint"
            onChange={(event) => onChange({ cap: event.target.value })}
          />
          <p id="stream-create-cap-hint" className={capValid ? HINT : `${HINT} tw-text-red`}>
            {t(locale, capValid ? "streamSepolia.create.capHelp" : "streamSepolia.create.capInvalid")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** The artist's listed 1/1 contract and its editions partner, if any. */
function listedContracts(contracts: readonly IndependentContract[]) {
  const oneOfOne = contracts.find((contract) => !contract.editions && contract.status === LISTING_ACTIVE);
  const editions = oneOfOne
    ? contracts.find(
        (contract) =>
          contract.editions && contract.status === LISTING_ACTIVE && sameAddress(contract.partner, oneOfOne.token)
      )
    : undefined;
  return { oneOfOne, editions };
}

function CreateBody({ viewer }: { readonly viewer: Address }) {
  const locale = useBrowserLocale();
  const collections = useMyCollections(viewer);
  // Curated first where any wallet can create curated works (r9 on).
  const [product, setProduct] = useState<Product>(getStreamInstance().curatedCreationOpen ? "stream" : "independent");
  const [draft, setDraft] = useState<Draft>({
    media: null,
    title: "",
    description: "",
    artistName: "",
    royalty: "6.529",
    editions: false,
    cap: "",
    collection: "new",
    newCollectionName: "",
  });
  const [reviewing, setReviewing] = useState(false);
  const [done, setDone] = useState<CreatedWork | null>(null);
  if (collections.isLoading) {
    return <StreamLoading onRetry={() => void collections.refetch()} />;
  }
  const { oneOfOne, editions } = listedContracts(collections.data ?? []);
  if (done) {
    return (
      <section className={CARD} role="status">
        <p className="tw-m-0 tw-text-lg tw-font-semibold tw-text-emerald-400">{t(locale, "streamSepolia.create.done")}</p>
        <Link href={`${STREAM_BASE}/work/${done.token}/${done.tokenId.toString()}`} className={`${LINK} tw-mt-2 tw-inline-block tw-text-sm tw-font-semibold`}>
          {t(locale, "streamSepolia.create.viewWork")}
        </Link>
      </section>
    );
  }
  const royaltyValid = parseRoyalty(draft.royalty) !== null;
  const capValid = !draft.editions || parseCap(draft.cap) !== null;
  const curated = product === "stream";
  const ready = draftReady(draft, curated, !!oneOfOne);
  const editionsAvailable = curated || !!editions;
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const independentContract = curated ? undefined : oneOfOne;
  if (reviewing && (curated || independentContract)) {
    return (
      <section className={CARD} aria-labelledby="stream-create-review">
        <h2 id="stream-create-review" className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          {t(locale, "streamSepolia.create.reviewTitle", { title: draft.title.trim() })}
        </h2>
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">{reviewLine(draft, locale)}</p>
        <div className="tw-mt-4">
          {independentContract ? (
            <IndependentRun
              viewer={viewer}
              token={independentContract.token}
              editionsToken={editions?.token ?? null}
              draft={draft}
              onDone={setDone}
            />
          ) : (
            <CuratedRun viewer={viewer} draft={draft} onDone={setDone} />
          )}
        </div>
      </section>
    );
  }
  return (
    <form
      className="tw-flex tw-flex-col tw-gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) setReviewing(true);
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
      {curated ? (
        <CollectionField choice={draft.collection} newName={draft.newCollectionName} onChange={update} />
      ) : null}
      <MediaPicker media={draft.media} onChange={(media) => update({ media })} />
      <div>
        <label htmlFor="stream-create-title" className={FIELD_LABEL}>{t(locale, "streamSepolia.create.titleField")}</label>
        <input id="stream-create-title" className={darkInputClassName} maxLength={80} value={draft.title} onChange={(event) => update({ title: event.target.value })} />
      </div>
      <div>
        <label htmlFor="stream-create-description" className={FIELD_LABEL}>{t(locale, "streamSepolia.create.description")}</label>
        <textarea
          id="stream-create-description"
          className={`${darkInputClassName} tw-h-24 tw-py-2.5`}
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
            className={darkInputClassName}
            maxLength={48}
            placeholder={shortAddress(viewer)}
            value={draft.artistName}
            onChange={(event) => update({ artistName: event.target.value })}
          />
        </div>
        {curated ? null : (
        <div>
          <label htmlFor="stream-create-royalty" className={FIELD_LABEL}>{t(locale, "streamSepolia.create.royalty")}</label>
          <input
            id="stream-create-royalty"
            className={darkInputClassName}
            inputMode="decimal"
            value={draft.royalty}
            aria-invalid={!royaltyValid}
            aria-describedby="stream-create-royalty-hint"
            onChange={(event) => update({ royalty: event.target.value })}
          />
          <p id="stream-create-royalty-hint" className={HINT}>{t(locale, "streamSepolia.create.royaltyHelp")}</p>
        </div>
        )}
      </div>
      <EditionsField draft={draft} available={editionsAvailable} capValid={capValid} onChange={update} />
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
