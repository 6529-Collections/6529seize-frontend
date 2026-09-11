import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumPublicWork } from "@/lib/museum/publication/types";
import type { MuseumView } from "@/lib/museum/types";
import { TypedArtistWorkCard } from "./TypedArtistWorkCard";

interface TypedArtistWorksProps {
  readonly relationshipLabel: (work: MuseumPublicWork) => string;
  readonly view: MuseumView | null;
  readonly works: readonly MuseumPublicWork[];
}

export function TypedArtistWorks({
  relationshipLabel,
  view,
  works,
}: TypedArtistWorksProps) {
  if (works.length === 0) {
    return null;
  }

  return (
    <section className="tw-mt-12" aria-labelledby="typed-artist-works-title">
      <h2
        id="typed-artist-works-title"
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {t(DEFAULT_LOCALE, "museum.network.artists.worksByArtist")}
      </h2>
      <div
        className={`tw-mt-6 tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-10 ${
          works.length === 1
            ? "tw-max-w-6xl tw-grid-cols-1"
            : "sm:tw-grid-cols-2 xl:tw-grid-cols-3"
        }`}
      >
        {works.map((work, index) => (
          <TypedArtistWorkCard
            key={work.id}
            index={index}
            relationshipLabel={relationshipLabel}
            view={view}
            work={work}
          />
        ))}
      </div>
    </section>
  );
}
