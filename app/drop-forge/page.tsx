import { DROP_FORGE_TITLE } from "@/components/drop-forge/drop-forge.constants";
import DropForgePageClient from "@/components/drop-forge/DropForgePageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default function DropForgePage() {
  return (
    <main className={styles["main"]}>
      <DropForgePageClient />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: DROP_FORGE_TITLE,
  });
}
