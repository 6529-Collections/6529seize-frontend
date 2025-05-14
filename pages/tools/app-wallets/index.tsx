import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../../components/auth/Auth";

const AppWalletsComponent = dynamic(
  () => import("../../../components/app-wallets/AppWallets"),
  {
    ssr: false,
  }
);

export default function AppWallets() {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "App Wallets | Tools",
    });
  }, []);

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
