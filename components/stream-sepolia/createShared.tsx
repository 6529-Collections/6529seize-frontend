"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Address } from "viem";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { getStreamClient } from "@/lib/stream/client";
import { estimateCreateGas, recordBytes, toStoredFile, type StoredFile } from "@/lib/stream/content";

import type { Draft } from "@/lib/stream/createDraft";

import { formatDuration, formatEth, shortAddress } from "./format";
import { useSaleDuration } from "./useStreamData";

export const FIELD_LABEL = "tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-iron-200";
export const HINT = "tw-m-0 tw-mt-1.5 tw-text-xs tw-text-iron-500";
export const LINK = "tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-400";

type StoredFiles = { readonly media: StoredFile; readonly record: StoredFile };

/**
 * The art and its JSON record as content-store files, prepared once per run.
 * Preparing hashes the bytes in the browser; if that fails the page says so
 * and offers a retry instead of waiting for ever.
 */
export function useStoredFiles(
  draft: Draft,
  viewer: Address
): { files: StoredFiles | null; failed: boolean; retry: () => void } {
  const [files, setFiles] = useState<StoredFiles | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!draft.media) return undefined;
    let active = true;
    const media = draft.media;
    Promise.all([
      toStoredFile(media.bytes, media.mimeType),
      toStoredFile(
        recordBytes({
          name: draft.title.trim(),
          description: draft.description.trim(),
          artist: draft.artistName.trim() || shortAddress(viewer),
          year: new Date().getUTCFullYear(),
        }),
        "application/json"
      ),
    ])
      .then(([mediaFile, recordFile]) => {
        // A run keeps its first files, so a re-render never swaps them mid-run.
        if (active) setFiles((current) => current ?? { media: mediaFile, record: recordFile });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [draft, viewer, attempt]);
  return {
    files,
    failed: failed && !files,
    retry: () => {
      setFailed(false);
      setAttempt((value) => value + 1);
    },
  };
}

/** Shown when the files could not be prepared. */
export function FilesFailed({ onRetry }: { readonly onRetry: () => void }) {
  const locale = useBrowserLocale();
  return (
    <div role="alert" className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-text-sm tw-text-red">
      <span>{t(locale, "streamSepolia.create.filesFailed")}</span>
      <button
        type="button"
        onClick={onRetry}
        className="tw-h-9 tw-rounded-lg tw-border-0 tw-bg-white/[0.08] tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-bg-white/[0.12] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        {t(locale, "streamSepolia.retry")}
      </button>
    </div>
  );
}

/** Below this the estimate rounds to nothing useful: say "less than" instead. */
const TINY_FEE = 10_000_000_000_000n;

/** The sale length and the estimated network fee of this run's steps, shown before the first one. */
export function RunHeader({
  files,
  curated,
  newCollection,
  editions,
}: {
  readonly files: StoredFiles;
  readonly curated: boolean;
  readonly newCollection: boolean;
  readonly editions: boolean;
}) {
  const locale = useBrowserLocale();
  const duration = useSaleDuration();
  const gasPrice = useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, "gasPrice"],
    queryFn: () => getStreamClient().getGasPrice(),
    staleTime: 60_000,
  });
  const estimatedFee =
    gasPrice.data === undefined
      ? null
      : estimateCreateGas({
          mediaBytes: files.media.bytes.length,
          recordBytes: files.record.bytes.length,
          curated,
          newCollection,
          editions,
        }) * gasPrice.data;
  return (
    <>
      {duration.data !== undefined && duration.data > 0 ? (
        <p className="tw-m-0 tw-mb-1 tw-text-sm tw-text-iron-300">
          {t(locale, "streamSepolia.saleLength", { duration: formatDuration(duration.data, locale) })}
        </p>
      ) : null}
      {estimatedFee === null ? null : (
        <p className="tw-m-0 tw-mb-3 tw-text-sm tw-text-iron-300">
          {estimatedFee < TINY_FEE
            ? t(locale, "streamSepolia.create.feeTiny", { amount: formatEth(TINY_FEE, locale) })
            : t(locale, "streamSepolia.create.feeEstimate", { amount: formatEth(estimatedFee, locale) })}
        </p>
      )}
    </>
  );
}
