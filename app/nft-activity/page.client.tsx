"use client";

import LatestActivity from "@/components/latest-activity/LatestActivity";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";

export default function NFTActivityPage() {
  useSetTitle("NFT Activity | Network");

  return (
    <main className={styles["main"]}>
      <section className={styles["leaderboardContainer"]}>
        <LatestActivity page={1} pageSize={50} showMore />
      </section>
    </main>
  );
}
