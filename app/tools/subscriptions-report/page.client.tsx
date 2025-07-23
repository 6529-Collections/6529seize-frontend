"use client";

import styles from "@/styles/Home.module.scss";
import { useSetTitle } from "@/contexts/TitleContext";
import SubscriptionsReportComponent from "@/components/subscriptions-report/SubscriptionsReport";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function SubscriptionsReport() {
  useSetTitle("Subscriptions Report | Tools");

  return (
    <main className={`${styles.main} tailwind-scope !tw-bg-iron-950`}>
      <SubscriptionsReportComponent />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Subscriptions Report", description: "Tools" });
}
