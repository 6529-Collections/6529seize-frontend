import { getAppMetadata } from "@/components/providers/metadata";
const IndexPage = () => (
  <div>
      <title>Redirecting...</title>
      <meta httpEquiv="refresh" content="0;url=/" />
      <p>
        You are being redirected to <a href="/">/</a>
      </p>
    </div>);

export default IndexPage;

export async function generateMetadata() {
  return getAppMetadata({ title: "Redirecting..." });
}
