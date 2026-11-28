"use client";

import { useState } from "react";
import type { Address } from "viem";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import type { StoredFile } from "@/lib/stream/content";
import {
  approveIndependentItem,
  openIndependentEdition,
  openWorkRecord,
  startIndependentSale,
  storeFile,
  storeStartFile,
  type IndependentWorkContext,
} from "@/lib/stream/create";
import { parseCap, parseRoyalty, type Draft } from "@/lib/stream/createDraft";

import { FilesFailed, RunHeader, useStoredFiles } from "./createShared";
import type { CreatedWork } from "./CuratedRun";
import { StepRunner, type Step } from "./StepRunner";
import { StreamLoading } from "./StreamLoading";
import { useEditionCloseOffset } from "./useStreamData";

/**
 * The Independent Stream create run in the artist's own contract: files,
 * approval, the start file (so anyone can start the sale), the start, the
 * edition sale and the record. Pinned to the wallet that started it.
 */
export function IndependentRun(props: {
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
  const closeOffset = useEditionCloseOffset(false);
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
      help: closeOffset
        ? t(locale, "streamSepolia.create.step.editionHelpTimed", { offset: closeOffset })
        : t(locale, "streamSepolia.create.step.editionHelp"),
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
      <RunHeader
        files={files}
        curated={false}
        newCollection={false}
        editions={draft.editions && !!editionsToken}
        confirmations={chunks + 3 + 1 + 2 + 1 + (draft.editions && editionsToken ? 1 : 0) + 2}
      />
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
