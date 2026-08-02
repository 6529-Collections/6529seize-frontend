import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import {
  MuseumJsonDisclosure,
  MuseumMarkdown,
} from "@/components/museum/MuseumMarkdown";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { MuseumRecordCard } from "@/components/museum/MuseumRecordCard";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.methodology.title"),
  description: t(DEFAULT_LOCALE, "museum.network.methodology.description"),
});

export default async function MuseumMethodologyPage() {
  const view = await getMuseumView();

  return (
    <section>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.nav.methodology")}
        title={t(DEFAULT_LOCALE, "museum.network.methodology.title")}
        description={t(
          DEFAULT_LOCALE,
          "museum.network.methodology.description"
        )}
      />
      {view.policies.length > 0 && (
        <section className="tw-mb-10" aria-labelledby="museum-policies-title">
          <h2
            id="museum-policies-title"
            className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
          >
            {t(DEFAULT_LOCALE, "museum.network.methodology.policies")}
          </h2>
          <div className="tw-mt-4 tw-grid tw-gap-4 md:tw-grid-cols-2">
            {view.policies.map((document) => (
              <MuseumRecordCard
                key={document.path}
                href={`#${document.path.replace(/[^a-z0-9]+/giu, "-")}`}
                title={document.title}
                description={document.excerpt}
                meta={document.path}
              />
            ))}
          </div>
        </section>
      )}
      {view.methodology.length === 0 ? (
        <p className="tw-m-0 tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5 tw-text-sm tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.methodology.empty")}
        </p>
      ) : (
        <div className="tw-space-y-6">
          {view.methodology.map((document) => {
            const id = document.path.replace(/[^a-z0-9]+/giu, "-");
            return (
              <article
                id={id}
                key={document.path}
                className="tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5 sm:tw-p-7"
              >
                <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white">
                  {document.title}
                </h2>
                <p className="tw-m-0 tw-mt-2 tw-text-xs tw-text-iron-500">
                  {document.path}
                </p>
                <div className="tw-mt-5">
                  <MuseumMarkdown>{document.markdown}</MuseumMarkdown>
                </div>
                <div className="tw-mt-6">
                  <MuseumJsonDisclosure
                    label={t(
                      DEFAULT_LOCALE,
                      "museum.network.detail.technicalEvidence"
                    )}
                    value={{ path: document.path }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
