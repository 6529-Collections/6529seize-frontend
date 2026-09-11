import {
  MuseumJsonDisclosure,
  MuseumMarkdown,
} from "@/components/museum/MuseumMarkdown";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumPublication,
  MuseumPublicDocument,
} from "@/lib/museum/publication/types";

interface TypedArtistProfileProps {
  readonly profileDocuments: readonly MuseumPublicDocument[];
  readonly publication: MuseumPublication;
  readonly workHrefs: Readonly<Record<string, string>>;
}

export function TypedArtistProfile({
  profileDocuments,
  publication,
  workHrefs,
}: TypedArtistProfileProps) {
  if (profileDocuments.length === 0) return null;

  return (
    <section
      className="tw-mt-10 tw-max-w-4xl"
      aria-labelledby="typed-artist-profile-title"
    >
      <h2
        id="typed-artist-profile-title"
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {t(DEFAULT_LOCALE, "museum.network.artists.profile")}
      </h2>
      <div className="tw-mt-6 tw-space-y-8">
        {profileDocuments.map((document) =>
          document.kind === "source_record" ? (
            <MuseumJsonDisclosure
              key={document.id}
              label={document.title}
              sourceJson={document.markdown}
            />
          ) : (
            <MuseumMarkdown
              key={document.id}
              className="tw-max-w-3xl"
              embeddedDocument
              sourceCommit={publication.identity.commit}
              sourcePath={document.sourcePath}
              workHrefs={workHrefs}
            >
              {document.markdown}
            </MuseumMarkdown>
          )
        )}
      </div>
    </section>
  );
}
