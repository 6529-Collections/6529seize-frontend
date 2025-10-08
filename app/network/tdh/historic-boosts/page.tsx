import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import TDHHistoricBoostsPage from "./page.client";

export default function TDHHistory() {
  return (
    <main className={styles.main}>
      <TDHHistoricBoostsPage />
    </main>
  );
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "TDH Historic Boosts",
    description: "Network",
  });
};
