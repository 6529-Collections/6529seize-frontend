import { DROP_CONTROL_TITLE } from "@/components/drop-control/drop-control.constants";
import DropControlPageClient from "@/components/drop-control/DropControlPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default function DropControlPage() {
  return (
    <main className={styles["main"]}>
      <DropControlPageClient />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: DROP_CONTROL_TITLE,
  });
}
