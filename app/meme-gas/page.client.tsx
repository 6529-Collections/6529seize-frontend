"use client";

import styles from "@/styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "@/contexts/TitleContext";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

const Gas = dynamic(() => import("@/components/gas-royalties/Gas"), {
  ssr: false,
});

export default function GasPage() {
  useSetTitle("Meme Gas | Tools");

  return (
    <main className={styles.main}>
      <Gas />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Meme Gas", description: "Tools" });
}
