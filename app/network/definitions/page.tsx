import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import DefinitionsClient from "./page.client";

export default function Definitions() {
  return (
    <main className={styles.main}>
      <DefinitionsClient />
    </main>
  );
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "Definitions",
    description: "Network",
  });
};
