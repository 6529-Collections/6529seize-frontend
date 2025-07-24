"use client";

import SubscriptionsReportComponent from "@/components/subscriptions-report/SubscriptionsReport";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";

export default function SubscriptionsReport() {
  useSetTitle("Subscriptions Report | Tools");

  return (
    <main className={`${styles.main} tailwind-scope !tw-bg-iron-950`}>
      <SubscriptionsReportComponent />
    </main>
  );
}
