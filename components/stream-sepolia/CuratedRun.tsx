"use client";

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
import { parseCap, type Draft } from "@/lib/stream/createDraft";
import { CreateRunError } from "@/lib/stream/createErrors";
import {
  acceptCuratedPackage,
  completeCuratedRecord,
  curatedPreflight,
  ensureCollection,
  openCuratedEdition,
  registerCuratedPackage,
  startCuratedSale,
  type CuratedWorkContext,
} from "@/lib/stream/curatedCreate";
import { getStreamInstance } from "@/lib/stream/instances";

import { FilesFailed, RunHeader, useStoredFiles } from "./createShared";
import { StepRunner, type Step } from "./StepRunner";
import { StreamLoading } from "./StreamLoading";
import { useEditionCloseOffset } from "./useStreamData";

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

type Files = { readonly media: StoredFile; readonly record: StoredFile };

/** "Create an NFT on 6529 Stream": files, package, acceptance, start, edition sale, record. */
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
  readonly files: Files;
  readonly viewer: Address;
  readonly onDone: (work: CreatedWork) => void;
}) {
  const locale = useBrowserLocale();
  const check = useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, getStreamInstance().name, "curatedPreflight", files.media.sha256, viewer.toLowerCase()],
    queryFn: () => curatedPreflight({ media: files.media, account: viewer }),
    retry: (count, error) => !(error instanceof CreateRunError) && count < 2,
    staleTime: Infinity,
  });
  if (check.isLoading) return <StreamLoading onRetry={() => void check.refetch()} />;
  if (check.error || !check.data) {
    const key = check.error instanceof CreateRunError ? PREFLIGHT_MESSAGES[check.error.errorName] : undefined;
    return (
      <p role="alert" className="tw-m-0 tw-text-sm tw-text-red">
        {t(locale, key ?? "streamSepolia.loadError")}
      </p>
    );
  }
  return (
    <CuratedSteps
      draft={draft}
      files={files}
      viewer={viewer}
      sharedCollectionId={check.data.sharedCollectionId}
      onDone={onDone}
    />
  );
}

function CuratedSteps({
  draft,
  files,
  viewer,
  sharedCollectionId,
  onDone,
}: {
  readonly draft: Draft;
  readonly files: Files;
  readonly viewer: Address;
  readonly sharedCollectionId: bigint | null;
  readonly onDone: (work: CreatedWork) => void;
}) {
  const locale = useBrowserLocale();
  const closeOffset = useEditionCloseOffset(true);
  // One run's state, created once and filled step by step so "Continue" resumes after a failure.
  const [run] = useState<CuratedWorkContext>(() => ({
    artist: viewer,
    media: files.media,
    record: files.record,
    collectionId: sharedCollectionId,
    editionCap: draft.editions ? (parseCap(draft.cap) ?? 0) : null,
  }));
  const chunks = files.media.chunks.length;
  const needsCollection = sharedCollectionId === null;
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
  // Only the first work on an instance creates the shared test collection.
  if (needsCollection) {
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
      help: closeOffset
        ? t(locale, "streamSepolia.create.step.editionHelpTimed", { offset: closeOffset })
        : t(locale, "streamSepolia.create.step.editionHelp"),
      run: (ctx, io) => openCuratedEdition(ctx, io),
    });
  }
  steps.push({
    id: "facts",
    label: t(locale, "streamSepolia.create.step.facts"),
    help: t(locale, "streamSepolia.create.step.curatedFactsHelp"),
    run: (ctx, io) => completeCuratedRecord(ctx, io),
  });
  // Files (chunks and registrations), collection, package, acceptance (sign + send),
  // start (sign + send), edition sale, record.
  const confirmations = chunks + 3 + (needsCollection ? 1 : 0) + 1 + 2 + 2 + (draft.editions ? 1 : 0) + 1;
  return (
    <>
      <RunHeader
        files={files}
        curated
        newCollection={needsCollection}
        editions={draft.editions}
        confirmations={confirmations}
      />
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
