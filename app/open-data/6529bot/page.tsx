import { getAppMetadata } from "@/components/providers/metadata";
import ReviewbotUsageDashboard from "@/components/reviewbot-usage/ReviewbotUsageDashboard";
import { getReviewbotPublicUsageSummary } from "@/services/reviewbot-usage-api";
import styles from "@/styles/Home.module.scss";
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
    title: "6529bot Usage",
    description: "Open Data",
  });
}
