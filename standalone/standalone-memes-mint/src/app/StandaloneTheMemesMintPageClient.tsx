"use client";

import TheMemesMint from "@/components/the-memes/TheMemesMint";
import { useNowMinting } from "@/hooks/useNowMinting";
import styles from "@/styles/Home.module.scss";

const MINT_STATUS_CARD_CLASS =
  "tw-flex tw-aspect-square tw-w-full tw-max-w-[20rem] tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-rounded-2xl tw-border tw-border-iron-700/35 tw-bg-[#1a1a1a] tw-px-5 tw-py-6 tw-text-center tw-shadow-[0_0_0_1px_rgba(255,255,255,0.03)]";

function MintStatusCard({
  detail,
  alert = false,
}: {
  readonly detail: string;
  readonly alert?: boolean;
}) {
  return (
    <section
      {...(alert ? ({ role: "alert", "aria-live": "assertive" } as const) : {})}
      className={
        alert
          ? `${MINT_STATUS_CARD_CLASS} tw-overflow-y-auto`
          : MINT_STATUS_CARD_CLASS
      }
    >
      <img
        src="/6529.svg"
        alt=""
        width={50}
        height={50}
        className="tw-h-10 tw-w-auto tw-shrink-0 tw-opacity-95"
      />
      <h1 className="tw-text-lg tw-font-bold tw-leading-snug tw-text-iron-50">
        Something went wrong
      </h1>
      <p className="tw-mb-0 tw-max-w-full tw-break-words tw-font-mono tw-text-sm tw-leading-relaxed tw-text-iron-400">
        {detail}
      </p>
    </section>
  );
}

export default function StandaloneTheMemesMintPageClient() {
  const { nft, isFetching, isLoading, isFetched, error } = useNowMinting();

  return (
    <main className={styles["main"]}>
      {nft ? (
        <TheMemesMint nft={nft} standalone />
      ) : (
        <div className="tailwind-scope tw-flex tw-min-h-screen tw-items-center tw-justify-center tw-bg-[#111111] tw-px-6 tw-py-12">
          {error ? (
            <MintStatusCard
              alert
              detail={
                error instanceof Error
                  ? error.message
                  : "Error fetching mint information"
              }
            />
          ) : isLoading || isFetching ? (
            <div
              className="tw-flex tw-items-center tw-justify-center"
              style={{
                perspective: "1000px",
                perspectiveOrigin: "center",
              }}
            >
              <div
                className="tw-inline-block tw-animate-spin-y tw-will-change-transform"
                style={{ transformStyle: "preserve-3d" }}
              >
                <img
                  src="/6529.svg"
                  alt="Loading"
                  className="tw-block tw-h-44 tw-max-h-none tw-w-44 tw-max-w-none"
                />
              </div>
            </div>
          ) : isFetched ? (
            <MintStatusCard detail="No mint information found." />
          ) : null}
        </div>
      )}
    </main>
  );
}
