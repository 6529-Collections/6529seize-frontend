import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { OnchainWorkImageView } from "@/lib/museum/onchain/presentation";
import { VerifiedImage, type VerifiedImageCopy } from "./VerifiedImage";

const locale = DEFAULT_LOCALE;

export function verifiedImageCopy(): VerifiedImageCopy {
  return {
    checking: t(locale, "museum.onchain.image.checking"),
    failed: t(locale, "museum.onchain.image.failed"),
    unavailable: t(locale, "museum.onchain.image.unavailable"),
    retry: t(locale, "museum.onchain.image.retry"),
  };
}

/**
 * A work's principal image with the credit and the rights terms its
 * presentation manifest carries. The image itself appears only after the
 * browser has checked its bytes.
 */
export function WorkFigure({
  view,
  eager = false,
}: Readonly<{ view: OnchainWorkImageView; eager?: boolean }>) {
  const { image, credit } = view;
  const largest = image.derivatives.at(-1);
  const aspectRatio =
    largest === undefined ? 1 : largest.width / largest.height;
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
      <figcaption className="tw-mt-3 tw-space-y-1 tw-text-sm tw-leading-6 tw-text-iron-300">
        {credit === null ? null : (
          <p className="tw-m-0 tw-text-iron-100">{credit}</p>
        )}
        {image.rightsStatus === null ? null : (
          <p className="tw-m-0">
            {t(locale, "museum.onchain.image.rights", {
              status: image.rightsStatus,
            })}
          </p>
        )}
        {image.rightsTerms.map((term) => (
          <p key={term} className="tw-m-0 tw-text-iron-400">
            {term}
          </p>
        ))}
        <p className="tw-m-0 tw-text-xs tw-text-iron-500">
          {t(locale, "museum.onchain.image.verifiedNote")}
        </p>
      </figcaption>
    </figure>
  );
}
