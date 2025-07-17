"use client";

import styles from "@/styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "@/contexts/TitleContext";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

const Royalties = dynamic(() => import("@/components/gas-royalties/Royalties"), {
  ssr: false,
});

export default function MemeAccountingPage() {
  useSetTitle("Meme Accounting | Tools");

  return (
    <main className={styles.main}>
      <Royalties />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Meme Accounting", description: "Tools" });
}
