import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { LeaderboardFocus } from "../../../components/leaderboard/Leaderboard";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const Leaderboard = dynamic(
  () => import("../../../components/leaderboard/Leaderboard"),
  { ssr: false }
);

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function CommunityNerdPage(props: any) {
  const router = useRouter();
  const [focus, setFocus] = useState<LeaderboardFocus>(props.pageProps.focus);
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  useEffect(() => {
    setBreadcrumbs([
      { display: "Home", href: "/" },
      { display: `Community Nerd - ${focus}` },
    ]);

    let path = "/community-nerd";
    if (focus === LeaderboardFocus.INTERACTIONS) {
      path += "/interactions";
    } else {
      path += "/cards-collected";
    }
    router.replace(
      {
        pathname: path,
      },
      undefined,
      { shallow: true }
    );
  }, [focus]);

  return (
    <>
      <Head>
        <title>Community | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Community | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/community`}
        />
        <meta property="og:title" content="Community" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={styles.mainContainer}>
          <Row>
            <Col>
              <Leaderboard focus={focus} setFocus={setFocus} />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const focusPath = req.query.focus?.[0];
  let focus = LeaderboardFocus.TDH;
  if (focusPath === "interactions") {
    focus = LeaderboardFocus.INTERACTIONS;
  }

  return {
    props: {
      focus,
    },
  };
}
