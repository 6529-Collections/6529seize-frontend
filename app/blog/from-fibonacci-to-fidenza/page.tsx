import { getAppMetadata } from "@/components/providers/metadata";
import WordPressLegacyAssets, { WordPressLegacyFooter } from "@/components/legacy-wordpress/WordPressLegacyAssets";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildArticlePageJsonLd } from "@/lib/structured-data/article";
import type { Metadata } from "next";
export default function BlogFromFibonacciToFidenzaPage() {
  return (
    <div>
      <JsonLdScript
        data={buildArticlePageJsonLd({
          path: "/blog/from-fibonacci-to-fidenza",
          headline:
            "From Fibonacci to Fidenza: The Golden Ratio in Generative Art",
          description:
            "A look at the golden ratio, Fibonacci, Fidenza, and generative art.",
          image:
            "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Fidenza-313.png",
          author: "Sabrina Khan",
          datePublished: "2022-11-10T05:29:37+00:00",
          dateModified: "2022-11-15T18:08:28+00:00",
          section: "Blog",
        })}
      />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      {/* This site is optimized with the Yoast SEO plugin v23.9 - https://yoast.com/wordpress/plugins/seo/ */}
      <title>FROM FIBONACCI TO FIDENZA - 6529.io</title>
      <meta
        name="description"
        content="From Fibonacci to Fidenza: So piqued are we by patterns in nature, seduced by symmetry in art, that we are almost already primed to be aficionados of generative art"
      />
      <link rel="canonical" href="/blog/from-fibonacci-to-fidenza/" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content="article" />
      <meta property="og:title" content="FROM FIBONACCI TO FIDENZA - 6529.io" />
      <meta
        property="og:description"
        content="From Fibonacci to Fidenza: So piqued are we by patterns in nature, seduced by symmetry in art, that we are almost already primed to be aficionados of generative art"
      />
      <meta property="og:url" content="/blog/from-fibonacci-to-fidenza/" />
      <meta property="og:site_name" content="6529.io" />
      <meta
        property="article:published_time"
        content="2022-11-10T05:29:37+00:00"
      />
      <meta
        property="article:modified_time"
        content="2022-11-15T18:08:28+00:00"
      />
      <meta
        property="og:image"
        content="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/XCOPY-summer-scaled.jpg"
      />
      <meta property="og:image:width" content={"1455"} />
      <meta property="og:image:height" content={"2560"} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta name="author" content="Sabrina Khan" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:image"
        content="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/XCOPY-summer-scaled.jpg"
      />
      <meta name="twitter:creator" content="@om100m" />
      <meta name="twitter:site" content="@om100m" />
      <meta name="twitter:label1" content="Written by" />
      <meta name="twitter:data1" content="Sabrina Khan" />
      <meta name="twitter:label2" content="Est. reading time" />
      <meta name="twitter:data2" content="20 minutes" />
      {/* / Yoast SEO plugin. */}
      <link rel="dns-prefetch" href="//stats.wp.com" />
      <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
      <link
        rel="alternate"
        type="application/rss+xml"
        title="6529.io » Feed"
        href="/feed/"
      />
      <link
        rel="alternate"
        type="application/rss+xml"
        title="6529.io » Comments Feed"
        href="/comments/feed/"
      />
      <link
        rel="alternate"
        type="application/rss+xml"
        title="6529.io » FROM FIBONACCI TO FIDENZA Comments Feed"
        href="/blog/from-fibonacci-to-fidenza/feed/"
      />
      <meta
        name="description"
        content="From Fibonacci to Fidenza 

by Sabrina Khan 

There is an autonomous artist among us, a faceless, soulless creature, who, at the hands of talented programmers, is being employed to create seductive and thought-provoking pieces of generated art. In many ways, this autonomous machine is nothing new, having"
      />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="6529.io" />
      <meta property="og:title" content="FROM FIBONACCI TO FIDENZA - 6529.io" />
      <meta
        property="og:description"
        content="From Fibonacci to Fidenza 

by Sabrina Khan 

There is an autonomous artist among us, a faceless, soulless creature, who, at the hands of talented programmers, is being employed to create seductive and thought-provoking pieces of generated art. In many ways, this autonomous machine is nothing new, having"
      />
      <meta property="og:url" content="/blog/from-fibonacci-to-fidenza/" />
      <meta
        property="article:published_time"
        content="2022-11-10T05:29:37-05:00"
      />
      <meta
        property="article:modified_time"
        content="2022-11-15T18:08:28-05:00"
      />
      <meta name="author" content="Sabrina Khan" />
      <meta
        property="og:image"
        content="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Fidenza-313.png"
      />
      <meta property="og:image:width" content={"600"} />
      <meta property="og:image:height" content={"720"} />
      <meta property="og:image:type" content="image/png" />
      <WordPressLegacyAssets
        fusionCssHref="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/fusion-styles/c38db8bb1e7b256db5f81185ac0dbf47.min.css?ver=3.11.11"
        postJsonHref="/wp-json/wp/v2/posts/1971"
        shortlinkHref="/?p=1971"
        oembedTargetUrl="/blog/from-fibonacci-to-fidenza/"
      />
      {/* Google tag (gtag.js) */}
      <a className="skip-link screen-reader-text" href="#content">
        Skip to content
      </a>
      <div id="boxed-wrapper">
        <div id="wrapper" className="fusion-wrapper">
          <div id="home" style={{ position: "relative", top: "-1px" }} />
          <div
            id="sliders-container"
            className="fusion-slider-visibility"
          ></div>
          <main
            id="main"
            className="clearfix"
            style={{ minHeight: "100vh", padding: 30 }}
          >
            <div className="fusion-row">
              <section id="content" style={{ width: "100%" }}>
                <article
                  id="post-1971"
                  className="post post-1971 type-post status-publish format-standard has-post-thumbnail hentry category-blog"
                >
                  <span className="entry-title" style={{ display: "none" }}>
                    FROM FIBONACCI TO FIDENZA
                  </span>
                  <div className="post-content">
                    <div
                      className="fusion-fullwidth fullwidth-box fusion-builder-row-1 fusion-flex-container has-pattern-background has-mask-background nonhundred-percent-fullwidth non-hundred-percent-height-scrolling"
                      style={{
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        borderBottomLeftRadius: 0,
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
                        <div
                          className="fusion-layout-column fusion_builder_column fusion-builder-column-0 fusion_builder_column_1_1 1_1 fusion-flex-column"
                          style={{
                            paddingTop: 25,
                            paddingBottom: 25,
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
                              className="fusion-image-element"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-1 hover-type-none">
                                <a
                                  className="fusion-no-lightbox"
                                  href="/"
                                  target="_blank"
                                  aria-label="6529-header-logo-beta"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={100}
                                    height={114}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/6529-header-logo-beta.png"
                                    alt="6529.io"
                                    className="img-responsive wp-image-259"
                                  />
                                </a>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className="fusion-fullwidth fullwidth-box fusion-builder-row-2 fusion-flex-container has-pattern-background has-mask-background nonhundred-percent-fullwidth non-hundred-percent-height-scrolling"
                      style={{
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        borderBottomLeftRadius: 0,
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
                        <div
                          className="fusion-layout-column fusion_builder_column fusion-builder-column-1 fusion_builder_column_1_1 1_1 fusion-flex-column"
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
                              className="fusion-text fusion-text-1"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>From Fibonacci to Fidenza</b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-2"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>
                                  by{" "}
                                  <a
                                    href="https://twitter.com/sabrinaxdoll"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Sabrina Khan
                                  </a>
                                </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-3"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  There is an autonomous artist among us, a
                                  faceless, soulless creature, who, at the hands
                                  of talented programmers, is being employed to
                                  create seductive and thought-provoking pieces
                                  of generated art. In many ways, this
                                  autonomous machine is nothing new, having been
                                  used to create generative art since the
                                  sixties, but now, thanks to superior
                                  technologies and the explosion of this type of
                                  art in the digital art landscape, questions
                                  arise as to whether or not generative art can
                                  rank alongside the masterpieces of traditional
                                  great art.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  As generative pieces are created by artists
                                  like{" "}
                                  <a
                                    href="https://twitter.com/tylerxhobbs"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Tyler Hobbs
                                  </a>
                                  , who dazzled the art scene with his{" "}
                                  <a
                                    href="https://tylerxhobbs.com/fidenza"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Fidenza
                                  </a>{" "}
                                  collection, we are left in the afterglow with
                                  many questions, the answers of which will
                                  shape the trajectory of generative art: is the
                                  computer the artist or is the artist the one
                                  who feeds the computer the custom created
                                  algorithm? Is art rendered by a machine true
                                  art? Can this generated art move us and evoke
                                  the same emotions affected by traditional
                                  paintings?{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Opinions will differ, but due to the presence
                                  of mathematically rendered elements within
                                  both nature's beauty as well as in great
                                  masterworks of traditional painters, there is
                                  something innately within us that appreciates
                                  and is affected by these renderings,
                                  suggesting that our relationship to generative
                                  art is a natural one, and our acceptance of it
                                  as true art is essential.&nbsp;{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-4"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>We Are All in Love With Fibonacci </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-5"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Our relationship to mathematically rendered
                                  beauty goes back to the year 1202, when
                                  Leonardo Pisano Bigollo sojourned one sultry
                                  summer through the Middle East and was
                                  captivated by mathematical ideas that had come
                                  from India. Dizzied with numbers, he went home
                                  to Italy and wrote one question:{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  “If a pair of rabbits is placed in an enclosed
                                  area, how many rabbits will be born there if
                                  we assume that every month a pair of rabbits
                                  produces another pair, and that rabbits begin
                                  to bear young two months after their
                                  birth?”{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  This innocuous question gave birth to the
                                  Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13,
                                  21…where the next number is found by adding up
                                  the two numbers before it and so on forever.
                                  Consequently, this startling sequence spiraled
                                  into the far depths of mathematics and
                                  computer science, but also, into the world of
                                  nature and art.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Scientists and mathematicians alike were
                                  baffled to find that this very same sequence
                                  was in operation within nature itself. In an
                                  orchard, choose any tree, elm, cherry, beech,
                                  poplar, weeping willow, twist a branch in your
                                  hand, count the leaves and the number of turns
                                  it takes along the branch all the way back to
                                  the one directly above the original leaf. Both
                                  numbers will be from the Fibonacci sequence.
                                  Find Fibonacci in a{" "}
                                  <a
                                    href="https://www.youtube.com/watch?v=z9d1mxgZ0ag"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    sunflower
                                  </a>
                                  .{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-2 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/sunflower-400x300.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[5c7d2fbba7a7340ceb1]"
                                  data-title="Photo credit: Esdras Calderan/Wikipedia (CC BY 2.0)"
                                  title="Photo credit: Esdras Calderan/Wikipedia (CC BY 2.0)"
                                >
                                  <img
                                    loading="lazy"
                                    fetchPriority="high"
                                    decoding="async"
                                    width={400}
                                    height={300}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/sunflower-400x300.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1992"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/sunflower-200x150.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/sunflower-400x300.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/sunflower-600x450.jpg 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/sunflower-800x600.jpg 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/sunflower.jpg 870w"
                                    sizes="(max-width: 640px) 100vw, 400px"
                                  />
                                </a>
                              </span>
                            </div>
                            <div
                              className="fusion-text fusion-text-6"
                              style={{ color: "#000000" }}
                            >
                              <p style={{ textAlign: "center" }}>
                                Sunflower (
                                <a
                                  href="https://commons.wikimedia.org/wiki/File:Espiral_de_semillas_de_Girasol.jpg"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  source
                                </a>
                                )
                              </p>
                            </div>
                            <div
                              className="fusion-image-element"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-3 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Sunflower-Fibonacci-400x400.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[98e13609051689aff44]"
                                  data-title="Source: momath.org"
                                  title="Source: momath.org"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={400}
                                    height={400}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Sunflower-Fibonacci-400x400.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1991"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Sunflower-Fibonacci-200x200.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Sunflower-Fibonacci-400x400.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Sunflower-Fibonacci.jpg 600w"
                                    sizes="(max-width: 640px) 100vw, 400px"
                                  />
                                </a>
                              </span>
                            </div>
                            <div
                              className="fusion-text fusion-text-7"
                              style={{ color: "#000000" }}
                            >
                              <p style={{ textAlign: "center" }}>
                                55 Spirals (
                                <a
                                  href="https://momath.org/home/fibonacci-numbers-of-sunflower-seed-spirals/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  source
                                </a>
                                )
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-8"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  At its core, the golden ratio is resplendent,
                                  featuring 55 spirals going in one way, 89 in
                                  the other. This pattern is ubiquitous, in the
                                  nature we see, the hurricanes from which we
                                  flee, the shells on the beach. It exists
                                  within us in our DNA strands and in the
                                  cochlea of our inner ear, and even beyond in
                                  the glittering construction of the spiral
                                  galaxies and Milky Way. Nature employs this
                                  perfect mathematical sequence and we are
                                  enamored by the results.&nbsp;
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-9"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>
                                  Da Vinci and Dali Join The Fibonacci Fest{" "}
                                </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-10"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Inspired by nature's mathematically achieved
                                  beauty, master artists saw the sequence as a
                                  muse for their works. In 1495, Leonardo Da
                                  Vinci painted a mural for the church that
                                  would convey the exact moment when Jesus
                                  announced that one of his apostles would
                                  betray him: “The Last Supper.”{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Once of Da Vinci's most celebrated works,
                                  famed for capturing a cornucopia of human
                                  emotion at the very zenith of a religious
                                  turning point, the piece has captivated
                                  audiences for centuries and has been hailed as
                                  a perfect painting. In fact, it is perfectly
                                  rendered as the architecture shows golden
                                  ratios in abundance throughout the work, as
                                  the table, ornamental shields, windows, and
                                  position of the disciples to Jesus all follow
                                  the Divine Proportion.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  The painting features the numbers of the
                                  Fibonacci series: one table, one Jesus central
                                  figure, two walls, three windows with three
                                  figures in three groups, figures in five
                                  groups, eight wall panels, eight table legs,
                                  and overall thirteen individual figures. This
                                  perfect mathematically rendered and
                                  proportionate piece speaks to our minds and to
                                  our souls, for there is something innately
                                  within us that responds to this symmetry, both
                                  in nature and in the artist's creation.{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-4 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/last-supper-golden-ratio-400x283.gif"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[3d8b8892ae324e847f3]"
                                  data-title="The Last Supper"
                                  title="The Last Supper"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={400}
                                    height={283}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/last-supper-golden-ratio-400x283.gif"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1994"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/last-supper-golden-ratio-200x141.gif 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/last-supper-golden-ratio-400x283.gif 400w"
                                    sizes="(max-width: 640px) 100vw, 400px"
                                  />
                                </a>
                              </span>
                            </div>
                            <div
                              className="fusion-text fusion-text-11"
                              style={{ color: "#000000" }}
                            >
                              <p style={{ textAlign: "center" }}>
                                <em>Last Supper</em>, Leonardo Da Vinci&nbsp;(
                                <a
                                  href="https://www.phimatrix.com/art-composition-golden-ratio/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  source)
                                </a>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-12"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Indisputably, there is a relationship between
                                  nature and mathematics, between the things we
                                  perceive beautiful and the way in which they
                                  are sequentially generated by the finite
                                  control and constrictions of numbers. Da Vinci
                                  employed the Fibonacci sequence in 1495 and
                                  Salvador Dali explored it in 1949.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Dali understood this relationship and wrote in
                                  his book{" "}
                                </span>
                                <i>
                                  <span style={{ fontWeight: 400 }}>
                                    50 Secrets of Magic Craftsmanship
                                  </span>
                                </i>
                                <span style={{ fontWeight: 400 }}>: </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>“</span>
                                <span style={{ fontWeight: 400 }}>
                                  You must, especially as a young man, use
                                  geometry as a guide to symmetry in the
                                  composition of your works. I know that more or
                                  less romantic painters argue that these
                                  mathematical scaffolds kill the artist's
                                  inspiration, giving him too much to think and
                                  reflect.”{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  In “Leda Atomica” Dali uses the divine
                                  proportion to set Leda and the swan within a
                                  pentagon calculated with the golden
                                  ratio.{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-5 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Leda_atomica.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[fc96450ee9ab05c65ba]"
                                  data-title="Leda_atomica"
                                  title="Leda_atomica"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={274}
                                    height={363}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Leda_atomica.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1996"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Leda_atomica-200x265.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Leda_atomica.jpg 274w"
                                    sizes="(max-width: 640px) 100vw, 274px"
                                  />
                                </a>
                              </span>
                            </div>
                            <div
                              className="fusion-text fusion-text-13"
                              style={{ color: "#000000" }}
                            >
                              <p style={{ textAlign: "center" }}>
                                <em>Leda Atómica</em>&nbsp;(<em>Atomic Leda</em>
                                ), Salvador Dalí, 1949
                              </p>
                            </div>
                            <div
                              className="fusion-image-element"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-6 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/leda-atomica-divine-235x300.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[5e417e2acf14f62c241]"
                                  data-title="Studies of Leda Atómica, 1947"
                                  title="Studies of Leda Atómica, 1947"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={235}
                                    height={300}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/leda-atomica-divine-235x300.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1998"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/leda-atomica-divine-200x255.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/leda-atomica-divine-400x511.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/leda-atomica-divine.jpg 548w"
                                    sizes="(max-width: 640px) 100vw, 235px"
                                  />
                                </a>
                              </span>
                            </div>
                            <div
                              className="fusion-text fusion-text-14"
                              style={{ color: "#000000" }}
                            >
                              <p style={{ textAlign: "center" }}>
                                Studies of&nbsp;<em>Leda Atómica</em>, 1947
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-15"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Dali believed that mathematical equations and
                                  carefully calculated renderings, when merged
                                  with artistic creativity, could create
                                  glorious artforms. A set of numbers and
                                  equations set by nature can produce a
                                  sunflower, the mathematical calculations of
                                  proportions and ratio produces “The Last
                                  Supper”, and today, the algorithmic input
                                  given to a computer can achieve a masterwork
                                  of artistic creation, like Fidenza.{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-16"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>
                                  Falling for Fidenza, an Inevitable Love
                                  Story{" "}
                                </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-17"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Generative artist and coder Tyler Hobbs
                                  understands the relationship that is at the
                                  heart of our love of mathematically rendered
                                  design, as{" "}
                                </span>
                                <span style={{ fontWeight: 400 }}>
                                  he begins his art process by developing an
                                  algorithmic code for his generative pieces. Of
                                  his codes, he states:{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  “Often, these strike a balance between the
                                  cold, hard structure that computers excel at,
                                  and the messy, organic chaos we can observe in
                                  the natural world around us.”
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  This idea is brought to fruition in his
                                  magnificent Fidenza collection.{" "}
                                </span>
                                <span style={{ fontWeight: 400 }}>
                                  Hobbs employs flow fields to create his
                                  pieces, and has unlocked the ways in which
                                  they produce an endless and unpredictable
                                  array of curves, turns, and spirals.{" "}
                                </span>
                                <span style={{ fontWeight: 400 }}>
                                  In each piece, there is a sense of
                                  continuation, eternity captured on canvas, as
                                  if somehow the continual loop of forever was
                                  bottled and stored by the artist for the
                                  enjoyment of the collector.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  This same feature is found in the pearlescent
                                  structure of nautilus shells, giving these
                                  specimens a riveting appearance of embodying
                                  the very shape of eternity. Furthermore, it is
                                  no coincidence that this sense of eternity
                                  captured by mathematics was what Da Vinci used
                                  to convey a timeless tale of immortality and
                                  eternal faith in his most revered
                                  painting.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  As mortals, we share a connection to this
                                  sense of eternity, given that we are each a
                                  component within the continual life flow of
                                  existence. This visual eternity is celebrated
                                  in Fidenza, as with a masterful manipulation
                                  of scale, an endless array of generative
                                  possibilities are the outcome, some
                                  surprising, some startling.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  In Fidenza #313, The Tulip, this sense of
                                  eternity and infinity is celebrated in the
                                  blooming arms and gentle curves of rectangles
                                  resplendent in proportioned perfection.
                                  Varying in color, shape, and size, these
                                  shapes travel endlessly, caught in an infinite
                                  loop of life and death and rebirth.&nbsp;
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-7 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Fidenza-313-400x480.png"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[3e6fcc24e5a6bfc4892]"
                                  data-title="Fidenza #313"
                                  title="Fidenza #313"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={400}
                                    height={480}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Fidenza-313-400x480.png"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1017"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Fidenza-313-200x240.png 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Fidenza-313-400x480.png 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Fidenza-313.png 600w"
                                    sizes="(max-width: 640px) 100vw, 400px"
                                  />
                                </a>
                              </span>
                            </div>
                            <div
                              className="fusion-text fusion-text-18"
                              style={{ color: "#000000" }}
                            >
                              <p style={{ textAlign: "center" }}>
                                Fidenza #313, “The Tulip”
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-19"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  The same awe-inspiring elements that entrance
                                  us when we dream of spiral galaxies and wander
                                  through labyrinths are captured in nearly all
                                  Fidenza pieces, but most notably in The Tulip,
                                  affirmed by{" "}
                                  <a
                                    href="https://twitter.com/punk6529"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    p
                                  </a>
                                </span>
                                <span style={{ fontWeight: 400 }}>
                                  <a href="https://twitter.com/punk6529">
                                    unk6529:
                                  </a>
                                  &nbsp;{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  “I believe Fidenza #313 (The Tulip) is among
                                  the very very very most definitive Fidenzas.
                                  By extension, The Tulip is one of the most
                                  important pieces in
                                </span>{" "}
                                <a href="https://twitter.com/artblocks_io">
                                  <span style={{ fontWeight: 400 }}>
                                    Art Blocks
                                  </span>
                                </a>
                                <span style={{ fontWeight: 400 }}>
                                  {" "}
                                  history and, further, in early on-chain
                                  generative art. Time will tell if history
                                  agrees with me.”
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-20"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>
                                  Hobbs Blazes the Trail for Generative Art{" "}
                                </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-21"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  For many decades, generative art has been a
                                  secret pastime of programmers, not a form that
                                  has been embraced by the art community or seen
                                  as true art, due to its technical conception.
                                  It is easy to dismiss its lack of emotional
                                  value because the artist who creates it sits
                                  distantly from the subject, entering code to
                                  produce it, rather than using brushes or
                                  digital pencils.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Though Da Vinci and Dali were not creating
                                  generative art, strictly speaking, they were
                                  generating pieces that were constricted by
                                  mathematical equations which bound the
                                  parameters of the art, similar to the ways in
                                  which computer algorithms do for generative
                                  pieces. Nevertheless, Da Vinci and Dali may
                                  have employed mathematical equations, but in
                                  the end they tangibly held the brushes that
                                  enchanted the canvas with the images that are
                                  immortal in our collective memory.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Anything that deviated from this method was
                                  not viewed as true art, and sometimes still
                                  meets resistance. Hobbs challenges this
                                  tradition with his tremendously moving and
                                  glorious pieces. Fidenza is the progeny of
                                  perfect programming and the artist's
                                  sensibility. Through his art, Hobbs proves
                                  that emotion can be evoked by generated pieces
                                  if the artist maintains a sense of what is
                                  moving and what is enduring when creating the
                                  code and producing the art.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Hobbs states: “That is the moment when the
                                  artwork must succeed. If an intimate
                                  relationship between the viewer and the
                                  artwork is not established here, nothing else
                                  matters.” It is his mission as a generative
                                  artist to create this connection between art
                                  and viewer, when the art has been created via
                                  a computer program with his algorithmic
                                  instruction.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Furthermore, it is a step toward cementing
                                  generative art within the canon of great art,
                                  allowing something rendered by a machine to
                                  evoke within us the same soul shifting effects
                                  that traditional art can.{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-8 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-938-400x480.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[b001ed6cf50d3e5f066]"
                                  data-title="Fidenza #938"
                                  title="Fidenza #938"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={400}
                                    height={480}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-938-400x480.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1999"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-938-200x240.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-938-400x480.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-938-600x720.jpg 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-938-800x960.jpg 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-938-1200x1440.jpg 1200w"
                                    sizes="(max-width: 640px) 100vw, 1200px"
                                  />
                                </a>
                              </span>
                            </div>
                            <div
                              className="fusion-text fusion-text-22"
                              style={{ color: "#000000" }}
                            >
                              <p style={{ textAlign: "center" }}>
                                Fidenza #938, “God Mode”
                              </p>
                            </div>
                            <div
                              className="fusion-image-element"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-9 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-772-400x480.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[9c5878235a5495c2d45]"
                                  data-title="Fidenza #772"
                                  title="Fidenza #772"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={400}
                                    height={480}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-772-400x480.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-2000"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-772-200x240.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-772-400x480.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-772-600x720.jpg 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-772-800x960.jpg 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-772.jpg 1000w"
                                    sizes="(max-width: 640px) 100vw, 400px"
                                  />
                                </a>
                              </span>
                            </div>
                            <div
                              className="fusion-text fusion-text-23"
                              style={{ color: "#000000" }}
                            >
                              <p style={{ textAlign: "center" }}>
                                Fidenza #772
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-24"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>Marriage of Man and Machine </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-25"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Our love of this kind of art is already
                                  innate, as we are enamored by the mathematical
                                  sequences that nature has generated for us:
                                  perfectly spaced disc florets at the heart of
                                  a sunflower head, the perfectly positioned
                                  hands of Da Vinci's Jesus placed within the
                                  golden ratio triangle of his form, and the
                                  sumptuous, elegant curves of Fidenza
                                  pieces.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  We are predisposed with an inherent love for a
                                  mathematically perfect rendered element, and
                                  that is why there is already a deep connection
                                  between that which is computationally rendered
                                  and that which is artistically beautiful and
                                  admired. To find that balance is to find the
                                  key to unlocking exquisite art and to usher in
                                  generative art as a new kind of art that can
                                  hold its place amongst the greats.
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-10 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-612-400x480.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[76b82e30fee207ba606]"
                                  data-title="Fidenza #612"
                                  title="Fidenza #612"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={400}
                                    height={480}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-612-400x480.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-2001"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-612-200x240.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-612-400x480.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-612-600x720.jpg 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-612-800x960.jpg 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/11/Fidenza-612-1200x1440.jpg 1200w"
                                    sizes="(max-width: 640px) 100vw, 1200px"
                                  />
                                </a>
                              </span>
                            </div>
                            <div
                              className="fusion-text fusion-text-26"
                              style={{ color: "#000000" }}
                            >
                              <p style={{ textAlign: "center" }}>
                                Fidenza #612
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-27"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                For the soulless autonomous computer, Hobbs is
                                its soul, as all artists must be, breathing life
                                and emotion into these digital renderings. With
                                his creation of a code and his imagined vision
                                of various traits, textures, colors, spatial
                                organization, he inspires the machine to
                                generate all of the possible versions. Sometimes
                                it is what he expects, sometimes it is
                                surprising. In this way, generative artists
                                create a marriage between man and machine to
                                create meaningful and moving works of art.
                              </p>
                              <p>
                                As our world exists more and more on a digital
                                landscape, it is essential that as we embrace
                                the outputs from our exemplary and powerful
                                technology, we impress upon it our humanity.
                              </p>
                              <p>
                                <em>
                                  Liked this article? Don't forget to check out{" "}
                                  <a
                                    href="/blog/a-tale-of-two-artists/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <b>
                                      A Tale of Two Artists: Van Gogh and XCOPY
                                    </b>
                                  </a>
                                  !
                                </em>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="vcard rich-snippet-hidden">
                    <span className="fn">
                      <a
                        href="/author/ladysabrina/"
                        title="Posts by Sabrina Khan"
                        rel="author"
                      >
                        Sabrina Khan
                      </a>
                    </span>
                  </span>
                  <span className="updated rich-snippet-hidden">
                    2022-11-15T13:08:28-05:00
                  </span>
                </article>
              </section>
            </div>{" "}
            {/* fusion-row */}
          </main>{" "}
          {/* #main */}
          {/* fusion-footer */}
        </div>{" "}
        {/* wrapper */}
      </div>{" "}
      {/* #boxed-wrapper */}
      <WordPressLegacyFooter useButtons />
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "FROM FIBONACCI TO FIDENZA - 6529.io" });
}
