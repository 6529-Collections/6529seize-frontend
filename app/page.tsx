import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";

import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default function Page() {
  return <main className={styles["main"]}></main>;
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    ogImage: `${publicEnv.BASE_ENDPOINT}/6529io-banner.png`,
    twitterCard: "summary_large_image",
  });
}
