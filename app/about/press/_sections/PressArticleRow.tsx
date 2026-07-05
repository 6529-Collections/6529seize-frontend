import type { ReactNode } from "react";

interface PressArticleRowProps {
  readonly row: number;
  readonly imageColumn: number;
  readonly textColumn: number;
  readonly separatorColumn?: number;
  readonly href: string;
  readonly backgroundUrl: string;
  readonly placeholderSrc: string;
  readonly children: ReactNode;
}

/**
 * The byte-uniform WP-scrape skeleton shared by all twelve press rows:
 * a fusion row holding a 1/3-width linked image column, a 2/3-width
 * text column, and a full-width separator column. The varying article
 * content renders as children inside the text column wrapper; emitted
 * DOM is identical to the original inline markup. The final article on
 * the page has no separator column, so it is optional.
 */
export default function PressArticleRow({
  row,
  imageColumn,
  textColumn,
  separatorColumn,
  href,
  backgroundUrl,
  placeholderSrc,
  children,
}: PressArticleRowProps) {
  return (
    <div
      className={`fusion-fullwidth fullwidth-box fusion-builder-row-${row} fusion-flex-container nonhundred-percent-fullwidth non-hundred-percent-height-scrolling`}
      style={{
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0,
        flexWrap: "wrap",
      }}
    >
      <div
        className="fusion-builder-row fusion-row fusion-flex-align-items-stretch fusion-flex-content-wrap"
        style={{
          maxWidth: 1248,
          marginLeft: "calc(-4% / 2 )",
          marginRight: "calc(-4% / 2 )",
        }}
      >
        <div
          className={`fusion-layout-column fusion_builder_column fusion-builder-column-${imageColumn} fusion_builder_column_1_3 1_3 fusion-flex-column fusion-column-inner-bg-wrapper`}
          style={{
            width: "33.3333333333%",
            marginTop: 0,
            paddingRight: "5.76%",
            marginBottom: 20,
            paddingLeft: "5.76%",
          }}
        >
          <span className="fusion-column-inner-bg hover-type-none">
            <a
              className="fusion-column-anchor"
              href={href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="fusion-column-inner-bg-image" />
            </a>
          </span>
          <div
            className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column fusion-empty-column-bg-image fusion-column-has-bg-image"
            data-bg-url={backgroundUrl}
          >
            <img
              loading="lazy"
              decoding="async"
              className="fusion-empty-dims-img-placeholder fusion-no-large-visibility fusion-no-medium-visibility"
              src={placeholderSrc}
              alt="6529.io"
            />
          </div>
        </div>
        <div
          className={`fusion-layout-column fusion_builder_column fusion-builder-column-${textColumn} fusion_builder_column_2_3 2_3 fusion-flex-column`}
          style={{
            backgroundSize: "cover",
            width: "66.6666666667%",
            marginTop: 0,
            paddingRight: "2.88%",
            marginBottom: 20,
            paddingLeft: "2.88%",
          }}
        >
          <div className="fusion-column-wrapper fusion-column-has-shadow fusion-flex-justify-content-flex-start fusion-content-layout-column">
            {children}
          </div>
        </div>
        {separatorColumn !== undefined && (
          <div
            className={`fusion-layout-column fusion_builder_column fusion-builder-column-${separatorColumn} fusion_builder_column_1_1 1_1 fusion-flex-column`}
            style={{
              paddingTop: 10,
              paddingBottom: 10,
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
                className="fusion-separator fusion-full-width-sep"
                style={{
                  alignSelf: "center",
                  marginLeft: "auto",
                  marginRight: "auto",
                  width: "100%",
                }}
              >
                <div
                  className="fusion-separator-border sep-single sep-solid"
                  style={{
                    borderColor: "#e2e2e2",
                    borderTopWidth: 1,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
