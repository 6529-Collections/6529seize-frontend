import type { ReactNode } from "react";

/**
 * Shared renderers for the 6529 Fund SZN1 artwork pages (capsule-house,
 * cod): lightbox artwork tiles, stacked flexslider columns, and the
 * swiper image carousel. Markup reproduces the WordPress scrape
 * byte-for-byte, including attribute order and the stray spaces inside
 * class attributes that prettier-plugin-tailwindcss would strip from
 * className literals (kept in constants below).
 */
const IMAGE_ELEMENT_CLASS = "fusion-image-element ";

const imageframeClass = (imageframe: number): string =>
  ` fusion-imageframe imageframe-none imageframe-${imageframe} hover-type-zoomin`;

export interface FundSzn1Image {
  readonly width: number;
  readonly height: number;
  readonly src: string;
  readonly wpImage?: number;
  readonly srcSet?: string;
  readonly sizes?: string;
}

export type FundSzn1Block =
  | {
      readonly kind: "tile";
      readonly variant: "sixth" | "half";
      readonly column: number;
      readonly imageframe: number;
      readonly titleNumber: number;
      readonly lightboxHref: string;
      readonly lightboxRel: string;
      readonly artworkTitle: string;
      readonly heading: ReactNode;
      readonly fetchPriorityHigh?: boolean;
      readonly image: FundSzn1Image;
    }
  | {
      readonly kind: "sliderColumn";
      readonly column: number;
      readonly titleNumber?: number;
      readonly heading?: ReactNode;
      readonly sliders: readonly (readonly FundSzn1Image[])[];
    }
  | {
      readonly kind: "carousel";
      readonly column: number;
      readonly carouselNumber: number;
      readonly titleNumber: number;
      readonly caption: ReactNode;
      readonly items: readonly FundSzn1Image[];
    };

const TILE_VARIANT_STYLES = {
  sixth: {
    colType: "1_6",
    width: "16.6666666667%",
    paddingLeft: "11.52%",
  },
  half: {
    colType: "1_2",
    width: "50%",
    paddingLeft: "3.84%",
  },
} as const;

function BlockTitle({
  titleNumber,
  children,
}: {
  readonly titleNumber: number;
  readonly children: ReactNode;
}) {
  return (
    <div
      className={`fusion-title title fusion-title-${titleNumber} fusion-sep-none fusion-title-text fusion-title-size-two`}
      style={{ color: "#000000" }}
    >
      <h2
        className="fusion-title-heading title-heading-left fusion-responsive-typography-calculated"
        style={{
          margin: 0,
          lineHeight: "1.2",
          color: "#000000",
        }}
      >
        {children}
      </h2>
    </div>
  );
}

function ArtworkTile({
  block,
}: {
  readonly block: Extract<FundSzn1Block, { kind: "tile" }>;
}) {
  const variant = TILE_VARIANT_STYLES[block.variant];
  const { image } = block;
  return (
    <div
      className={`fusion-layout-column fusion_builder_column fusion-builder-column-${block.column} fusion_builder_column_${variant.colType} ${variant.colType} fusion-flex-column`}
      style={{
        backgroundSize: "cover",
        width: variant.width,
        marginTop: 0,
        paddingRight: 0,
        marginBottom: 20,
        paddingLeft: variant.paddingLeft,
      }}
    >
      <div className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column">
        <div className={IMAGE_ELEMENT_CLASS} style={{ textAlign: "center" }}>
          <span
            className={imageframeClass(block.imageframe)}
            style={{ border: "1px solid #000000" }}
          >
            <a
              href={block.lightboxHref}
              className="fusion-lightbox"
              data-rel={block.lightboxRel}
              data-title={block.artworkTitle}
              title={block.artworkTitle}
            >
              <img
                loading="lazy"
                {...(block.fetchPriorityHigh
                  ? { fetchPriority: "high" as const }
                  : {})}
                decoding="async"
                width={image.width}
                height={image.height}
                src={image.src}
                alt="6529.io"
                className={`img-responsive wp-image-${image.wpImage}`}
                srcSet={image.srcSet}
                sizes={image.sizes}
              />
            </a>
          </span>
        </div>
        <BlockTitle titleNumber={block.titleNumber}>{block.heading}</BlockTitle>
      </div>
    </div>
  );
}

function SliderColumn({
  block,
}: {
  readonly block: Extract<FundSzn1Block, { kind: "sliderColumn" }>;
}) {
  return (
    <div
      className={`fusion-layout-column fusion_builder_column fusion-builder-column-${block.column} fusion_builder_column_1_2 1_2 fusion-flex-column`}
      style={{
        backgroundSize: "cover",
        width: "50%",
        marginTop: 0,
        paddingRight: 0,
        marginBottom: 20,
        paddingLeft: "3.84%",
      }}
    >
      <div className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column">
        {block.sliders.map((slides, sliderIndex) => (
          <div
            className="fusion-slider-sc"
            key={`${block.column}-${sliderIndex}`}
          >
            <div
              className="fusion-flexslider-loading flexslider flexslider-hover-type-none"
              data-slideshow_autoplay={1}
              data-slideshow_smooth_height={0}
              data-slideshow_speed={7000}
              style={{ maxWidth: "100%", height: "100%" }}
            >
              <ul className="slides">
                {slides.map((slide) => (
                  <li className="image" key={slide.src}>
                    <span className="fusion-image-hover-element hover-type-none">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={slide.src}
                        width={slide.width}
                        height={slide.height}
                        className={`wp-image-${slide.wpImage}`}
                        srcSet={slide.srcSet}
                        sizes={slide.sizes}
                        alt="6529.io"
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        {block.titleNumber !== undefined && (
          <BlockTitle titleNumber={block.titleNumber}>
            {block.heading}
          </BlockTitle>
        )}
      </div>
    </div>
  );
}

function Carousel({
  block,
}: {
  readonly block: Extract<FundSzn1Block, { kind: "carousel" }>;
}) {
  return (
    <div
      className={`fusion-layout-column fusion_builder_column fusion-builder-column-${block.column} fusion_builder_column_1_1 1_1 fusion-flex-column`}
      style={{
        backgroundSize: "cover",
        width: "100%",
        marginTop: 0,
        paddingRight: 0,
        marginBottom: 20,
        paddingLeft: "1.92%",
      }}
    >
      <div className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column">
        <div
          className={`fusion-image-carousel fusion-image-carousel-auto fusion-image-carousel-${block.carouselNumber} fusion-carousel-border`}
        >
          <div
            className="awb-carousel awb-swiper awb-swiper-carousel"
            data-autoplay="no"
            data-columns={3}
            data-itemmargin={13}
            data-itemwidth={180}
            data-touchscroll="no"
            data-imagesize="auto"
          >
            <div className="swiper-wrapper awb-image-carousel-wrapper fusion-flex-align-items-center">
              {block.items.map((item) => (
                <div className="swiper-slide" key={item.src}>
                  <div className="fusion-carousel-item-wrapper">
                    <div className="fusion-image-wrapper hover-type-none">
                      <img
                        loading="lazy"
                        decoding="async"
                        width={item.width}
                        height={item.height}
                        src={item.src}
                        className="attachment-full size-full"
                        alt="6529.io"
                        srcSet={item.srcSet}
                        sizes={item.sizes}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="awb-swiper-button awb-swiper-button-prev">
              <i className="awb-icon-angle-left" aria-hidden="true" />
            </div>
            <div className="awb-swiper-button awb-swiper-button-next">
              <i className="awb-icon-angle-right" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div
          className={`fusion-title title fusion-title-${block.titleNumber} fusion-sep-none fusion-title-text fusion-title-size-two`}
          style={{ color: "#000000" }}
        >
          <h2
            className="fusion-title-heading title-heading-left fusion-responsive-typography-calculated"
            style={{
              margin: 0,
              lineHeight: "1.2",
              color: "#000000",
            }}
          />
          <p style={{ textAlign: "center" }}>{block.caption}</p>
        </div>
      </div>
    </div>
  );
}

export default function FundSzn1ArtworkBlocks({
  blocks,
}: {
  readonly blocks: readonly FundSzn1Block[];
}) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${block.column}-${index}`;
        if (block.kind === "tile") {
          return <ArtworkTile key={key} block={block} />;
        }
        if (block.kind === "sliderColumn") {
          return <SliderColumn key={key} block={block} />;
        }
        return <Carousel key={key} block={block} />;
      })}
    </>
  );
}
