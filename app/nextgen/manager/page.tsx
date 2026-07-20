import NextGenAdminComponent from "@/components/nextGen/admin/NextGenAdmin";
import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: "NextGen Admin",
      description: "NextGen",
      ogImage: getCollectionSocialCardImagePath("nextgen", {
        subtitle: "Manage NextGen collections",
        title: "NextGen Admin",
      }),
      ogImageAlt: "NextGen Admin social card",
    })
  );
}

export default function NextGenAdminPage() {
  return (
    <main className="tailwind-scope tw-min-h-screen">
      <div className="tw-min-h-screen tw-w-full tw-px-3">
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-min-w-0 tw-flex-1 tw-px-3">
            <NextGenAdminComponent />
          </div>
        </div>
      </div>
    </main>
  );
}
