import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../../components/auth/Auth";
import { formatAddress } from "../../../helpers/Helpers";

const AppWalletComponent = dynamic(
  () => import("../../../components/app-wallets/AppWallet"),
  {
    ssr: false,
  }
);

export default function AppWalletPage(props: any) {
  const { setTitle } = useContext(AuthContext);

  const pageProps = props.pageProps;
  const address = pageProps.address;

  useEffect(() => {
    setTitle({
      title: `${formatAddress(address)} | App Wallets | 6529.io`,
    });
  }, []);

  return (
    <main className={styles.main}>
      <AppWalletComponent address={address} />
    </main>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const address = req.query["app-wallet-address"];

  return {
    props: {
      address,
      metadata: {
        title: `${formatAddress(address)} | App Wallets`,
      },
    },
  };
}
