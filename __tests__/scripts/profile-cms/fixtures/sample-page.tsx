import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function SamplePage() {
  return (
    <div>
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <title>SAMPLE WING - 6529.io</title>
      <link rel="canonical" href="/museum/sample-wing/" />
      <meta
        name="description"
        content="SAMPLE WING IS A TEST FIXTURE FOR THE MIGRATION CONVERTER

It exists purely to exercise heading, paragraph, image, and button extraction."
      />
      <meta
        property="og:image"
        content="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/sample-og.png"
      />
      <div id="boxed-wrapper">
        <div id="wrapper" className="fusion-wrapper">
          <section className="avada-page-titlebar-wrapper" aria-label="Page Title Bar">
            <div className="fusion-page-title-bar">
              <h1 className="entry-title">SAMPLE WING</h1>
            </div>
          </section>
          <main id="main">
            <section id="content" className="full-width">
              <div id="post-1" className="post-1 page type-page status-publish hentry">
                <div className="post-content">
                  <div className="fusion-title title fusion-title-1">
                    <h1 className="fusion-title-heading">Sample Artwork</h1>
                  </div>
                  <div className="fusion-text fusion-text-1">
                    <p>
                      This is a sample paragraph describing the artwork for
                      test purposes only.
                    </p>
                    <p>
                      A second paragraph with a{" "}
                      <a href="/museum/sample-wing/other/">link to another page</a>
                      {"."}
                    </p>
                  </div>
                  <div className="fusion-image-element" style={{ textAlign: "center" }}>
                    <span className=" fusion-imageframe imageframe-none imageframe-1 hover-type-zoomin">
                      <a
                        href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/sample-full.png"
                        className="fusion-lightbox"
                        data-title="Sample #1"
                        title="Sample #1">
                        <img
                          loading="lazy"
                          width={300}
                          height={300}
                          src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/sample-300x300.png"
                          alt="6529.io"
                          className="img-responsive wp-image-1"
                        />
                      </a>
                    </span>
                  </div>
                  <div className="fusion-text fusion-text-2">
                    <p>Token: 1</p>
                  </div>
                  <a
                    className="fusion-button button-flat fusion-button-default-size button-default fusion-button-default"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://oncyber.io/sample">
                    <span className="fusion-button-text">VISIT SAMPLE GALLERY</span>
                  </a>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Sample Wing" });
}
