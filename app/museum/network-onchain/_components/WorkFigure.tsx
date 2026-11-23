import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatList } from "@/i18n/format";
import type { OnchainMuseumRecord } from "@/lib/museum/onchain/museum";
import {
  payloadRecord,
  payloadStrings,
  type OnchainMuseumView,
  type OnchainWorkImageView,
} from "@/lib/museum/onchain/presentation";
import { registryValueLabel } from "./labels";
import { VerifiedImage, type VerifiedImageCopy } from "./VerifiedImage";

const locale = DEFAULT_LOCALE;

function verifiedImageCopy(): VerifiedImageCopy {
  return {
    checking: t(locale, "museum.onchain.image.checking"),
    failed: t(locale, "museum.onchain.image.failed"),
    unavailable: t(locale, "museum.onchain.image.unavailable"),
    retry: t(locale, "museum.onchain.image.retry"),
  };
}

/** A work whose medium the record describes as generative software. */
export function isGenerative(record: OnchainMuseumRecord): boolean {
  const medium = payloadRecord(record, "profile")?.["medium"];
  return typeof medium === "string" && /generative/iu.test(medium);
}

/** The work's artists, in the record's order, as one phrase. */
export function workArtists(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): string | undefined {
  const names = payloadStrings(
    payloadRecord(record, "profile")?.["creator_entity_ids"]
  )
    .map((id) => view.resolve(id))
    .filter((link) => link.href !== null)
    .map((link) => link.label);
  return names.length === 0 ? undefined : formatList(locale, names);
}

function credit(view: OnchainWorkImageView): string | null {
  if (view.recordedCredit !== null) return view.recordedCredit;
  if (view.artists.length === 0) return null;
  const artists = formatList(locale, view.artists);
  // A title that already ends a sentence ("Take the Key!") takes no period.
  const title = /[.!?…]$/u.test(view.title) ? view.title : `${view.title}.`;
  return view.program === null
    ? t(locale, "museum.onchain.image.creditBuiltNoProgram", {
        artists,
        title,
      })
    : t(locale, "museum.onchain.image.creditBuilt", {
        artists,
        title,
        program: view.program,
      });
}

/** The rights status, unless the credit already states it. */
function rightsLine(
  status: string | null,
  creditText: string | null
): string | null {
  if (status === null) return null;
  const lead = status.split(";")[0]?.trim() ?? "";
  if (lead !== "" && creditText?.includes(lead) === true) return null;
  return t(locale, "museum.onchain.image.rights", { status });
}

/**
 * A work's principal image with the credit, display approval and reuse terms
 * its records carry. The image itself appears only after the browser has
 * checked its bytes.
 */
export function WorkFigure({
  view,
  eager = false,
}: Readonly<{ view: OnchainWorkImageView; eager?: boolean }>) {
  const { image } = view;
  const largest = image.derivatives.at(-1);
  const aspectRatio =
    largest === undefined ? 1 : largest.width / largest.height;
  const creditText = credit(view);
  const rights = rightsLine(image.rightsStatus, creditText);
  return (
    <figure className="tw-m-0 tw-mb-10 tw-max-w-4xl">
      {/* Tall works keep their whole height in view: width follows 80vh. */}
      <div style={{ maxWidth: `calc(80vh * ${aspectRatio.toFixed(4)})` }}>
        <VerifiedImage
          derivatives={image.derivatives}
          alt={image.altText}
          copy={verifiedImageCopy()}
          eager={eager}
        />
      </div>
      <figcaption className="tw-mt-3 tw-max-w-3xl tw-space-y-1 tw-text-sm tw-leading-6 tw-text-iron-300">
        {creditText === null ? null : (
          <p className="tw-m-0 tw-text-iron-100">{creditText}</p>
        )}
        {rights === null ? null : <p className="tw-m-0">{rights}</p>}
        <p className="tw-m-0">
          {registryValueLabel("image.display", image.displayStatus)}
        </p>
        <p className="tw-m-0 tw-text-iron-400">
          {image.rightsTerms.length === 0
            ? t(locale, "museum.onchain.image.noTerms")
            : image.rightsTerms.join(" ")}
        </p>
        <p className="tw-m-0 tw-text-xs tw-text-iron-500">
          {t(locale, "museum.onchain.image.verifiedNote")}
        </p>
      </figcaption>
    </figure>
  );
}
