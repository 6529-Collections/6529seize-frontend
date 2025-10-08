import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import TDHMainPage from "./page.client";

export default function TDH() {
  return (
    <main className={styles.main}>
      <TDHMainPage />
    </main>
  );
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "TDH",
    description: "Network",
  });
};
