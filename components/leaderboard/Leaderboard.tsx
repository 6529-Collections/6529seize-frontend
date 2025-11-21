"use client";

import Link from "next/link";
import { publicEnv } from "@/config/env";
import { LeaderboardFocus } from "@/enums";
import { useEffect, useState } from "react";
import { Col, Container, Dropdown, Row } from "react-bootstrap";
import { DBResponse } from "@/entities/IDBResponse";
import { MemeSeason } from "@/entities/ISeason";
import { GlobalTDHHistory, TDHCalc } from "@/entities/ITDH";
import { ApiBlocksPage } from "@/generated/models/ApiBlocksPage";
import { numberWithCommas } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import DotLoader, { Spinner } from "../dotLoader/DotLoader";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "../searchModal/SearchModal";
import styles from "./Leaderboard.module.scss";
import LeaderboardCardsCollectedComponent from "./LeaderboardCardsCollected";
import LeaderboardInteractionsComponent from "./LeaderboardInteractions";

export enum Content {
  ALL = "All",
  MEMES = "Memes",
  GRADIENTS = "Gradient",
  MEMELAB = "MemeLab",
  NEXTGEN = "NextGen",
}

export enum Collector {
  ALL = "All",
  MEMES = "Memes",
  MEMES_SETS = "Meme SZN Set",
  GENESIS = "Genesis Set",
  GRADIENTS = "Gradient",
  MEMELAB = "MemeLab",
  NEXTGEN = "NextGen",
}

export default function Leaderboard(
  props: Readonly<{
    focus: LeaderboardFocus;
    setFocus: (focus: LeaderboardFocus) => void;
  }>
) {
  const [content, setContent] = useState<Content>(Content.ALL);
  const [collector, setCollector] = useState<Collector>(Collector.ALL);
  const [seasons, setSeasons] = useState<MemeSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(0);

  const [lastTDH, setLastTDH] = useState<TDHCalc>();

  const showViewAll = !window.location.pathname.includes("network");

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  const [globalTdhHistory, setGlobalTdhHistory] = useState<GlobalTDHHistory>();
  const [globalTdhRateChange, setGlobalTdhRateChange] = useState<number>();

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (
      content !== Content.MEMES &&
      collector !== Collector.MEMES &&
      collector !== Collector.MEMES_SETS
    ) {
      setSelectedSeason(0);
    }
  }, [content, collector]);

  useEffect(() => {
    fetchUrl(`${publicEnv.API_ENDPOINT}/api/blocks?page_size=${1}`)
      .then((response: ApiBlocksPage) => {
        if (response.data.length > 0) {
          setLastTDH({
            block: response.data[0].block_number,
            date: new Date(response.data[0].timestamp),
          });
        }
      })
      .catch((error) => {
        console.error("Failed to fetch latest TDH block", error);
        setLastTDH(undefined);
      });

    commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
    }).then((response) => {
      setSeasons(response);
    });
  }, []);

  useEffect(() => {
    let url = `${publicEnv.API_ENDPOINT}/api/tdh_global_history?page_size=${1}`;
    fetchUrl(url)
      .then((response: DBResponse) => {
        const tdhH = response.data[0];
        setGlobalTdhHistory(tdhH);
        const change = (tdhH.net_boosted_tdh / tdhH.total_boosted_tdh) * 100;
        setGlobalTdhRateChange(change);
      })
      .catch((error) => {
        console.error("Failed to fetch global TDH history", error);
        setGlobalTdhHistory(undefined);
        setGlobalTdhRateChange(undefined);
      });
  }, []);

  function printCollectorsDropdown() {
    return (
      <Dropdown className={styles.contentDropdown} drop={"down-centered"}>
        <Dropdown.Toggle>Collectors: {collector}</Dropdown.Toggle>
        <Dropdown.Menu>
          {Object.values(Collector).map((collector) => (
            <Dropdown.Item
              key={collector}
              onClick={() => setCollector(collector)}>
              {[Collector.MEMES_SETS, Collector.GENESIS].includes(collector) ? (
                <>&nbsp;&nbsp;{collector}</>
              ) : (
                collector
              )}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  function printCollectionsDropdown() {
    return (
      <Dropdown className={styles.contentDropdown} drop={"down-centered"}>
        <Dropdown.Toggle>Collection: {content}</Dropdown.Toggle>
        <Dropdown.Menu>
          {Object.values(Content).map((content) => (
            <Dropdown.Item key={content} onClick={() => setContent(content)}>
              {content}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  function printSeasonsDropdown() {
    return (
      <Dropdown className={styles.contentDropdown} drop={"down-centered"}>
        <Dropdown.Toggle
          disabled={
            content != Content.MEMES &&
            collector != Collector.MEMES &&
            collector != Collector.MEMES_SETS
          }>
          SZN: {selectedSeason > 0 ? selectedSeason : "All"}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={() => setSelectedSeason(0)}>
            All
          </Dropdown.Item>
          {seasons.map((season) => (
            <Dropdown.Item
              key={season.display}
              onClick={() => setSelectedSeason(season.id)}>
              {season.display}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  return (
    <Container className={`pt-4`}>
      <Row className="pb-3">
        <Col
          className={`d-flex align-items-center`}
          xs={{ span: showViewAll ? 12 : 6 }}
          sm={{ span: 6 }}>
          <h1>
            Network{" "}
            {showViewAll && (
              <Link href="/network/nerd">
                <span className={styles.viewAllLink}>View All</span>
              </Link>
            )}
          </h1>
        </Col>
        {lastTDH && (
          <Col
            className={
              "no-padding d-flex flex-column align-items-end justify-content-center"
            }
            xs={{ span: 6 }}>
            <div className={styles.statsContainer}>
              <span>
                TDH Block&nbsp;
                <a
                  href={`https://etherscan.io/block/${lastTDH.block}`}
                  rel="noopener noreferrer"
                  target="_blank">
                  {lastTDH.block}
                </a>
              </span>
              <span>
                Network TDH:{" "}
                {globalTdhHistory ? (
                  numberWithCommas(globalTdhHistory.total_boosted_tdh)
                ) : (
                  <DotLoader />
                )}
              </span>
              <span>
                Daily Change:{" "}
                {globalTdhHistory ? (
                  <>
                    {numberWithCommas(globalTdhHistory.net_boosted_tdh)}{" "}
                    <span className="font-smaller">
                      (
                      {(
                        (globalTdhHistory.net_boosted_tdh /
                          globalTdhHistory.total_boosted_tdh) *
                        100
                      ).toFixed(2)}
                      %)
                    </span>
                  </>
                ) : (
                  <DotLoader />
                )}
              </span>
            </div>
          </Col>
        )}
      </Row>
      {!showViewAll && (
        <>
          <Row className="pt-2 pb-2" id={`leaderboard-page`}>
            <Col
              className="d-flex justify-content-start gap-5 align-items-center"
              sm={{ span: 12 }}
              md={{ span: 9 }}>
              {printCollectorsDropdown()}
              {printCollectionsDropdown()}
              {printSeasonsDropdown()}
            </Col>
            <Col
              className={`${styles.pageHeader}`}
              sm={{ span: 12 }}
              md={{ span: 3 }}>
              <div
                className={`${styles.headerMenuFocus} d-flex justify-content-center align-items-center`}>
                <span>
                  <span
                    onClick={() => props.setFocus(LeaderboardFocus.TDH)}
                    className={`${styles.focus} ${
                      props.focus === LeaderboardFocus.TDH
                        ? ""
                        : styles.disabled
                    }`}>
                    {LeaderboardFocus.TDH}
                  </span>
                </span>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <span>
                  <span
                    onClick={() =>
                      props.setFocus(LeaderboardFocus.INTERACTIONS)
                    }
                    className={`${styles.focus} ${
                      props.focus === LeaderboardFocus.INTERACTIONS
                        ? ""
                        : styles.disabled
                    }`}>
                    {LeaderboardFocus.INTERACTIONS}
                  </span>
                </span>
              </div>
            </Col>
          </Row>
          <Row className="pt-1 pb-1 d-flex align-items-center">
            <Col xs={1}>{isLoading && <Spinner dimension={30} />}</Col>
            <Col
              xs={11}
              className={`d-flex justify-content-end align-items-center`}>
              <SearchWalletsDisplay
                searchWallets={searchWallets}
                setSearchWallets={setSearchWallets}
                setShowSearchModal={setShowSearchModal}
              />
            </Col>
          </Row>
        </>
      )}
      <Row className={`${styles.scrollContainer} pt-2`}>
        <Col>
          {props.focus === LeaderboardFocus.TDH && (
            <LeaderboardCardsCollectedComponent
              block={lastTDH?.block}
              content={content}
              collector={collector}
              selectedSeason={selectedSeason}
              searchWallets={searchWallets}
              globalTdhRateChange={globalTdhRateChange}
              seasons={seasons}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
          {props.focus === LeaderboardFocus.INTERACTIONS && (
            <LeaderboardInteractionsComponent
              block={lastTDH?.block}
              content={content}
              collector={collector}
              selectedSeason={selectedSeason}
              searchWallets={searchWallets}
              seasons={seasons}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
        </Col>
      </Row>
      <SearchModalDisplay
        show={showSearchModal}
        setShow={setShowSearchModal}
        searchWallets={searchWallets}
        setSearchWallets={setSearchWallets}
      />
    </Container>
  );
}
