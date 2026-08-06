"use client";

import SubscriptionsReportComponent from "@/components/subscriptions-report/SubscriptionsReport";
import { CONTENT_PAGE_MAIN_CLASS } from "@/components/about/AboutLayout";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.css";

export default function SubscriptionsReport() {
  useSetTitle("Subscriptions Report | Tools");

  return (
    <main className={`${styles["main"]} ${CONTENT_PAGE_MAIN_CLASS}`}>
      <SubscriptionsReportComponent />
    </main>
  );
}
