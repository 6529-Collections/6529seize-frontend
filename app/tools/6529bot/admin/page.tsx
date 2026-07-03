import { getAppMetadata } from "@/components/providers/metadata";
import ReviewbotAdminDashboard from "@/components/reviewbot-admin/ReviewbotAdminDashboard";
import { getReviewbotAdminDashboard } from "@/services/reviewbot-admin-api";
import styles from "@/styles/Home.module.css";
import type { Metadata } from "next";
import { connection } from "next/server";

export default async function ReviewbotAdminPage() {
  await connection();

  const result = await getReviewbotAdminDashboard();

  return (
    <main className={styles["main"]}>
      <ReviewbotAdminDashboard result={result} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "6529bot Admin",
    description: "Operator Tools",
  });
}
