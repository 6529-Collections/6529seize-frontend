import styles from "../../../../styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import { LeaderboardFocus } from "../../../../components/leaderboard/Leaderboard";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useTitle } from "../../../../contexts/TitleContext";

const Leaderboard = dynamic(
  () => import("../../../../components/leaderboard/Leaderboard"),
  { ssr: false }
);

export default function CommunityNerdPage(props: any) {
  const { setTitle } = useTitle();
  const router = useRouter();
  const [focus, setFocus] = useState<LeaderboardFocus>(props.pageProps.focus);

  const syncPath = useCallback(
    (newFocus: LeaderboardFocus) => {
      let path = "/network/nerd";
      path +=
        newFocus === LeaderboardFocus.INTERACTIONS
          ? "/interactions"
          : "/cards-collected";

      if (router.asPath !== path) {
        router.replace(path, undefined, { shallow: true });
      }
    },
    [router]
  );

  const handleSetFocus = (newFocus: LeaderboardFocus) => {
    setFocus(newFocus);
    syncPath(newFocus);
  };

  useEffect(() => {
    const pageTitle = `Network Nerd - ${focus}`;
    setTitle(pageTitle);
  }, [focus, setTitle]);

  return (
    <main className={styles.main}>
      <Container fluid>
        <Row>
          <Col>
            <Leaderboard focus={focus} setFocus={handleSetFocus} />
          </Col>
        </Row>
      </Container>
    </main>
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
      metadata: {
        title: `Network Nerd - ${focus}`,
        description: "Network",
      },
    },
  };
}
