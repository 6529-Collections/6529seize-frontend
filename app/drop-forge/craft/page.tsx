import {
  DROP_FORGE_SECTIONS,
  DROP_FORGE_TITLE,
} from "@/components/drop-forge/drop-forge.constants";
import DropForgeClaimsListPageClient from "@/components/drop-forge/DropForgeClaimsListPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

const CRAFT = DROP_FORGE_SECTIONS.CRAFT;

export default function DropForgeCraftPage() {
  return (
    <main className={styles["main"]}>
      <DropForgeClaimsListPageClient />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: CRAFT.title,
    description: DROP_FORGE_TITLE,
  });
}
