"use client";

import Leaderboard from "@/components/leaderboard/Leaderboard";
import { useTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";
import { LeaderboardFocus } from "@/types/enums";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

export default function CommunityNerdPageClient({
  focus: initialFocus,
}: {
  focus: LeaderboardFocus;
}) {
  const { setTitle } = useTitle();
  const router = useRouter();
  const pathname = usePathname();
  const [focus, setFocus] = useState<LeaderboardFocus>(initialFocus);

  const syncPath = useCallback(
    (newFocus: LeaderboardFocus) => {
      let path = "/network/nerd";
      path +=
        newFocus === LeaderboardFocus.INTERACTIONS
          ? "/interactions"
          : "/cards-collected";

      if (pathname !== path) {
        router.replace(path);
      }
    },
    [pathname, router]
  );

  const handleSetFocus = (newFocus: LeaderboardFocus) => {
    setFocus(newFocus);
    syncPath(newFocus);
  };

  useEffect(() => {
    setTitle(`Network Nerd - ${focus}`);
  }, [focus, setTitle]);

  return (
    <main className={styles["main"]}>
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
