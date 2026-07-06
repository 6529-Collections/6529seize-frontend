import { Fragment } from "react";

/**
 * Shared renderer for the genesis token-showcase pages (gazers,
 * jiometory-no-compute, kai-gen, fragments-of-an-infinite-field): five
 * fusion rows, each holding two media+traits column pairs. Markup
 * reproduces the WordPress scrape byte-for-byte, including attribute
 * order, inline-style key order, and the stray spaces inside class
 * attributes that prettier-plugin-tailwindcss would strip from className
 * literals (kept in constants below).
 */
const IMAGE_ELEMENT_CLASS = "fusion-image-element ";

const imageframeClass = (imageframe: number): string =>
  ` fusion-imageframe imageframe-none imageframe-${imageframe} hover-type-zoomin`;

const FRAGMENTS_UPLOADS_PREFIX =
  "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/";
const FRAGMENTS_FILE_BASE = "Fragments-of-an-Infinite-Field";
const FRAGMENTS_TITLE_BASE = "Fragments of an Infinite Field";
const FRAGMENTS_IMAGE_SIZES = "(max-width: 640px) 100vw, 400px";

export type GenesisShowcaseMediaKind = "video" | "fragmentsImage";

export interface GenesisShowcasePair {
  readonly media: string;
  readonly tokenLine: string;
  readonly keyTraits: readonly string[];
  readonly rarity: readonly string[];
  readonly caption: string;
  /** Video column without the lightbox column-anchor wrapper. */
  readonly plainColumn: boolean;
  /** First-image LCP hint on the fragments page. */
  readonly fetchPriorityHigh: boolean;
  /** Traits text carries the awb-text-cols fusion-text-columns-6 classes. */
  readonly traitsTextColumns: boolean;
  /** The Rarity label's <br /> sits after </strong>, not inside it. */
  readonly rarityBrOutsideStrong: boolean;
}

const PAIR_FLAGS = ["plain", "hi", "cols6", "rabr"] as const;
type PairFlag = (typeof PAIR_FLAGS)[number];

/**
 * The showcase pairs are uniform enough that each one is encoded as a
 * single pipe-delimited descriptor (SonarCloud CPD abstracts literal
 * values, so structured per-pair object literals would chain as
 * self-duplication — the same lesson as the fund-szn1 slider data):
 *
 *   `media|tokenLine|keyTraits|rarity|flags|caption`
 *
 * - `media`: for `video` pairs the videos.files.wordpress.com path
 *   (`<id>/<file>.mp4`); for `fragmentsImage` pairs
 *   `<token>@<wpImageId>@<lightboxRelHash>` — src, srcSet and titles all
 *   follow the WordPress asset naming scheme and are derived.
 * - `tokenLine`: the first paragraph verbatim (one scrape entry reads
 *   `Token:633` without a space — preserved exactly).
 * - `keyTraits` / `rarity`: `;`-joined display lines.
 * - `flags`: `,`-joined subset of `plain`, `hi`, `cols6`, `rabr`
 *   (may be empty).
 * - `caption`: free prose, always the final field so it may contain `;`.
 *
 * The descriptor round-trip was asserted byte-identical against every
 * captured URL/attribute before the rewrite, and hydrated-DOM parity
 * captures for all four routes are byte-identical again after it.
 */
export function parseGenesisShowcasePair(
  descriptor: string,
  kind: GenesisShowcaseMediaKind
): GenesisShowcasePair {
  const fields = descriptor.split("|");
  if (fields.length !== 6) {
    throw new Error(
      `Malformed genesis showcase descriptor (${fields.length} fields): ${descriptor}`
    );
  }
  const [media, tokenLine, keyTraitsField, rarityField, flagsField, caption] =
    fields as [string, string, string, string, string, string];
  if (!media || !tokenLine || !keyTraitsField || !rarityField || !caption) {
    throw new Error(`Empty genesis showcase descriptor field: ${descriptor}`);
  }
  if (!/^Token:\s?\S+$/.test(tokenLine)) {
    throw new Error(`Unexpected genesis token line: ${tokenLine}`);
  }
  if (kind === "fragmentsImage" && !/^\d+@\d+@[0-9a-f]+$/.test(media)) {
    throw new Error(`Malformed fragments image media field: ${media}`);
  }
  const flags = flagsField === "" ? [] : flagsField.split(",");
  for (const flag of flags) {
    if (!PAIR_FLAGS.includes(flag as PairFlag)) {
      throw new Error(`Unknown genesis showcase flag: ${flag}`);
    }
  }
  if (flags.includes("plain") && kind !== "video") {
    throw new Error(`The plain flag only applies to video pairs: ${media}`);
  }
  if (flags.includes("hi") && kind !== "fragmentsImage") {
    throw new Error(`The hi flag only applies to image pairs: ${media}`);
  }
  return {
    media,
    tokenLine,
    keyTraits: keyTraitsField.split(";"),
    rarity: rarityField.split(";"),
    caption,
    plainColumn: flags.includes("plain"),
    fetchPriorityHigh: flags.includes("hi"),
    traitsTextColumns: flags.includes("cols6"),
    rarityBrOutsideStrong: flags.includes("rabr"),
  };
}

function TraitLines({ items }: { readonly items: readonly string[] }) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={`${index}-${item}`}>
          {index > 0 ? <br /> : null}
          {item}
        </Fragment>
      ))}
    </>
  );
}

function TraitsGroup({
  label,
  items,
  brOutsideLabel,
}: {
  readonly label: string;
  readonly items: readonly string[];
  readonly brOutsideLabel: boolean;
}) {
  return (
    <p>
      {brOutsideLabel ? (
        <>
          <strong>{label}</strong>
          <br />
        </>
      ) : (
        <strong>
          {label}
          <br />
        </strong>
      )}
      <TraitLines items={items} />
      <strong>
        <br />
      </strong>
    </p>
  );
}

function CaptionText({
  textNumber,
  caption,
}: {
  readonly textNumber: number;
  readonly caption: string;
}) {
  return (
    <div
      className={`fusion-text fusion-text-${textNumber}`}
      style={{ color: "#000000" }}
    >
      <p>{caption}</p>
    </div>
  );
}

function VideoColumn({
  column,
  textNumber,
  pair,
}: {
  readonly column: number;
  readonly textNumber: number;
  readonly pair: GenesisShowcasePair;
}) {
  const videoUrl = `https://videos.files.wordpress.com/${pair.media}`;
  const body = (
    <div className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column">
      <div
        className="fusion-video fusion-selfhosted-video"
        style={{ maxWidth: "100%" }}
      >
        <div className="video-wrapper">
          <video
            playsInline={true}
            width="100%"
            style={{ objectFit: "cover" }}
            autoPlay={true}
            muted={true}
            loop={true}
            preload="auto"
          >
            <source src={videoUrl} type="video/mp4" />
            Sorry, your browser doesn't support embedded videos.
          </video>
        </div>
      </div>
      <CaptionText textNumber={textNumber} caption={pair.caption} />
    </div>
  );
  if (pair.plainColumn) {
    return (
      <div
        className={`fusion-layout-column fusion_builder_column fusion-builder-column-${column} fusion_builder_column_1_4 1_4 fusion-flex-column`}
        style={{
          backgroundSize: "cover",
          width: "25%",
          marginTop: 0,
          paddingRight: 0,
          marginBottom: 20,
          paddingLeft: "7.68%",
        }}
      >
        {body}
      </div>
    );
  }
  return (
    <div
      className={`fusion-layout-column fusion_builder_column fusion-builder-column-${column} fusion_builder_column_1_4 1_4 fusion-flex-column fusion-column-inner-bg-wrapper`}
      style={{
        width: "25%",
        marginTop: 0,
        paddingRight: 0,
        marginBottom: 20,
        paddingLeft: "7.68%",
      }}
    >
      <span className="fusion-column-inner-bg hover-type-none">
        <a
          className="fusion-column-anchor"
          href={videoUrl}
          data-rel="iLightbox"
        >
          <span className="fusion-column-inner-bg-image" />
        </a>
      </span>
      {body}
    </div>
  );
}

function FragmentsImageColumn({
  column,
  textNumber,
  imageframe,
  pair,
}: {
  readonly column: number;
  readonly textNumber: number;
  readonly imageframe: number;
  readonly pair: GenesisShowcasePair;
}) {
  const [token, wpImage, lightboxRel] = pair.media.split("@") as [
    string,
    string,
    string,
  ];
  const fileBase = `${FRAGMENTS_UPLOADS_PREFIX}${FRAGMENTS_FILE_BASE}-${token}`;
  const src = `${fileBase}-300x300.png`;
  const srcSet = [200, 400, 600, 800]
    .map((size) => `${fileBase}-${size}x${size}.png ${size}w`)
    .concat(`${fileBase}.png 1000w`)
    .join(", ");
  const title = `${FRAGMENTS_TITLE_BASE} #${token}`;
  return (
    <div
      className={`fusion-layout-column fusion_builder_column fusion-builder-column-${column} fusion_builder_column_1_4 1_4 fusion-flex-column`}
      style={{
        backgroundSize: "cover",
        width: "25%",
        marginTop: 0,
        paddingRight: 0,
        marginBottom: 20,
        paddingLeft: "7.68%",
      }}
    >
      <div className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column">
        <div className={IMAGE_ELEMENT_CLASS} style={{ textAlign: "center" }}>
          <span
            className={imageframeClass(imageframe)}
            style={{ border: "1px solid #000000" }}
          >
            <a
              href={src}
              className="fusion-lightbox"
              data-rel={`iLightbox[${lightboxRel}]`}
              data-title={title}
              title={title}
            >
              <img
                loading="lazy"
                {...(pair.fetchPriorityHigh
                  ? { fetchPriority: "high" as const }
                  : {})}
                decoding="async"
                width={300}
                height={300}
                src={src}
                alt="6529.io"
                className={`img-responsive wp-image-${wpImage}`}
                srcSet={srcSet}
                sizes={FRAGMENTS_IMAGE_SIZES}
              />
            </a>
          </span>
        </div>
        <CaptionText textNumber={textNumber} caption={pair.caption} />
      </div>
    </div>
  );
}

function TraitsColumn({
  column,
  textNumber,
  pair,
}: {
  readonly column: number;
  readonly textNumber: number;
  readonly pair: GenesisShowcasePair;
}) {
  const textClass = pair.traitsTextColumns
    ? ` awb-text-cols fusion-text-columns-6`
    : "";
  return (
    <div
      className={`fusion-layout-column fusion_builder_column fusion-builder-column-${column} fusion_builder_column_1_4 1_4 fusion-flex-column`}
      style={{
        backgroundSize: "cover",
        width: "25%",
        marginTop: 0,
        paddingRight: "7.68%",
        marginBottom: 20,
        paddingLeft: "7.68%",
      }}
    >
      <div className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column">
        <div
          className={`fusion-text fusion-text-${textNumber}${textClass}`}
          style={{ color: "#000000" }}
        >
          <p>{pair.tokenLine}</p>
          <TraitsGroup
            label="Key Traits:"
            items={pair.keyTraits}
            brOutsideLabel={false}
          />
          <TraitsGroup
            label="Rarity:"
            items={pair.rarity}
            brOutsideLabel={pair.rarityBrOutsideStrong}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the showcase rows: pairs are laid out two per fusion row, and
 * the scrape's strictly sequential numbering is derived from the pair
 * index — rows count from fusion-builder-row-3, columns and fusion-text
 * numbers from 2, imageframes from 1.
 */
export default function GenesisTokenShowcase({
  kind,
  pairs,
}: {
  readonly kind: GenesisShowcaseMediaKind;
  readonly pairs: readonly string[];
}) {
  const parsed = pairs.map((descriptor) =>
    parseGenesisShowcasePair(descriptor, kind)
  );
  if (parsed.length === 0 || parsed.length % 2 !== 0) {
    throw new Error(
      `Genesis showcase rows hold two pairs each; got ${parsed.length} pairs`
    );
  }
  const rows: (readonly GenesisShowcasePair[])[] = [];
  for (let index = 0; index < parsed.length; index += 2) {
    rows.push(parsed.slice(index, index + 2));
  }
  return (
    <>
      {rows.map((rowPairs, rowIndex) => (
        <div
          key={`row-${3 + rowIndex}`}
          className={`fusion-fullwidth fullwidth-box fusion-builder-row-${3 + rowIndex} fusion-flex-container nonhundred-percent-fullwidth non-hundred-percent-height-scrolling`}
          style={{
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
            paddingTop: 40,
            paddingBottom: 0,
            backgroundColor: "#ffffff",
            flexWrap: "wrap",
          }}
        >
          <div
            className="fusion-builder-row fusion-row fusion-flex-align-items-flex-start fusion-flex-content-wrap"
            style={{
              maxWidth: 1248,
              marginLeft: "calc(-4% / 2 )",
              marginRight: "calc(-4% / 2 )",
            }}
          >
            {rowPairs.map((pair, indexInRow) => {
              const pairIndex = rowIndex * 2 + indexInRow;
              const mediaNumber = 2 + pairIndex * 2;
              return (
                <Fragment key={`pair-${mediaNumber}`}>
                  {kind === "video" ? (
                    <VideoColumn
                      column={mediaNumber}
                      textNumber={mediaNumber}
                      pair={pair}
                    />
                  ) : (
                    <FragmentsImageColumn
                      column={mediaNumber}
                      textNumber={mediaNumber}
                      imageframe={pairIndex + 1}
                      pair={pair}
                    />
                  )}
                  <TraitsColumn
                    column={mediaNumber + 1}
                    textNumber={mediaNumber + 1}
                    pair={pair}
                  />
                </Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
