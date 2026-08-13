import { getAppMetadata } from "@/components/providers/metadata";

const StubPage = () => (
  <div>
    <title>EMPTY STUB - 6529.io</title>
    <link rel="canonical" href="/museum/empty-stub/" />
    <div id="boxed-wrapper">
      <div id="wrapper" className="fusion-wrapper">
        <main id="main">
          <section id="content" className="full-width">
            <div id="post-2" className="post-2 page type-page status-publish hentry">
              <div className="post-content"></div>
            </div>
          </section>
        </main>
      </div>
    </div>
  </div>
);

export default StubPage;

export async function generateMetadata() {
  return getAppMetadata({ title: "Empty Stub" });
}
