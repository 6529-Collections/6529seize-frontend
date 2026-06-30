"use client";

import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { NFT, NFTHistory } from "@/entities/INFT";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchAllPages } from "@/services/6529api";
import { useEffect, useState } from "react";
import Timeline from "../timeline/Timeline";

export function MemePageTimeline(props: {
  show: boolean;
  nft: NFT | undefined;
  locale?: SupportedLocale;
}) {
  const [nftHistory, setNftHistory] = useState<NFTHistory[]>([]);
  const locale = props.locale ?? DEFAULT_LOCALE;

  useEffect(() => {
    async function fetchHistory(url: string) {
      const response = await fetchAllPages<NFTHistory>(url);
      setNftHistory(response);
    }
    if (props.nft) {
      const initialUrlHistory = `${publicEnv.API_ENDPOINT}/api/nft_history/${MEMES_CONTRACT}/${props.nft.id}`;
      fetchHistory(initialUrlHistory);
    }
  }, [props.nft]);

  if (props.show && props.nft) {
    return (
      <section aria-label={t(locale, "theMemes.detail.timeline.region")}>
        <div className="tw-pb-5 tw-pt-3">
          <div className="tw-w-full md:tw-mx-auto md:tw-w-10/12">
            {props.nft && (
              <Timeline nft={props.nft} steps={nftHistory} locale={locale} />
            )}
          </div>
        </div>
      </section>
    );
  } else {
    return <></>;
  }
}
