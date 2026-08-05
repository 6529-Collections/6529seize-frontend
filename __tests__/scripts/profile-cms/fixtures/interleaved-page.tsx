import { getAppMetadata } from "@/components/providers/metadata";

const InterleavedPage = () => (
  <div>
    <title>INTERLEAVED WING - 6529.io</title>
    <link rel="canonical" href="/museum/interleaved-wing/" />
    <div id="boxed-wrapper">
      <div id="wrapper" className="fusion-wrapper">
        <main id="main">
          <section id="content" className="full-width">
            <div id="post-3" className="post-3 page type-page status-publish hentry">
              <div className="post-content">
                <div className="fusion-title title fusion-title-1">
                  <h1 className="fusion-title-heading">First Section</h1>
                </div>
                <div className="fusion-text fusion-text-1">
                  <p>Intro paragraph before the artwork image.</p>
                </div>
                <div className="fusion-image-element" style={{ textAlign: "center" }}>
                  <span className=" fusion-imageframe imageframe-none imageframe-1">
                    <img
                      loading="lazy"
                      width={400}
                      height={400}
                      src="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/interleaved-1.png"
                      alt="First artwork"
                      className="img-responsive wp-image-2"
                    />
                  </span>
                </div>
                <div className="fusion-text fusion-text-2">
                  <p>
                    This long narrative paragraph follows the image but is
                    regular prose, not a caption. It has full sentences and
                    must remain in the body text flow.
                  </p>
                </div>
                <div className="fusion-title title fusion-title-2">
                  <h2 className="fusion-title-heading">Second Section</h2>
                </div>
                <div className="fusion-text fusion-text-3">
                  <p>Closing paragraph under the second heading.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  </div>
);

export default InterleavedPage;

export async function generateMetadata() {
  return getAppMetadata({ title: "Interleaved Wing" });
}
