import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import styles from "../../styles/Home.module.scss";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";

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
    <main className={styles.main}>
      <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <div className="row justify-content-evenly">
        <h1 className="col-4">ALLOWLIST TOOL</h1>
        <button type="button" className="btn btn-primary col-2 m-2">
          + New allowlist
        </button>
      </div>
    </main>
  );
}
