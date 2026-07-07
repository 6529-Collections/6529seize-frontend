import NextGenAdminComponent from "@/components/nextGen/admin/NextGenAdmin";
import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
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

function NextGenAdminFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="tw-py-10 tw-text-center tw-text-sm tw-font-medium tw-text-iron-300"
    >
      {t(DEFAULT_LOCALE, "nextgen.admin.loadingStatus")}
    </div>
  );
}

export default function NextGenAdminPage() {
  return (
    <main className={`${styles["main"]} tailwind-scope`}>
      <div className={`${styles["main"]} tw-w-full tw-px-3`}>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-min-w-0 tw-flex-1 tw-px-3">
            <Suspense fallback={<NextGenAdminFallback />}>
              <NextGenAdminComponent />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
