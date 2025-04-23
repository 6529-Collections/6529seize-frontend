import Head from "next/head";
import styles from "../../../../styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import { LeaderboardFocus } from "../../../../components/leaderboard/Leaderboard";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../../../../components/auth/Auth";

const Leaderboard = dynamic(
  () => import("../../../../components/leaderboard/Leaderboard"),
  { ssr: false }
);

export default function CommunityNerdPage(props: any) {
  const { setTitle, title } = useContext(AuthContext);
  const router = useRouter();
  const [focus, setFocus] = useState<LeaderboardFocus>(props.pageProps.focus);

  useEffect(() => {
    let path = "/network/nerd";
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
  }, [focus, router]);

  useEffect(() => {
    const pageTitle = focus ? `Network | Nerd - ${focus}` : "Network | Nerd";
    setTitle({ title: pageTitle });
  }, [focus, setTitle]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="6529.io Network Nerd Leaderboard" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/network/nerd`}
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content="6529.io Network Nerd Leaderboard" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>

      <main className={styles.main}>
        <Container fluid>
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

export async function getServerSideProps(req: any) {
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
