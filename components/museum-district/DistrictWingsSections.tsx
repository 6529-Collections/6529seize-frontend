import Link from "next/link";
import type { ReactNode } from "react";

import type {
  DistrictCardNumbers,
  DistrictEntry,
  DistrictVariant,
  DistrictWingImage,
} from "./district-wings-data";
import { DISTRICT_WINGS } from "./district-wings-data";

/**
 * Renders the shared 6529 Museum District listing for one of its two
 * scrape-twin pages. The om variant links every wing to its oncyber.io
 * space with an external anchor; the museum variant links to the
 * internal wing pages. Markup (including attribute order and the WP
 * numeric class suffixes) reproduces the original scrape byte-for-byte.
 *
 * The scrape's class attributes carry stray leading/trailing spaces
 * that prettier-plugin-tailwindcss strips out of className literals, so
 * the space-sensitive class strings are built here as constants to keep
 * the emitted DOM byte-identical to the original pages.
 */
const IMAGE_ELEMENT_CLASS = "fusion-image-element ";

const imageframeClass = (imageframe: number): string =>
  ` fusion-imageframe imageframe-none imageframe-${imageframe} hover-type-none`;

const wingTextClass = (text: number | undefined, noMargin: boolean): string =>
  `fusion-text fusion-text-${text}${noMargin ? " fusion-text-no-margin" : ""}`;

function WingLink({
  variant,
  href,
  children,
}: {
  readonly variant: DistrictVariant;
  readonly href: Record<DistrictVariant, string>;
  readonly children: ReactNode;
}) {
  if (variant === "om") {
    return (
      <a href={href.om} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return <Link href={href.museum}>{children}</Link>;
}

function WingImage({ image }: { readonly image: DistrictWingImage }) {
  return (
    <img
      loading="lazy"
      decoding="async"
      width={image.width}
      height={image.height}
      title={image.title}
      src={image.src}
      alt="6529.io"
      className={`img-responsive wp-image-${image.wpImage}`}
      srcSet={image.srcSet}
      sizes={image.sizes}
    />
  );
}

function WingCardFrame({
  numbers,
  image,
  children,
}: {
  readonly numbers: DistrictCardNumbers;
  readonly image: DistrictWingImage;
  readonly children: ReactNode;
}) {
  return (
    <div
      className={`fusion-layout-column fusion_builder_column fusion-builder-column-${numbers.column} fusion_builder_column_1_3 1_3 fusion-flex-column fusion-flex-align-self-center`}
      style={{
        backgroundSize: "cover",
        width: "33.3333333333%",
        marginTop: 0,
        paddingRight: "5.76%",
        marginBottom: 20,
        paddingLeft: "5.76%",
      }}
    >
      <div className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column">
        <div
          className="fusion-builder-row fusion-builder-row-inner fusion-row fusion-flex-align-items-flex-start fusion-flex-justify-content-center fusion-flex-content-wrap"
          style={{
            width: "104% !important",
            maxWidth: "104% !important",
            marginLeft: "calc(-4% / 2 )",
            marginRight: "calc(-4% / 2 )",
          }}
        >
          <div
            className={`fusion-layout-column fusion_builder_column_inner fusion-builder-nested-column-${numbers.nestedImg} fusion_builder_column_inner_2_5 2_5 fusion-flex-column fusion-flex-align-self-center`}
            style={{
              backgroundSize: "cover",
              width: "40%",
              marginTop: 0,
              paddingRight: "4.8%",
              marginBottom: 20,
              paddingLeft: "4.8%",
            }}
          >
            <div className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column">
              <div className={IMAGE_ELEMENT_CLASS}>
                <span className={imageframeClass(numbers.imageframe)}>
                  <WingImage image={image} />
                </span>
              </div>
            </div>
          </div>
          <div
            className={`fusion-layout-column fusion_builder_column_inner fusion-builder-nested-column-${numbers.nestedText} fusion_builder_column_inner_3_5 3_5 fusion-flex-column fusion-flex-align-self-center`}
            style={{
              backgroundSize: "cover",
              width: "60%",
              marginTop: 0,
              paddingRight: "3.2%",
              marginBottom: 20,
              paddingLeft: "3.2%",
            }}
          >
            <div className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WingCardTitle({
  titleNumber,
  children,
}: {
  readonly titleNumber: number;
  readonly children: ReactNode;
}) {
  return (
    <div
      className={`fusion-title title fusion-title-${titleNumber} fusion-sep-none fusion-title-text fusion-title-size-three`}
      style={{ color: "#000000" }}
    >
      <h3
        className="fusion-title-heading title-heading-left fusion-responsive-typography-calculated"
        style={{
          margin: 0,
          lineHeight: 1,
          color: "#000000",
        }}
      >
        {children}
      </h3>
    </div>
  );
}

function DistrictHeading({
  entry,
  variant,
}: {
  readonly entry: Extract<DistrictEntry, { kind: "heading" }>;
  readonly variant: DistrictVariant;
}) {
  const numbers = entry.numbers[variant];
  return (
    <div
      className={`fusion-layout-column fusion_builder_column fusion-builder-column-${numbers.column} fusion_builder_column_1_1 1_1 fusion-flex-column`}
      style={{
        backgroundSize: "cover",
        width: "100%",
        marginTop: 0,
        paddingRight: "1.92%",
        marginBottom: 20,
        paddingLeft: "1.92%",
      }}
    >
      <div className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column">
        <div
          className={`fusion-title title fusion-title-${numbers.title} fusion-sep-none fusion-title-text fusion-title-size-one`}
          style={{ color: "#000000" }}
        >
          <h1
            className="fusion-title-heading title-heading-left fusion-responsive-typography-calculated"
            style={{
              margin: 0,
              lineHeight: "0.8",
              color: "#000000",
            }}
          >
            {entry.text[variant]}
          </h1>
        </div>
      </div>
    </div>
  );
}

function DistrictCard({
  entry,
  variant,
}: {
  readonly entry: Extract<DistrictEntry, { kind: "card" }>;
  readonly variant: DistrictVariant;
}) {
  const numbers = entry.numbers[variant];
  return (
    <WingCardFrame numbers={numbers} image={entry.image}>
      <WingCardTitle titleNumber={numbers.title}>{entry.title}</WingCardTitle>
      <div
        className={wingTextClass(numbers.text, entry.noMargin)}
        style={{ color: "#000000" }}
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {entry.links.map((link) => (
            <li key={link.href.om}>
              <WingLink variant={variant} href={link.href}>
                {link.label}
              </WingLink>
            </li>
          ))}
        </ul>
      </div>
    </WingCardFrame>
  );
}

function DistrictTitleLinkCard({
  entry,
  variant,
}: {
  readonly entry: Extract<DistrictEntry, { kind: "titleLinkCard" }>;
  readonly variant: DistrictVariant;
}) {
  const numbers = entry.numbers[variant];
  return (
    <WingCardFrame numbers={numbers} image={entry.image}>
      <WingCardTitle titleNumber={numbers.title}>
        <WingLink variant={variant} href={entry.href}>
          {entry.label}
        </WingLink>
      </WingCardTitle>
    </WingCardFrame>
  );
}

export default function DistrictWingsSections({
  variant,
}: {
  readonly variant: DistrictVariant;
}) {
  return (
    <>
      {DISTRICT_WINGS.map((entry, index) => {
        const key = `${entry.kind}-${index}`;
        if (entry.kind === "heading") {
          return <DistrictHeading key={key} entry={entry} variant={variant} />;
        }
        if (entry.kind === "card") {
          return <DistrictCard key={key} entry={entry} variant={variant} />;
        }
        return (
          <DistrictTitleLinkCard key={key} entry={entry} variant={variant} />
        );
      })}
    </>
  );
}
