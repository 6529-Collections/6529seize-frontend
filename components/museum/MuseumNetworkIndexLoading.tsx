import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const ARTIST_SKELETONS = [
  "artist-1",
  "artist-2",
  "artist-3",
  "artist-4",
  "artist-5",
  "artist-6",
] as const;

const ACQUISITION_SKELETONS = [
  "acquisition-1",
  "acquisition-2",
  "acquisition-3",
] as const;

type MuseumNetworkIndexLoadingKind = "artists" | "acquisitions";

function LoadingBlock({ className }: { readonly className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`tw-rounded-lg tw-bg-iron-800/70 ${className}`}
    />
  );
}

function ArtistsLoadingContent() {
  return (
    <>
      <div className="tw-mb-10 tw-grid tw-gap-4 tw-border-y tw-border-solid tw-border-white/10 tw-py-5 sm:tw-grid-cols-3">
        {ARTIST_SKELETONS.slice(0, 3).map((skeleton) => (
          <div
            key={skeleton}
            className="tw-border-white/10 sm:tw-border-l sm:tw-pl-5 first:sm:tw-border-l-0 first:sm:tw-pl-0"
          >
            <LoadingBlock className="tw-h-8 tw-w-20" />
            <LoadingBlock className="tw-mt-3 tw-h-3 tw-w-28" />
          </div>
        ))}
      </div>
      <div className="tw-grid tw-gap-x-6 tw-gap-y-10 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        {ARTIST_SKELETONS.map((skeleton) => (
          <div key={skeleton} className="tw-min-w-0">
            <LoadingBlock className="tw-aspect-square tw-w-full tw-rounded-xl" />
            <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
              <LoadingBlock className="tw-h-5 tw-w-3/5" />
              <LoadingBlock className="tw-mt-3 tw-h-4 tw-w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AcquisitionsLoadingContent() {
  return (
    <>
      <div className="tw-grid tw-gap-8 tw-border-y tw-border-solid tw-border-white/10 tw-py-6 md:tw-grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] md:tw-gap-10 md:tw-py-8">
        <LoadingBlock className="tw-aspect-[4/3] tw-w-full tw-rounded-xl" />
        <div className="tw-flex tw-flex-col tw-justify-center">
          <LoadingBlock className="tw-h-5 tw-w-2/5" />
          <LoadingBlock className="tw-mt-4 tw-h-9 tw-w-4/5" />
          <LoadingBlock className="tw-mt-4 tw-h-4 tw-w-full" />
          <LoadingBlock className="tw-mt-2 tw-h-4 tw-w-5/6" />
        </div>
      </div>
      <div className="tw-mt-10 tw-grid tw-gap-4">
        {ACQUISITION_SKELETONS.map((skeleton) => (
          <div
            key={skeleton}
            className="tw-grid tw-grid-cols-[5rem_minmax(0,1fr)] tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4 sm:tw-grid-cols-[7rem_minmax(0,1fr)] sm:tw-gap-5 sm:tw-p-5"
          >
            <LoadingBlock className="tw-aspect-square tw-w-full tw-rounded-lg" />
            <div className="tw-min-w-0 tw-self-center">
              <LoadingBlock className="tw-h-5 tw-w-3/5" />
              <LoadingBlock className="tw-mt-3 tw-h-4 tw-w-4/5" />
              <LoadingBlock className="tw-mt-3 tw-h-3 tw-w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function MuseumNetworkIndexLoading({
  kind,
}: {
  readonly kind: MuseumNetworkIndexLoadingKind;
}) {
  const titleKey =
    kind === "artists"
      ? "museum.network.artists.title"
      : "museum.network.acquisitions.title";
  const eyebrowKey =
    kind === "artists"
      ? "museum.network.artists.eyebrow"
      : "museum.network.acquisitions.eyebrow";
  const title = t(DEFAULT_LOCALE, titleKey);
  const loadingLabel = t(DEFAULT_LOCALE, "museum.network.loading");
  const headingId = `museum-network-${kind}-loading-title`;

  return (
    <section
      aria-busy="true"
      aria-labelledby={headingId}
      data-testid={`museum-network-${kind}-loading`}
      className="tw-min-w-0"
    >
      <p role="status" className="tw-sr-only">
        {loadingLabel}
      </p>
      <div className="motion-safe:tw-animate-pulse motion-reduce:tw-animate-none">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, eyebrowKey)}
        </p>
        <h1
          id={headingId}
          className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
        >
          {title}
        </h1>
        <div aria-hidden="true" className="tw-mt-4 tw-max-w-3xl">
          <LoadingBlock className="tw-h-4 tw-w-full" />
          <LoadingBlock className="tw-mt-2 tw-h-4 tw-w-4/5" />
        </div>
        <div className="tw-mt-8">
          {kind === "artists" ? (
            <ArtistsLoadingContent />
          ) : (
            <AcquisitionsLoadingContent />
          )}
        </div>
      </div>
    </section>
  );
}
