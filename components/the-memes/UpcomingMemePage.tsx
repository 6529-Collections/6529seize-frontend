import { MemeCalendarOverviewNextMint } from "@/components/meme-calendar/MemeCalendarOverview";
import { getCanonicalNextMintNumber } from "@/components/meme-calendar/meme-calendar.helpers";
import LatestDropNextMintSubscribe from "@/components/home/now-minting/LatestDropNextMintSubscribe";
import LatestDropNextMintPanel, {
  LatestDropNextMintPanelSkeleton,
} from "@/components/home/now-minting/LatestDropNextMintPanel";
import { shouldShowNextMintInLatestDrop } from "@/helpers/mint-visibility.helpers";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import NotFound from "@/components/not-found/NotFound";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { useSyncExternalStore } from "react";

const subscribeToClientRender = () => () => {};
const getClientRenderSnapshot = () => true;
const getServerRenderSnapshot = () => false;

function GenericUpcomingMemePage({
  id,
  locale,
}: {
  readonly id: number;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-4">
      <LatestDropNextMintSubscribe tokenId={id} />
      <MemeCalendarOverviewNextMint displayTz="local" id={id} locale={locale} />
    </div>
  );
}

function CanonicalUpcomingMemePage({
  id,
  locale,
}: {
  readonly id: number;
  readonly locale: SupportedLocale;
}) {
  const { isFetching, isDropComplete, isStatusLoading } = useNowMintingStatus();
  const {
    nextMint,
    waveId,
    isFetching: isNextMintFetching,
    isSettingsLoaded,
  } = useNextMintDrop();

  const isNextMintReady = isSettingsLoaded && (!waveId || !isNextMintFetching);
  const isDecisionReady = !isFetching && !isStatusLoading && isNextMintReady;
  const shouldShowNextMint = shouldShowNextMintInLatestDrop({
    isMintEnded: isDropComplete,
    nextMintExists: !!nextMint,
  });
  const mappedMemeCardId = nextMint?.submission_context?.meme_card_id;
  const normalizedMemeCardId = Number(mappedMemeCardId);
  const isMatchingRevealedDrop =
    shouldShowNextMint &&
    Number.isSafeInteger(normalizedMemeCardId) &&
    normalizedMemeCardId >= 1 &&
    normalizedMemeCardId === id;

  if (!isDecisionReady) {
    return (
      <div className="tw-flex tw-w-full tw-flex-col tw-gap-4">
        <LatestDropNextMintPanelSkeleton />
        <MemeCalendarOverviewNextMint
          displayTz="local"
          id={id}
          locale={locale}
        />
      </div>
    );
  }

  if (isMatchingRevealedDrop && nextMint) {
    return (
      <div className="tw-flex tw-w-full tw-flex-col tw-gap-4">
        <LatestDropNextMintPanel
          drop={nextMint}
          linkMemeCard={false}
          locale={locale}
        />
        <MemeCalendarOverviewNextMint
          displayTz="local"
          id={id}
          locale={locale}
        />
      </div>
    );
  }

  return <GenericUpcomingMemePage id={id} locale={locale} />;
}

export default function UpcomingMemePage({
  id,
  locale = DEFAULT_LOCALE,
}: {
  readonly id: string;
  readonly locale?: SupportedLocale;
}) {
  const numId = Number(id);
  const isClientHydrated = useSyncExternalStore(
    subscribeToClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot
  );
  if (Number.isInteger(numId)) {
    const content =
      isClientHydrated && numId === getCanonicalNextMintNumber() ? (
        <CanonicalUpcomingMemePage id={numId} locale={locale} />
      ) : (
        <GenericUpcomingMemePage id={numId} locale={locale} />
      );

    return <div className="tw-mt-6">{content}</div>;
  }
  return <NotFound label="MEME" />;
}
