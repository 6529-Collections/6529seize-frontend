import {
  DROP_FORGE_SECTIONS,
  DROP_FORGE_TITLE,
} from "@/components/drop-forge/drop-forge.constants";
import DropForgeLaunchPageClient from "@/components/drop-forge/DropForgeLaunchPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

const LAUNCH = DROP_FORGE_SECTIONS.LAUNCH;

export default function DropForgeLaunchPage() {
  return (
    <main className={styles["main"]}>
      <DropForgeLaunchPageClient />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: LAUNCH.title,
    description: DROP_FORGE_TITLE,
  });
}
