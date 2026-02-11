import {
  DROP_CONTROL_SECTIONS,
  DROP_CONTROL_TITLE,
} from "@/components/drop-control/drop-control.constants";
import DropControlLaunchPageClient from "@/components/drop-control/DropControlLaunchPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

const LAUNCH = DROP_CONTROL_SECTIONS.LAUNCH;

export default function DropControlLaunchPage() {
  return (
    <main className={styles["main"]}>
      <DropControlLaunchPageClient />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: LAUNCH.title,
    description: DROP_CONTROL_TITLE,
  });
}
