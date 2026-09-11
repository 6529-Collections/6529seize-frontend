import type { Metadata } from "next";
import Link from "next/link";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { museumOrganizationHref } from "@/lib/museum/publication/routes";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.organizations.title"),
    description: t(DEFAULT_LOCALE, "museum.network.organizations.description"),
  }),
  alternates: { canonical: "/museum/network/organizations" },
};

export default async function MuseumOrganizationsPage() {
  const publicationState = await getMuseumPublicationState();
  const publication = publicationState.publication;
  if (publication?.organizations === undefined) {
    return <MuseumPublicationUnavailable />;
  }

  return (
    <section>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.organizations.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.organizations.title")}
        description={t(
          DEFAULT_LOCALE,
          "museum.network.organizations.description"
        )}
      />
      <ul className="tw-m-0 tw-list-none tw-border-y tw-border-solid tw-border-iron-800 tw-p-0">
        {publication.organizations.map((organization) => (
          <li
            key={organization.id}
            className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 last:tw-border-b-0"
          >
            <Link
              href={museumOrganizationHref(organization.slug)}
              className="tw-flex tw-min-h-20 tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-py-5 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              <span>
                <span className="hover:tw-text-primary-200 tw-block tw-text-lg tw-font-semibold tw-text-iron-50">
                  {organization.preferredName}
                </span>
                <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
                  {organization.projectIds.length}{" "}
                  {t(
                    DEFAULT_LOCALE,
                    "museum.network.organizations.projects"
                  ).toLocaleLowerCase()}
                </span>
              </span>
              <span className="tw-text-sm tw-text-primary-300">
                {t(DEFAULT_LOCALE, "museum.network.organizations.view")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
