import { getAppMetadata } from "@/components/providers/metadata";
import WordPressLegacyAssets, { WordPressLegacyFooter } from "@/components/legacy-wordpress/WordPressLegacyAssets";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildArticlePageJsonLd } from "@/lib/structured-data/article";
import type { Metadata } from "next";
export default function BlogATaleOfTwoArtistsPage() {
  return (
    <div>
      <JsonLdScript
        data={buildArticlePageJsonLd({
          path: "/blog/a-tale-of-two-artists",
          headline: "A Tale of Two Artists - Van Gogh and XCOPY",
          description:
            "A story of persistence, perseverance and belief. Two artists who painted for a decade each before fame found them.",
          image:
            "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/XCOPY-summer-scaled.jpg",
          author: "Sabrina Khan",
          datePublished: "2022-10-12T06:38:11+00:00",
          dateModified: "2022-11-03T17:07:34+00:00",
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
      <title>A Tale of Two Artists - Van Gogh and XCOPY - 6529.io</title>
      <meta
        name="description"
        content="A story of persistence, perseverance and belief. Two artists who painted for a decade each before fame found them. But only one lived to enjoy it. Read about Van Gogh and XCOPY."
      />
      <link rel="canonical" href="/blog/a-tale-of-two-artists/" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content="article" />
      <meta
        property="og:title"
        content="A Tale of Two Artists - Van Gogh and XCOPY - 6529.io"
      />
      <meta
        property="og:description"
        content="A story of persistence, perseverance and belief. Two artists who painted for a decade each before fame found them. But only one lived to enjoy it. Read about Van Gogh and XCOPY."
      />
      <meta property="og:url" content="/blog/a-tale-of-two-artists/" />
      <meta property="og:site_name" content="6529.io" />
      <meta
        property="article:published_time"
        content="2022-10-12T06:38:11+00:00"
      />
      <meta
        property="article:modified_time"
        content="2022-11-03T17:07:34+00:00"
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
      <meta name="twitter:data2" content="19 minutes" />
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
        title="6529.io » A Tale of Two Artists – Van Gogh and XCOPY Comments Feed"
        href="/blog/a-tale-of-two-artists/feed/"
      />
      <meta
        name="description"
        content="A Tale of Two Artists: Van Gogh and XCOPY 

by Sabrina Khan 

It is rare to meet someone who does not know Vincent Van Gogh. The ubiquity of his swirling starry scape resonates in the hearts of millions. 

So, it is startling to imagine that"
      />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="6529.io" />
      <meta
        property="og:title"
        content="A Tale of Two Artists - Van Gogh and XCOPY - 6529.io"
      />
      <meta
        property="og:description"
        content="A Tale of Two Artists: Van Gogh and XCOPY 

by Sabrina Khan 

It is rare to meet someone who does not know Vincent Van Gogh. The ubiquity of his swirling starry scape resonates in the hearts of millions. 

So, it is startling to imagine that"
      />
      <meta property="og:url" content="/blog/a-tale-of-two-artists/" />
      <meta
        property="article:published_time"
        content="2022-10-12T06:38:11-05:00"
      />
      <meta
        property="article:modified_time"
        content="2022-11-03T17:07:34-05:00"
      />
      <meta name="author" content="Sabrina Khan" />
      <meta
        property="og:image"
        content="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/XCOPY-summer-scaled.jpg"
      />
      <meta property="og:image:width" content={"1455"} />
      <meta property="og:image:height" content={"2560"} />
      <meta property="og:image:type" content="image/jpeg" />
      <WordPressLegacyAssets
        fusionCssHref="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/fusion-styles/c38db8bb1e7b256db5f81185ac0dbf47.min.css?ver=3.11.11"
        postJsonHref="/wp-json/wp/v2/posts/1825"
        shortlinkHref="/?p=1825"
        oembedTargetUrl="/blog/a-tale-of-two-artists/"
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
                  id="post-1825"
                  className="post post-1825 type-post status-publish format-standard has-post-thumbnail hentry category-blog"
                >
                  <span className="entry-title" style={{ display: "none" }}>
                    A Tale of Two Artists – Van Gogh and XCOPY
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
                                <b>A Tale of Two Artists: Van Gogh and XCOPY</b>
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
                                  It is rare to meet someone who does not know
                                  Vincent Van Gogh. The ubiquity of his swirling
                                  starry scape resonates in the hearts of
                                  millions.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  So, it is startling to imagine that the artist
                                  himself knew nothing of this posthumous fame.
                                  In his lifetime, he was virtually unknown and
                                  impoverished, floating through a morose and
                                  tortured existence. This travesty was due
                                  largely in part to the fact that in Van Gogh's
                                  world, he had no means to get his own work out
                                  there for the world to see. No such mechanism
                                  was in place that favored the artist and
                                  allowed for the self promotion and widespread
                                  distribution that would allow him to know his
                                  own fame in his lifetime, though he produced a
                                  staggering 2100 pieces.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  A parallel exists between Van Gogh and London
                                  based artist{" "}
                                  <a
                                    href="https://twitter.com/XCOPYART"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    XCOPY
                                  </a>
                                  , who, like Van Gogh, is highly prolific,
                                  churning out gifs for the past decade, when
                                  his audience was only a niche group of
                                  followers. But the fates of the two artists
                                  differ because of the innovations and
                                  technology that are in place in our world
                                  today. The mechanisms in place which exist in
                                  the digital art revolution of today, allow for
                                  XCOPY to reach great heights and enjoy the
                                  ascent, anonymous and very much alive.{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element awb-imageframe-style awb-imageframe-style-below awb-imageframe-style-2"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-2 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-Self-Portrait-1889-600x730.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[557c1e9fab4a91df2e2]"
                                  data-title="Vincent Van Gogh Self-Portrait (1889)"
                                  title="Vincent Van Gogh Self-Portrait (1889)"
                                >
                                  <img
                                    loading="lazy"
                                    fetchPriority="high"
                                    decoding="async"
                                    width={600}
                                    height={730}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-Self-Portrait-1889-600x730.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1833"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-Self-Portrait-1889-200x243.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-Self-Portrait-1889-400x486.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-Self-Portrait-1889-600x730.jpg 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-Self-Portrait-1889-800x973.jpg 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-Self-Portrait-1889.jpg 1200w"
                                    sizes="(max-width: 640px) 100vw, 600px"
                                  />
                                </a>
                              </span>
                              <div className="awb-imageframe-caption-container">
                                <div className="awb-imageframe-caption">
                                  <h2 className="awb-imageframe-caption-title">
                                    Vincent Van Gogh Self-Portrait (1889)
                                  </h2>
                                  <p className="awb-imageframe-caption-text">
                                    Vincent Van Gogh Self-Portrait (1889)
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div
                              className="fusion-text fusion-text-4"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>
                                  Van Gogh's Artistic Voice is as Severed from
                                  Him as His Ear{" "}
                                </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-5"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Vincent Van Gogh became an artist proper at
                                  age 27. For the next decade of his life, on a
                                  steady diet of coffee and cigarettes, he
                                  dedicated himself to painting.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  In 1885, a Paris art dealer expressed interest
                                  in his work. His brother, Theo, who had taken
                                  on the role of Van Gogh's promoter, said that
                                  Van Gogh's piece was too dark and would not be
                                  suitable for exhibition. Though Van Gogh
                                  believed “The Potato Eaters” was the best work
                                  he had done up to that point, there was no way
                                  for him to promote it.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  In fact, Van Gogh had no voice as an artist
                                </span>
                                <i>
                                  <span style={{ fontWeight: 400 }}>, </span>
                                </i>
                                <span style={{ fontWeight: 400 }}>
                                  and he had to rely upon his brother's own
                                  uneducated tastes to promote his work. Thus,
                                  the piece failed to be seen in the way Van
                                  Gogh had wished.{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element awb-imageframe-style awb-imageframe-style-below awb-imageframe-style-3"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-3 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-The-Potato-Eaters-600x426.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[6791357a364bfa4fa07]"
                                  data-caption="The Potato Eaters"
                                  data-title="The Potato Eaters (1885)"
                                  title="The Potato Eaters (1885)"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={600}
                                    height={426}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-The-Potato-Eaters-600x426.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1837"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-The-Potato-Eaters-200x142.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-The-Potato-Eaters-400x284.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-The-Potato-Eaters-600x426.jpg 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-The-Potato-Eaters-800x568.jpg 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-The-Potato-Eaters-1200x852.jpg 1200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Vincent-Van-Gogh-The-Potato-Eaters.jpg 1280w"
                                    sizes="(max-width: 640px) 100vw, 1200px"
                                  />
                                </a>
                              </span>
                              <div className="awb-imageframe-caption-container">
                                <div className="awb-imageframe-caption">
                                  <h2 className="awb-imageframe-caption-title">
                                    The Potato Eaters (1885)
                                  </h2>
                                  <p className="awb-imageframe-caption-text">
                                    The Potato Eaters (1885)
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div
                              className="fusion-text fusion-text-6"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>Escape to Arles</b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-7"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Frustrated by the bustle of city life, Van
                                  Gogh retreated to Arles in the South of
                                  France. Inspired by the golden light of the
                                  countryside, his paintings grew brighter and
                                  more prolific, as he encountered the most
                                  creative period of his life, producing more
                                  than 200 paintings.&nbsp;
                                </span>
                              </p>
                              <p>
                                It was in his Yellow House that Van Gogh wanted
                                to start up an artistic community, for he knew
                                the secret to success for an artist was in the
                                connections he developed. Having given up all
                                his other career pursuits, he committed his life
                                to painting and his livelihood depended on
                                selling his work. In a{" "}
                                <a
                                  href="https://vangoghletters.org/vg/letters/let712/letter.html"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  letter to his brother
                                </a>{" "}
                                Van Gogh wrote almost prophetically:
                              </p>
                              <p style={{ textAlign: "center" }}>
                                <em>
                                  “I can do nothing about it if my paintings
                                  don't sell. The day will come, though, when
                                  people will see that they're worth more than
                                  the cost of the paint and my subsistence, very
                                  meagre in fact, that we put into them.”
                                </em>
                              </p>
                              <p>
                                Van Gogh knew what we all know today, that one
                                cannot monetize one's craft without an audience
                                to consume it. One can be an artist in private,
                                but to be an artist recognized by the world, if
                                such is the goal of art, to move, to teach, to
                                inspire, then one must reach one's tentacles out
                                into society. It was in this spirit that he
                                planned to create an artist's commune.
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  However, the first artist who arrived would
                                  unfortunately be the last, as disputes between
                                  them led to Van Gogh charging at his guest
                                  with a razor blade, one which he later used to
                                  sever his own ear, before gifting it to a
                                  prostitute in a nearby brothel. In his
                                  isolated home, far from the city, he had no
                                  connections with other artists, nor with a
                                  community of art lovers. In a solitary gloom
                                  did some of the finest pieces of art emerge,
                                  unseen.{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-8"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>
                                  The “Red-Headed Madman” Loses His Mind Only to
                                  Find His Artistic Genius
                                </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-9"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Unsurprisingly, after his ear severing
                                  episode, he was admitted to the
                                  Saint-Paul-de-Mausole asylum, and it was
                                  within the barred window cells of this
                                  sanctuary that he painted one of his
                                  masterpieces:{" "}
                                </span>
                                <i>
                                  <span style={{ fontWeight: 400 }}>
                                    Starry Night
                                  </span>
                                </i>
                                <span style={{ fontWeight: 400 }}>
                                  . Cloistered in his cell, gazing through the
                                  window bars at the brilliant night sparkling
                                  above a hushed countryside, stirred by the
                                  light of a thousand stars, his soul shrieked
                                  as the fervor and fever of all of his
                                  unfulfilled dreams inspired the production of
                                  a painting that carried him to the great
                                  heights of his artistry and genius, a piece
                                  that endures to this day.{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element awb-imageframe-style awb-imageframe-style-below awb-imageframe-style-4"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-4 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Starry-Night-600x475.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[0b8a7db92c8d7d1ed32]"
                                  data-title="The Starry Night (1889)"
                                  title="The Starry Night (1889)"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={600}
                                    height={475}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Starry-Night-600x475.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1838"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Starry-Night-200x158.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Starry-Night-400x317.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Starry-Night-600x475.jpg 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Starry-Night.jpg 606w"
                                    sizes="(max-width: 640px) 100vw, 600px"
                                  />
                                </a>
                              </span>
                              <div className="awb-imageframe-caption-container">
                                <div className="awb-imageframe-caption">
                                  <h2 className="awb-imageframe-caption-title">
                                    The Starry Night (1889)
                                  </h2>
                                  <p className="awb-imageframe-caption-text">
                                    The Potato Eaters (1885)
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div
                              className="fusion-text fusion-text-10"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Upon his release from the asylum, his final
                                  year of life saw the sale of one painting, The
                                  Red Vineyard, and a bit of twittering about
                                  his art began as he was featured in two art
                                  exhibitions and won some praise from Claude
                                  Monet. In a letter to his brother Van Gogh
                                  writes:{" "}
                                </span>
                              </p>
                              <p style={{ textAlign: "center" }}>
                                <em>
                                  <span style={{ fontWeight: 400 }}>
                                    “I feel a power in me that I must develop, a
                                    fire that I may not put out but must fan,
                                    although I don't know to what outcome it
                                    will lead me, and wouldn't be surprised if
                                    it was a sombre one.”{" "}
                                  </span>
                                </em>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element awb-imageframe-style awb-imageframe-style-below awb-imageframe-style-5"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-5 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Red-Vineyard-600x468.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[42885dc7309149e6330]"
                                  data-title="The Red Vineyard (1888)"
                                  title="The Red Vineyard (1888)"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={600}
                                    height={468}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Red-Vineyard-600x468.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1839"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Red-Vineyard-200x156.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Red-Vineyard-400x312.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Red-Vineyard-600x468.jpg 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/The-Red-Vineyard.jpg 616w"
                                    sizes="(max-width: 640px) 100vw, 600px"
                                  />
                                </a>
                              </span>
                              <div className="awb-imageframe-caption-container">
                                <div className="awb-imageframe-caption">
                                  <h2 className="awb-imageframe-caption-title">
                                    The Red Vineyard (1888)
                                  </h2>
                                  <p className="awb-imageframe-caption-text">
                                    The Potato Eaters (1885)
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div
                              className="fusion-text fusion-text-11"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>
                                  “The Sadness Will Last Forever”– Van Gogh's
                                  Last Words
                                </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-12"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  A somber one, indeed, as all was cut short,
                                  when in July 1890, he walked into a wheat
                                  field and shot himself in the chest. Stumbling
                                  home, he stayed in his room and smoked a pipe
                                  for two days before he died. In many ways, his
                                  life as an artist was a tragic journey of a
                                  genius unrecognized, his glory only understood
                                  posthumously.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  After his death, his sister-in-law, Jo, became
                                  heiress to his entire collection. Wishing to
                                  promote him, she opened a guest house in a
                                  city rife with artists and collectors and
                                  began making connections that helped her enter
                                  the art world. She submitted Van Gogh's work
                                  to an exhibit in Amsterdam and published all
                                  of his private letters. The combination of his
                                  fine work as well as his personal story of a
                                  tortured, poetic soul appealed to the public
                                  imagination and his fame blossomed.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  After Jo's death, Van Gogh's nephew championed
                                  the funding of the Van Gogh museum in
                                  Amsterdam. Today, Van Gogh's paintings are
                                  amongst some of the highest selling paintings
                                  in history: In 1990, his “Portrait of Dr.
                                  Gachet” sold for $82.5 million at
                                  Christie's.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Though famous today, during his lifetime, he
                                  was unobserved by the world, a spark of light
                                  upon the vast golden wheatfields he loved to
                                  paint, which expressed his loneliness with the
                                  eloquence that his words could not.
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element awb-imageframe-style awb-imageframe-style-below awb-imageframe-style-6"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-6 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Portrait-of-Dr.-Gachet-600x738.jpg"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[e32e4255bad4bf3f6e6]"
                                  data-title="Portrait of Dr. Gachet (1890)"
                                  title="Portrait of Dr. Gachet (1890)"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={600}
                                    height={738}
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Portrait-of-Dr.-Gachet-600x738.jpg"
                                    alt="6529.io"
                                    className="img-responsive wp-image-1840"
                                    srcSet="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Portrait-of-Dr.-Gachet-200x246.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Portrait-of-Dr.-Gachet-400x492.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Portrait-of-Dr.-Gachet-600x738.jpg 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Portrait-of-Dr.-Gachet-800x985.jpg 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Portrait-of-Dr.-Gachet.jpg 819w"
                                    sizes="(max-width: 640px) 100vw, 600px"
                                  />
                                </a>
                              </span>
                              <div className="awb-imageframe-caption-container">
                                <div className="awb-imageframe-caption">
                                  <h2 className="awb-imageframe-caption-title">
                                    Portrait of Dr. Gachet (1890)
                                  </h2>
                                  <p className="awb-imageframe-caption-text">
                                    The Potato Eaters (1885)
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div
                              className="fusion-text fusion-text-13"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>The Van Goghs Of Our Modern World </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-14"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  That brings us to today: we have artists who
                                  have beginnings very much like Van Gogh, but
                                  our world is different from his world. There
                                  is a shaking of the foundations for artists
                                  now, and mechanisms in place that are
                                  beneficial for artists in a way the old world
                                  did not offer in Van Gogh's lifetime.
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  On tumblr, XCOPY made gifs with unrelenting
                                  frequency.&nbsp;
                                </span>
                                <span style={{ fontWeight: 400 }}>
                                  In March 2018, XCOPY wrote:{" "}
                                  <a
                                    href="https://xcopy.tumblr.com/post/172139699716/today-i-sold-my-first-gif-for-1-nothing-can-stop"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    “Today I sold my first gif for £1. Nothing
                                    can stop us tumblr.”
                                  </a>
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  There was not yet a frenzy or feverish desire
                                  for this type of art form, nor a place where
                                  it could be sold or shared easily, except for
                                  Tumblr. But that did not stop the tempest of
                                  work that poured from the mind of this
                                  prolific artist, nor did it thwart his
                                  conviction that what he was doing had a bright
                                  future on the horizon.&nbsp;
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element awb-imageframe-style awb-imageframe-style-below awb-imageframe-style-7"
                              style={{ textAlign: "center" }}
                            >
                              <span className="fusion-imageframe imageframe-none imageframe-7 hover-type-none">
                                <a
                                  href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Descent.gif"
                                  className="fusion-lightbox"
                                  data-rel="iLightbox[a17f6286ac5c4f68d2b]"
                                  data-caption="DE$CENT (1/25) by XCOPY, originally sold for £1"
                                  data-title="DE$CENT (1/25) by XCOPY, originally sold for £1"
                                  title="DE$CENT (1/25) by XCOPY, originally sold for £1"
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    width={500}
                                    height={500}
                                    alt="DE$CENT (1/25) by XCOPY, originally sold for £1"
                                    src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Descent.gif"
                                    className="img-responsive wp-image-1902"
                                  />
                                </a>
                              </span>
                              <div className="awb-imageframe-caption-container">
                                <div className="awb-imageframe-caption">
                                  <h2 className="awb-imageframe-caption-title">
                                    DE$CENT (1/25) by XCOPY, originally sold for
                                    £1
                                  </h2>
                                  <p className="awb-imageframe-caption-text">
                                    DE$CENT (1/25) by XCOPY, originally sold for
                                    £1
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div
                              className="fusion-text fusion-text-15"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  On his Tumblr, February 2019, XCOPY wrote:{" "}
                                  <a
                                    href="https://xcopy.tumblr.com/post/182777190451/day-3-trying-to-give-away-crypto-art-on-tumblr"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    “Day 3 trying to give away crypto art on
                                    tumblr.”&nbsp;
                                  </a>
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Similar to how Van Gogh used to give away his
                                  own paintings to various friends and merchants
                                  in town in exchange for food and just to get
                                  eyes on his art, XCOPY was doing the same only
                                  a few years ago by gifting people pieces of
                                  digital art and offering enticing{" "}
                                  <a
                                    href="https://www.reddit.com/r/OpenBazaar/comments/86nudn/shameless_self_promotion_thread_friday_323/dw7ry0u/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    30% off coupon codes
                                  </a>{" "}
                                  to try to sell his pieces and gather as many
                                  eyes as possible on his work.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  It is noteworthy to see the parallel here
                                  between two great artists before they were
                                  great and the way in which their art was
                                  received before their fame. Van Gogh painted
                                  “Portrait of Dr. Felix Rey” as a thank-you
                                  present to his physician, but the doctor,
                                  thinking it to be a horrifying product of Van
                                  Gogh's mental illness, accepted it politely
                                  but used the painting to cover up a hole in
                                  his chicken coop. Today that painting is worth
                                  over 50 million dollars.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Similarly, XCOPY{" "}
                                  <a
                                    href="https://xcopy.tumblr.com/post/182764132406/2019-mission-convert-some-tumblr-followers-to"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    gave away
                                  </a>{" "}
                                  so many of his pieces that may have been
                                  overlooked or dismissed or seen as simply
                                  inaccessible digital files that their owners
                                  did not know what to do with. Great art simply
                                  sat and patched up holes in the family chicken
                                  coop or gathered digital dust.&nbsp;
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-16"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>A World That Champions the Artist </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-17"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  But here is where the differences in their
                                  worlds really come into play to alter the
                                  destinies of these artists.&nbsp;
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  With only a one month hiatus, for ten years
                                  straight, XCOPY produced his gifs, the
                                  phantasmagorical, hallucinogenic creations
                                  that shiver and spasm upon the screen, and
                                  explore themes of death, dystopia, and apathy.
                                  With a persistence that was both prophetic and
                                  fueled by the fire of his own passion, XCOPY
                                  never stopped making art.{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-18"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>
                                  January 2021: “Is tumblr ready for crypto art
                                  yet?”
                                </b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-19"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Once the world was hungry for this type of
                                  art, XCOPY had a bounty of it to share with
                                  ease, reaching audiences all over the world.
                                  With a shift in technology and the explosion
                                  of NFTs in the digital world, the perfect
                                  platform presented itself for him to make his
                                  work accessible and even more valuable given
                                  its historical origins in the timeline of
                                  digital art.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  His iconic status as an original crypto artist
                                  combined with his gift as an illustrator that
                                  are brought to life with exquisite motion
                                  aesthetics fueled the fire of his meteoric
                                  rise. One of the most famous crypto artists
                                  living, his pieces are some of the highest
                                  selling NFTs, enjoying a take-off that is
                                  dizzying in its swiftness.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Originally minted in 2018, “Right-click and
                                  Save as guy” sold for $90, and just three
                                  years later,{" "}
                                  <a href="https://superrare.com/artwork/right-click-and-save-as-guy-1154">
                                    sold for $7 million
                                  </a>
                                  , a great leap from his first sale of just
                                  over a dollar a few years ago.{" "}
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-image-element awb-imageframe-style awb-imageframe-style-below awb-imageframe-style-8"
                              style={{ textAlign: "center" }}
                            >
                              <div
                                style={{ display: "inline-block", width: 600 }}
                              >
                                <span className="fusion-imageframe imageframe-none imageframe-8 hover-type-none has-aspect-ratio">
                                  <a
                                    href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/RCSA.gif"
                                    className="fusion-lightbox"
                                    data-rel="iLightbox[efcec353f263cab8bcf]"
                                    data-caption="Right-click and Save As guy"
                                    data-title="Right-click and Save As guy"
                                    title="Right-click and Save As guy"
                                  >
                                    <img
                                      loading="lazy"
                                      decoding="async"
                                      width={1000}
                                      height={1000}
                                      alt="Right-click and Save As guy"
                                      src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/RCSA.gif"
                                      className="img-responsive wp-image-1843 img-with-aspect-ratio"
                                    />
                                  </a>
                                </span>
                                <div className="awb-imageframe-caption-container">
                                  <div className="awb-imageframe-caption">
                                    <h2 className="awb-imageframe-caption-title">
                                      Right-click and Save As guy
                                    </h2>
                                    <p className="awb-imageframe-caption-text">
                                      Right-click and Save As guy
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div
                              className="fusion-text fusion-text-20"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <b>Two Great Artists, Two Different Worlds</b>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-21"
                              style={{ color: "#000000" }}
                            >
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  The parallels are striking, two great artists
                                  living in two eras, but there is a difference
                                  in that the second enjoys his fame in this
                                  lifetime. Both pioneered different kinds of
                                  art revolutions, both in subject and style.
                                  But where one never lived to see a day of his
                                  legacy's brilliant flame and died a sad,
                                  miserable, impoverished genius who never knew
                                  how his art stoked the fires in a million
                                  souls, the other is soaring to great heights
                                  and has the artistic voice to reach out to his
                                  collectors and fans with the power to promote
                                  his own work.{" "}
                                </span>
                              </p>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  The technology in place and the expanding
                                  digital metaverse has set up a near Utopian
                                  society for artists to flourish, to share
                                  their work, to promote it in their own way,
                                  and to reach far and wide an audience of which
                                  hitherto undreamed.
                                </span>
                              </p>
                            </div>
                            <div
                              className="fusion-text fusion-text-22"
                              style={{ color: "#000000" }}
                            >
                              <div
                                style={{ width: 310 }}
                                className="wp-caption aligncenter"
                              >
                                <img
                                  loading="lazy"
                                  decoding="async"
                                  className="size-fusion-300"
                                  src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/XCOPY-summer-scaled.jpg"
                                  width={300}
                                  height={528}
                                  alt="6529.io"
                                />
                                <p className="wp-caption-text">summer.jpg</p>
                              </div>
                              <p>
                                <span style={{ fontWeight: 400 }}>
                                  Both Van Gogh and XCOPY knew this: The trick
                                  about the survival of great art is that it
                                  needs the public to make a stir, a commotion;
                                  the art must thrill the people and also hold
                                  them in its thrall. In its own quiet darkness,
                                  a piece of art may be great, but
                                </span>{" "}
                                <span style={{ fontWeight: 400 }}>
                                  to serve its purpose, to move, teach, inspire,
                                  and endure, it must be lifted by the steam and
                                  roar of an eager audience that will preserve
                                  the artworks' legacy with the sheer force of
                                  enthusiasm.
                                </span>
                              </p>
                              <p>***</p>
                              <p>
                                <i>
                                  Acknowledgments: Thank you to{" "}
                                  <a
                                    href="https://twitter.com/XCOPYART"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    XCOPY
                                  </a>{" "}
                                  for answering my questions about his work and
                                  career. Special thanks to{" "}
                                  <a
                                    href="https://twitter.com/fredwilson"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Fred Wilson
                                  </a>{" "}
                                  and{" "}
                                  <a
                                    href="https://twitter.com/punk6529"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    punk6529
                                  </a>{" "}
                                  for their helpful comments and
                                  suggestions!&nbsp;
                                </i>
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
                    2022-11-03T13:07:34-04:00
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
  return getAppMetadata({
    title: "A Tale of Two Artists - Van Gogh and XCOPY - 6529.io",
  });
}
