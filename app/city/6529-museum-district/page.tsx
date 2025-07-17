import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function CityMuseumRedirectPage() {
  return (
    <div>
      <title>Redirecting...</title>
      <meta httpEquiv="refresh" content="0;url=/om/6529-museum-district/" />
      <p>
        You are being redirected to{" "}
        <a href="/om/6529-museum-district/">/om/6529-museum-district/</a>
      </p>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Redirecting..." });
}
