import { ArtistChip } from "@/components/stream/ui/AddressChip";
import {
  federatedStatusBadge,
  SpecBadge,
  storageBadge,
  variantBadge,
} from "@/components/stream/ui/StatusBadge";
import { STREAM_HEADING, STREAM_LABEL } from "@/components/stream/ui/styles";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { StreamWork } from "@/lib/stream/types";

function Alert({ text }: { readonly text: string }) {
  return (
    <p className="tw-m-0 tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-error/30 tw-bg-error/[0.06] tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100">
      {text}
    </p>
  );
}

/** Title, artists, what the token is, and any state that changes how to read the page. */
export default function WorkHeader({
  work,
  locale,
}: {
  readonly work: StreamWork;
  readonly locale: SupportedLocale;
}) {
  return (
    <header className="tw-pb-6">
      <h1 className={`${STREAM_HEADING} tw-text-2xl sm:tw-text-3xl`}>
        {work.title}
      </h1>
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
        {work.parties.map((party) => (
          <ArtistChip
            key={party.artistId}
            artistId={party.artistId}
            name={party.displayName}
            locale={locale}
          />
        ))}
        <span className="tw-flex tw-flex-wrap tw-gap-2">
          <SpecBadge spec={variantBadge(work.variant)} locale={locale} />
          <SpecBadge spec={storageBadge(work.storage)} locale={locale} />
          {work.federated === null ? null : (
            <SpecBadge
              spec={federatedStatusBadge(work.federated.status)}
              locale={locale}
            />
          )}
        </span>
      </div>
      {work.program === "federated" ? (
        <p className={`${STREAM_LABEL} tw-mt-3 tw-text-amber-200`}>
          {t(locale, "stream.status.federated")} ·{" "}
          {t(locale, "stream.federated.notCurated")}
        </p>
      ) : null}
      {work.burned ? (
        <Alert text={t(locale, "stream.workPage.burned")} />
      ) : null}
      {work.federated?.status === "DELISTED" ? (
        <Alert text={t(locale, "stream.federated.delisted")} />
      ) : null}
    </header>
  );
}
