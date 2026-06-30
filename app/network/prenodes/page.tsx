import styles from "@/styles/Home.module.scss";
import PrenodesStatus from "@/components/prenodes/PrenodesStatus";
import { getAppMetadata } from "@/components/providers/metadata";

export default function PrenodesPage() {
  return (
    <main className={styles["main"]}>
      <section className={styles["leaderboardContainer"]}>
        <PrenodesStatus />
      </section>
    </main>
  );
}

export const generateMetadata = () => {
  return getAppMetadata({
    title: "Prenodes",
    description: "Network",
  });
};
