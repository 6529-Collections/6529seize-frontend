import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "../../../contexts/TitleContext";

const AppWalletsComponent = dynamic(
  () => import("../../../components/app-wallets/AppWallets"),
  {
    ssr: false,
  }
);

export default function AppWallets() {
  useSetTitle("App Wallets | Tools");

  return (
    <main className={styles.main}>
      <AppWalletsComponent />
    </main>
  );
}

AppWallets.metadata = {
  title: "App Wallets",
  description: "Tools",
};
