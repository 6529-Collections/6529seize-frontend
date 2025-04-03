import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../components/auth/Auth";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const AddRememeComponent = dynamic(
  () => import("../../components/rememes/RememeAddPage"),
  { ssr: false }
);

export default function ReMemes() {
  const { setTitle, title } = useContext(AuthContext);
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "ReMemes", href: "/rememes" },
    { display: "Add Rememe" },
  ]);

  useEffect(() => {
    setTitle({
      title: "Add ReMemes | 6529.io",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Add ReMemes | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/rememes/add`}
        />
        <meta property="og:title" content="ReMemes" />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/re-memes-b.jpeg`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <AddRememeComponent />
      </main>
    </>
  );
}
