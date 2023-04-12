import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { Container, Row, Col, Tabs, Tab } from "react-bootstrap";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const Documentation = dynamic(
  () =>
    import("../../components/delegation/documentation/DelegationDocumentation")
);

export default function DelegationsDocumentation() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Delegations", href: "/delegations" },
    { display: "Documentation" },
  ]);

  return (
    <>
      <Head>
        <title>Delegations Documentation | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Delegations Documentation | 6529 SEIZE"
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/delegations/documentation`}
        />
        <meta property="og:title" content="Delegations Documentation" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Documentation />
      </main>
    </>
  );
}
