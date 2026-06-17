"use client";

import Leaderboard from "@/components/leaderboard/Leaderboard";
import { useTitle } from "@/contexts/TitleContext";
import { ApiConsolidatedTdhView } from "@/generated/models/ApiConsolidatedTdhView";
import styles from "@/styles/Home.module.scss";
import { LeaderboardFocus } from "@/types/enums";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

const TDH_VIEW_PARAM = "tdh_view";

function getTdhViewFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">
): ApiConsolidatedTdhView {
  return searchParams.get(TDH_VIEW_PARAM) === ApiConsolidatedTdhView.Unboosted
    ? ApiConsolidatedTdhView.Unboosted
    : ApiConsolidatedTdhView.Boosted;
}

function getFocusPath(focus: LeaderboardFocus): string {
  return `/network/nerd${
    focus === LeaderboardFocus.INTERACTIONS
      ? "/interactions"
      : "/cards-collected"
  }`;
}

function replaceUrl(pathname: string, tdhView: ApiConsolidatedTdhView): void {
  const params = new URLSearchParams(window.location.search);
  if (tdhView === ApiConsolidatedTdhView.Unboosted) {
    params.set(TDH_VIEW_PARAM, ApiConsolidatedTdhView.Unboosted);
  } else {
    params.delete(TDH_VIEW_PARAM);
  }

  const nextUrl =
    params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
  window.history.replaceState(window.history.state, "", nextUrl);
}

export default function CommunityNerdPageClient({
  focus: initialFocus,
}: {
  focus: LeaderboardFocus;
}) {
  const { setTitle } = useTitle();
  const searchParams = useSearchParams();
  const [focus, setFocus] = useState<LeaderboardFocus>(initialFocus);
  const [tdhView, setTdhView] = useState<ApiConsolidatedTdhView>(() =>
    getTdhViewFromSearchParams(searchParams)
  );

  const handleSetFocus = (newFocus: LeaderboardFocus) => {
    setFocus(newFocus);
    replaceUrl(getFocusPath(newFocus), tdhView);
  };

  const handleSetTdhView = (newTdhView: ApiConsolidatedTdhView) => {
    setTdhView(newTdhView);
    replaceUrl(getFocusPath(focus), newTdhView);
  };

  useEffect(() => {
    setTitle(`Network Nerd - ${focus}`);
  }, [focus, setTitle]);

  return (
    <main className={styles["main"]}>
      <Container fluid>
        <Row>
          <Col>
            <Leaderboard
              focus={focus}
              setFocus={handleSetFocus}
              tdhView={tdhView}
              setTdhView={handleSetTdhView}
            />
          </Col>
        </Row>
      </Container>
    </main>
  );
}
