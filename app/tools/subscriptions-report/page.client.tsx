"use client";

import SubscriptionsReportComponent from "@/components/subscriptions-report/SubscriptionsReport";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.css";
import clsx from "clsx";

const SUBSCRIPTIONS_REPORT_MAIN_CLASS =
  "tailwind-scope tw-min-h-[100dvh] tw-border-0 tw-border-solid tw-border-iron-800 !tw-bg-[#0D0D0F] tw-text-iron-300 md:tw-border-l";

export default function SubscriptionsReport() {
  useSetTitle("Subscriptions Report | Tools");

  return (
    <main className={clsx(styles["main"], SUBSCRIPTIONS_REPORT_MAIN_CLASS)}>
      <SubscriptionsReportComponent />
    </main>
  );
}
