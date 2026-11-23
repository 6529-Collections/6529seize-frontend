import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import Link from "next/link";
import { formatList } from "@/i18n/format";
import { onchainMuseumRecordHref } from "@/lib/museum/onchain/fields";
import type { OnchainMuseumRecord } from "@/lib/museum/onchain/museum";
import type { OnchainMuseumView } from "@/lib/museum/onchain/presentation";
import {
  creatorsOf,
  type OnchainRightsView,
  type OnchainWorkImageView,
} from "@/lib/museum/onchain/works";
import { TEXT_LINK } from "./OnchainParts";
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

/** The work's artists, in the record's order, as one phrase. */
export function workArtists(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): string | undefined {
  const names = creatorsOf(view, record).map((item) => view.labelOf(item));
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

/**
 * The rights the registry records for the work (PRV_RIGHTS), else the
 * presentation manifest's rights status, unless the credit already states it.
 */
function rightsLine(
  rights: readonly OnchainRightsView[],
  manifestStatus: string | null,
  creditText: string | null
): string | null {
  const recorded = rights.find((item) => item.licence !== null);
  const licence = recorded?.licence ?? null;
  if (licence !== null) {
    if (recorded?.status === "restricted") {
      return t(locale, "museum.onchain.image.rightsRestricted", { licence });
    }
    if (creditText?.includes(licence) === true) return null;
    if (recorded?.status === "licensed") {
      return t(locale, "museum.onchain.image.rightsLicensed", { licence });
    }
  }
  if (manifestStatus === null) return null;
  const lead = manifestStatus.split(";")[0]?.trim() ?? "";
  if (lead !== "" && creditText?.includes(lead) === true) return null;
  return t(locale, "museum.onchain.image.rights", { status: manifestStatus });
}

/** The manifest's reuse terms, unless the caption already names the license. */
function termsLine(
  terms: readonly string[],
  named: readonly (string | null)[]
): string | null {
  if (terms.length === 0) return t(locale, "museum.onchain.image.noTerms");
  const text = terms.join(" ");
  const licence = /CC [A-Z-]+ \d\.\d/u.exec(text)?.[0];
  if (
    licence !== undefined &&
    named.some((line) => line?.includes(licence) === true)
  ) {
    return null;
  }
  return text;
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
  const rights = rightsLine(view.rights, image.rightsStatus, creditText);
  const terms = termsLine(image.rightsTerms, [creditText, rights]);
  const statement = view.rights[0]?.record;
  return (
    <figure className="tw-m-0 tw-mb-10 tw-max-w-6xl lg:tw-grid lg:tw-grid-cols-[minmax(0,1fr)_18rem] lg:tw-items-start lg:tw-gap-8">
      {/* Tall works keep their whole height in view: width follows 80vh. */}
      <div style={{ maxWidth: `calc(80vh * ${aspectRatio.toFixed(4)})` }}>
        <VerifiedImage
          derivatives={image.derivatives}
          alt={image.altText}
          copy={verifiedImageCopy()}
          eager={eager}
        />
      </div>
      <figcaption className="tw-mt-3 tw-max-w-3xl tw-space-y-1 tw-text-sm tw-leading-6 tw-text-iron-300 lg:tw-mt-0">
        {creditText === null ? null : (
          <p className="tw-m-0 tw-text-iron-100">{creditText}</p>
        )}
        {rights === null ? null : (
          <p className="tw-m-0">
            {rights}
            {statement === undefined ? null : (
              <>
                {" "}
                <Link
                  href={onchainMuseumRecordHref(statement.subjectId)}
                  className={TEXT_LINK}
                >
                  {t(locale, "museum.onchain.image.rightsLink")}
                </Link>
              </>
            )}
          </p>
        )}
        {terms === null ? null : (
          <p className="tw-m-0 tw-text-iron-400">{terms}</p>
        )}
      </figcaption>
    </figure>
  );
}
