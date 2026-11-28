"use client";

import { darkInputClassName } from "@/components/utils/input/dark-input-styles";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Address } from "viem";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";
import type { StoredFile } from "@/lib/stream/content";
import { storeFile } from "@/lib/stream/create";
import { CreateRunError } from "@/lib/stream/createErrors";
import {
  acceptCuratedPackage,
  completeCuratedRecord,
  curatedPreflight,
  ensureCollection,
  openCuratedEdition,
  readCollections,
  registerCuratedPackage,
  startCuratedSale,
  type CuratedWorkContext,
} from "@/lib/stream/curatedCreate";
import { getStreamInstance } from "@/lib/stream/instances";

import { FIELD_LABEL, FilesFailed, HINT, parseCap, RunHeader, useStoredFiles, type CollectionChoice, type Draft } from "./createShared";
import { StepRunner, type Step } from "./StepRunner";
import { StreamLoading } from "./StreamLoading";

function useCollections() {
  return useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, getStreamInstance().name, "collections"],
    queryFn: readCollections,
    staleTime: 60_000,
  });
}

const RETRY_BUTTON =
  "tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

/** Which 6529 Stream collection the work goes in: an existing one, or a new one through the gate. */
export function CollectionField({
  choice,
  newName,
  onChange,
}: {
  readonly choice: CollectionChoice;
  readonly newName: string;
  readonly onChange: (patch: { collection?: CollectionChoice; newCollectionName?: string }) => void;
}) {
  const locale = useBrowserLocale();
  const collections = useCollections();
  return (
    <div>
      <label htmlFor="stream-create-collection" className={FIELD_LABEL}>
        {t(locale, "streamSepolia.create.collection")}
      </label>
      <select
        id="stream-create-collection"
        className={darkInputClassName}
        value={choice}
        aria-describedby="stream-create-collection-hint"
        onChange={(event) => onChange({ collection: event.target.value as CollectionChoice })}
      >
        <option value="new">{t(locale, "streamSepolia.create.collectionNew")}</option>
        {(collections.data ?? []).map((collection) => (
          <option key={collection.id.toString()} value={collection.id.toString()}>
            {t(locale, "streamSepolia.create.collectionOption", { id: collection.id.toString(), name: collection.name })}
          </option>
        ))}
      </select>
      {collections.isLoading ? (
        <p className={HINT}>{t(locale, "streamSepolia.create.collectionsLoading")}</p>
      ) : null}
      {collections.isError ? (
        <p className={`${HINT} tw-flex tw-gap-2`}>
          <span>{t(locale, "streamSepolia.create.collectionsFailed")}</span>
          <button type="button" className={RETRY_BUTTON} onClick={() => void collections.refetch()}>
            {t(locale, "streamSepolia.retry")}
          </button>
        </p>
      ) : null}
      {choice === "new" ? (
        <div className="tw-mt-3">
          <label htmlFor="stream-create-collection-name" className={FIELD_LABEL}>
            {t(locale, "streamSepolia.create.collectionName")}
          </label>
          <input
            id="stream-create-collection-name"
            className={darkInputClassName}
            maxLength={64}
            value={newName}
            aria-describedby="stream-create-collection-hint"
            onChange={(event) => onChange({ newCollectionName: event.target.value })}
          />
        </div>
      ) : null}
      <p id="stream-create-collection-hint" className={HINT}>
        {t(locale, "streamSepolia.create.collectionHelp")}
      </p>
    </div>
  );
}

export interface CreatedWork {
  readonly token: Address;
  readonly tokenId: bigint;
  readonly editions: boolean;
}

/** Plain sentences for what stops a curated run before any step is paid for. */
const PREFLIGHT_MESSAGES: Record<string, MessageKey> = {
  gateClosed: "streamSepolia.tx.error.gateClosed",
  contentMinted: "streamSepolia.tx.error.contentMinted",
};

/** The curated create run: files, collection, package, acceptance, start, edition sale, record. */
export function CuratedRun({
  draft,
  viewer,
  onDone,
}: {
  readonly draft: Draft;
  readonly viewer: Address;
  readonly onDone: (work: CreatedWork) => void;
}) {
  const { files, failed, retry } = useStoredFiles(draft, viewer);
  if (failed) return <FilesFailed onRetry={retry} />;
  if (!files) return <StreamLoading />;
  return <CuratedPreflight draft={draft} files={files} viewer={viewer} onDone={onDone} />;
}

/** Runs the checks that must pass before anything is paid for, then shows the steps. */
function CuratedPreflight({
  draft,
  files,
  viewer,
  onDone,
}: {
  readonly draft: Draft;
  readonly files: { readonly media: StoredFile; readonly record: StoredFile };
  readonly viewer: Address;
  readonly onDone: (work: CreatedWork) => void;
}) {
  const locale = useBrowserLocale();
  const check = useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, getStreamInstance().name, "curatedPreflight", files.media.sha256, viewer.toLowerCase()],
    queryFn: () => curatedPreflight({ media: files.media, account: viewer }).then(() => true),
    retry: (count, error) => !(error instanceof CreateRunError) && count < 2,
    staleTime: Infinity,
  });
  if (check.isLoading) return <StreamLoading onRetry={() => void check.refetch()} />;
  if (check.error) {
    const key = check.error instanceof CreateRunError ? PREFLIGHT_MESSAGES[check.error.errorName] : undefined;
    return (
      <p role="alert" className="tw-m-0 tw-text-sm tw-text-red">
        {t(locale, key ?? "streamSepolia.loadError")}
      </p>
    );
  }
  return <CuratedSteps draft={draft} files={files} viewer={viewer} onDone={onDone} />;
}

function CollectionLine({ draft }: { readonly draft: Draft }) {
  const locale = useBrowserLocale();
  const collections = useCollections();
  let text: string;
  if (draft.collection === "new") {
    text = t(locale, "streamSepolia.create.reviewNewCollection", { name: draft.newCollectionName.trim() });
  } else {
    const chosen = collections.data?.find((collection) => collection.id.toString() === draft.collection);
    text = t(locale, "streamSepolia.create.reviewCollection", { id: draft.collection, name: chosen?.name ?? "" });
  }
  return (
    <p className="tw-m-0 tw-mb-3 tw-text-sm tw-text-iron-300">
      {text} {t(locale, "streamSepolia.create.reviewCollectionOpen")}
    </p>
  );
}

function CuratedSteps({
  draft,
  files,
  viewer,
  onDone,
}: {
  readonly draft: Draft;
  readonly files: { readonly media: StoredFile; readonly record: StoredFile };
  readonly viewer: Address;
  readonly onDone: (work: CreatedWork) => void;
}) {
  const locale = useBrowserLocale();
  // One run's state, created once and filled step by step so "Continue" resumes after a failure.
  const [run] = useState<CuratedWorkContext>(() => ({
    artist: viewer,
    media: files.media,
    record: files.record,
    collectionId: draft.collection === "new" ? null : BigInt(draft.collection),
    newCollectionName: draft.newCollectionName,
    editionCap: draft.editions ? (parseCap(draft.cap) ?? 0) : null,
  }));
  const chunks = files.media.chunks.length;
  const steps: Step<CuratedWorkContext>[] = [
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
  ];
  if (draft.collection === "new") {
    steps.push({
      id: "collection",
      label: t(locale, "streamSepolia.create.step.collection"),
      help: t(locale, "streamSepolia.create.step.collectionHelp"),
      run: (ctx, io) => ensureCollection(ctx, io),
    });
  }
  steps.push(
    {
      id: "package",
      label: t(locale, "streamSepolia.create.step.package"),
      help: t(locale, "streamSepolia.create.step.packageHelp"),
      run: (ctx, io) => registerCuratedPackage(ctx, io),
    },
    {
      id: "accept",
      label: t(locale, "streamSepolia.create.step.accept"),
      help: t(locale, "streamSepolia.create.step.acceptHelp"),
      run: (ctx, io) => acceptCuratedPackage(ctx, io),
    },
    {
      id: "start",
      label: t(locale, "streamSepolia.create.step.curatedStart"),
      help: t(locale, "streamSepolia.create.step.curatedStartHelp"),
      run: (ctx, io) => startCuratedSale(ctx, io),
    }
  );
  if (draft.editions) {
    steps.push({
      id: "edition",
      label: t(locale, "streamSepolia.create.step.edition"),
      help: t(locale, "streamSepolia.create.step.editionHelp"),
      run: (ctx, io) => openCuratedEdition(ctx, io),
    });
  }
  steps.push({
    id: "facts",
    label: t(locale, "streamSepolia.create.step.facts"),
    help: t(locale, "streamSepolia.create.step.curatedFactsHelp"),
    run: (ctx, io) => completeCuratedRecord(ctx, io),
  });
  return (
    <>
      <CollectionLine draft={draft} />
      <RunHeader files={files} curated newCollection={draft.collection === "new"} editions={draft.editions} />
      <StepRunner
        steps={steps}
        context={run}
        startLabel={t(locale, "streamSepolia.create.go")}
        onFinished={(ctx) => {
          if (ctx.tokenId !== undefined) {
            onDone({ token: getStreamInstance().addresses.stream, tokenId: ctx.tokenId, editions: draft.editions });
          }
        }}
      />
    </>
  );
}
