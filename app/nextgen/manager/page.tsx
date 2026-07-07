import NextGenAdminComponent from "@/components/nextGen/admin/NextGenAdmin";
import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import type { Metadata } from "next";
import styles from "@/styles/Home.module.css";
import { Suspense } from "react";

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
    <main className={`${styles["main"]} tailwind-scope`}>
      <div className={`${styles["main"]} tw-w-full tw-px-3`}>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-min-w-0 tw-flex-1 tw-px-3">
            <Suspense fallback={null}>
              <NextGenAdminComponent />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
