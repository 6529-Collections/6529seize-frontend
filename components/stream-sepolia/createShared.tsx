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

import { formatDuration, formatEth, shortAddress } from "./format";
import { useSaleDuration } from "./useStreamData";

export const FIELD_LABEL = "tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-iron-200";
export const HINT = "tw-m-0 tw-mt-1.5 tw-text-xs tw-text-iron-500";
export const LINK = "tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-400";

/** "new" creates a collection with the typed name; otherwise an existing collection ID. */
export type CollectionChoice = "new" | `${bigint}`;

export interface Draft {
  readonly media: { bytes: Uint8Array; mimeType: string } | null;
  readonly title: string;
  readonly description: string;
  readonly artistName: string;
  readonly royalty: string;
  readonly editions: boolean;
  readonly cap: string;
  /** Curated only. */
  readonly collection: CollectionChoice;
  readonly newCollectionName: string;
}

export function parseCap(value: string): number | null {
  if (value.trim() === "") return 0;
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 && number < 4_294_967_295 ? number : null;
}

/** The art and its JSON record as content-store files, prepared once per run. */
export function useStoredFiles(
  draft: Draft,
  viewer: Address
): { media: StoredFile; record: StoredFile } | null {
  const [files, setFiles] = useState<{ media: StoredFile; record: StoredFile } | null>(null);
  useEffect(() => {
    let active = true;
    const media = draft.media!;
    void Promise.all([
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
    ]).then(([mediaFile, recordFile]) => {
      // A run keeps its first files, so a re-render never swaps them mid-run.
      if (active) setFiles((current) => current ?? { media: mediaFile, record: recordFile });
    });
    return () => {
      active = false;
    };
  }, [draft, viewer]);
  return files;
}

/** Below this the estimate rounds to nothing useful: say "less than" instead. */
const TINY_FEE = 10_000_000_000_000n;

/** The sale length and the estimated network fee, shown before the first step. */
export function RunHeader({ media, record }: { readonly media: StoredFile; readonly record: StoredFile }) {
  const locale = useBrowserLocale();
  const duration = useSaleDuration();
  const gasPrice = useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, "gasPrice"],
    queryFn: () => getStreamClient().getGasPrice(),
    staleTime: 60_000,
  });
  const estimatedFee =
    gasPrice.data === undefined ? null : estimateCreateGas(media.bytes.length, record.bytes.length) * gasPrice.data;
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
