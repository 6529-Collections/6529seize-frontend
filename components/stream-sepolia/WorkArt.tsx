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
  const frame =
    size === "large"
      ? "tw-aspect-square tw-w-full tw-rounded-xl tw-bg-black/40"
      : "tw-aspect-square tw-w-full tw-rounded-lg tw-bg-black/40";
  if (art.data && broken !== art.data) {
    return (
      <div className={`${frame} tw-flex tw-items-center tw-justify-center tw-overflow-hidden`}>
        {/* Art is a data URL read from the chain; next/image cannot optimise it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art.data}
          alt={title}
          onError={() => setBroken(art.data ?? null)}
          className="tw-h-full tw-w-full tw-object-contain [image-rendering:auto]"
        />
      </div>
    );
  }
  return (
    <div
      className={`${frame} tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-white/[0.07] tw-text-xs tw-text-iron-500`}
    >
      {art.isLoading || art.fetchStatus === "fetching"
        ? t(locale, "streamSepolia.art.loading")
        : t(locale, "streamSepolia.art.none")}
    </div>
  );
}
