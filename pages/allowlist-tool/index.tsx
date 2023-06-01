import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import styles from "../../styles/Home.module.scss";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import AllowlistToolPage from "../../components/allowlist-tool/AllowlistToolPage";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function AllowlistTool() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Allowlist tool" },
  ]);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  return (
    <main style={{ paddingBottom: "0px !important" }} className={styles.main}>
      <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <AllowlistToolPage />
    </main>
  );
}
