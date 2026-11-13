import { getAppMetadata } from "@/components/providers/metadata";
import ReviewbotUsageDashboard from "@/components/reviewbot-usage/ReviewbotUsageDashboard";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getReviewbotPublicUsageSummary } from "@/services/reviewbot-usage-api";
import styles from "@/styles/Home.module.css";
import type { Metadata } from "next";

export default async function ReviewbotUsagePage() {
  const result = await getReviewbotPublicUsageSummary();

  return (
    <main className={styles["main"]}>
      <ReviewbotUsageDashboard result={result} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "6529bot Usage | Open Data",
    description: t(DEFAULT_LOCALE, "pageMetadata.openData6529bot.description"),
  });
}
