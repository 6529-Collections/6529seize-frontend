import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../../components/auth/Auth";

const AppWalletImport = dynamic(
  () => import("../../../components/app-wallets/AppWalletImport"),
  {
    ssr: false,
  }
);

export default function AppWalletImportPage(props: any) {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Import App Wallet | Tools",
    });
  }, []);

  return (
    <main className={styles.main}>
      <AppWalletImport />
    </main>
  );
}

AppWalletImportPage.metadata = {
  title: "App Wallets | Import",
  description: "Tools",
};
