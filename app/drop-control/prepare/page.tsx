import {
  DROP_CONTROL_SECTIONS,
  DROP_CONTROL_TITLE,
} from "@/components/drop-control/drop-control.constants";
import DropControlClaimsListPageClient from "@/components/drop-control/DropControlClaimsListPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

const PREPARE = DROP_CONTROL_SECTIONS.PREPARE;

export default function DropControlPreparePage() {
  return (
    <main className={styles["main"]}>
      <DropControlClaimsListPageClient />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: PREPARE.title,
    description: DROP_CONTROL_TITLE,
  });
}
