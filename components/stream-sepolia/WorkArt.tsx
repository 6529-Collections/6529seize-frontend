"use client";

import { useState } from "react";
import type { Address, Hex } from "viem";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";

import { useWorkArt } from "./useStreamData";

/** A work's picture, read from the chain. The art is the page, so it gets the space. */
export function WorkArt({
  token,
  tokenId,
  firstStartTx,
  curated,
  title,
  size = "card",
}: {
  readonly token: Address;
  readonly tokenId: bigint;
  readonly firstStartTx: Hex | null;
  readonly curated: boolean;
  readonly title: string;
  readonly size?: "card" | "large";
}) {
  const locale = useBrowserLocale();
  const { art } = useWorkArt({ token, tokenId, firstStartTx, curated });
  const [broken, setBroken] = useState<string | null>(null);
  const large = size === "large";
  if (art.data && broken !== art.data) {
    // The art keeps its own aspect ratio; on the work page the frame shrinks to it.
    return (
      <div
        className={
          large
            ? "tw-flex tw-justify-center"
            : "tw-flex tw-aspect-square tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-950"
        }
      >
        {/* Art is a data URL read from the chain; next/image cannot optimise it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art.data}
          alt={title}
          onError={() => setBroken(art.data ?? null)}
          className={
            large
              ? "tw-block tw-h-auto tw-max-h-[60vh] tw-w-auto tw-max-w-full tw-rounded-lg tw-object-contain sm:tw-max-h-[80vh]"
              : "tw-h-full tw-w-full tw-object-contain"
          }
        />
      </div>
    );
  }
  if (!large) {
    // A card without on-chain art: a quiet tile with the title, nothing to read as an error.
    const loading = art.isLoading || art.fetchStatus === "fetching";
    return (
      <div
        aria-hidden="true"
        className="tw-flex tw-aspect-square tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-950 tw-p-6 tw-text-center tw-text-sm tw-font-semibold tw-text-iron-600"
      >
        {loading ? null : title}
      </div>
    );
  }
  return (
    <div
      className="tw-flex tw-aspect-[4/3] tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-dashed tw-border-white/[0.07] tw-text-xs tw-text-iron-600"
    >
      {art.isLoading || art.fetchStatus === "fetching"
        ? t(locale, "streamSepolia.art.loading")
        : t(locale, "streamSepolia.art.none")}
    </div>
  );
}
