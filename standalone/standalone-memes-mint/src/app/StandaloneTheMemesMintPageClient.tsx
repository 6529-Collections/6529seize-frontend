"use client";

import TheMemesMint from "@/components/the-memes/TheMemesMint";
import Spinner from "@/components/utils/Spinner";
import { useNowMinting } from "@/hooks/useNowMinting";
import styles from "@/styles/Home.module.scss";

export default function StandaloneTheMemesMintPageClient() {
  const { nft, isFetching, isLoading, isFetched, error } = useNowMinting();

  return (
    <main className={styles["main"]}>
      {nft ? (
        <TheMemesMint nft={nft} standalone />
      ) : (
        <div className="tailwind-scope tw-flex tw-min-h-[40vh] tw-items-center tw-justify-center tw-px-6 tw-text-center">
          {error ? (
            <span className="tw-text-iron-100">
              Error fetching mint information
            </span>
          ) : isLoading || isFetching || !isFetched ? (
            <div className="tw-inline-flex tw-items-center tw-gap-3 tw-text-iron-100">
              <span>Retrieving Mint information</span>
              <Spinner />
            </div>
          ) : (
            <p className="tw-mb-0 tw-text-iron-100">
              No mint information found
            </p>
          )}
        </div>
      )}
    </main>
  );
}
