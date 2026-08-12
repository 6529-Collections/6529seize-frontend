import type { ReactNode } from "react";
import type { MuseumMediaMetadata } from "@/lib/museum/publication/types";
import type { MuseumProgramMedia } from "@/lib/museum/types";
import { MuseumProgramImage } from "./MuseumProgramImage";
import { MuseumRightsLink } from "./MuseumRightsLink";

export function MuseumReviewedProgramMediaFigure({
  media,
  metadata,
  sizes,
  eager = false,
  figureClassName = "tw-m-0 tw-min-w-0",
  imageClassName = "tw-block tw-h-auto tw-w-full tw-object-contain",
  captionClassName = "tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4",
  creditLineClassName = "tw-mt-2 tw-block tw-text-xs tw-leading-5 tw-text-iron-500",
  licenseWrapperClassName,
  licenseLinkClassName = "tw-text-iron-300 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400",
  rightsLayout = "inline",
  children,
}: {
  readonly media: MuseumProgramMedia;
  readonly metadata?: MuseumMediaMetadata | undefined;
  readonly sizes: string;
  readonly eager?: boolean;
  readonly figureClassName?: string;
  readonly imageClassName?: string;
  readonly captionClassName?: string;
  readonly creditLineClassName?: string;
  readonly licenseWrapperClassName?: string;
  readonly licenseLinkClassName?: string;
  readonly rightsLayout?: "block" | "inline";
  readonly children?: ReactNode;
}) {
  const hasCaption = children !== undefined || metadata !== undefined;
  const credit = metadata?.credit;
  let rightsMarkup: ReactNode = null;
  if (credit !== undefined) {
    if (rightsLayout === "block") {
      rightsMarkup = (
        <>
          <span className={creditLineClassName}>{credit.creditLine}</span>
          {credit.licenseLabel === null ? null : (
            <span className={licenseWrapperClassName}>
              <MuseumRightsLink
                href={credit.licenseUrl ?? undefined}
                label={credit.licenseLabel}
                className={licenseLinkClassName}
              />
            </span>
          )}
        </>
      );
    } else {
      rightsMarkup = (
        <span className={creditLineClassName}>
          {credit.creditLine}
          {credit.licenseLabel === null ? null : (
            <>
              {" · "}
              <MuseumRightsLink
                href={credit.licenseUrl ?? undefined}
                label={credit.licenseLabel}
                className={licenseLinkClassName}
              />
            </>
          )}
        </span>
      );
    }
  }

  return (
    <figure className={figureClassName}>
      <div className="tw-overflow-hidden tw-bg-black">
        <MuseumProgramImage
          media={media}
          sizes={sizes}
          eager={eager}
          className={imageClassName}
        />
      </div>
      {!hasCaption ? null : (
        <figcaption className={captionClassName}>
          {children}
          {rightsMarkup}
        </figcaption>
      )}
    </figure>
  );
}
