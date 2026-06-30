import styles from "@/styles/Home.module.scss";
import PrenodesStatus from "@/components/prenodes/PrenodesStatus";
import { getAppMetadata } from "@/components/providers/metadata";

export default function PrenodesPage() {
  return (
    <main className={`${styles["main"]} tailwind-scope`}>
      <section className={`${styles["leaderboardContainer"]} tailwind-scope`}>
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
