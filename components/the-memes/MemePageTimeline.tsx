"use client";

import { publicEnv } from "@/config/env";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { MEMES_CONTRACT } from "../../constants";
import { NFT, NFTHistory } from "../../entities/INFT";
import { fetchAllPages } from "../../services/6529api";
import Timeline from "../timeline/Timeline";

export function MemePageTimeline(props: {
  show: boolean;
  nft: NFT | undefined;
}) {
  const [nftHistory, setNftHistory] = useState<NFTHistory[]>([]);

  useEffect(() => {
    async function fetchHistory(url: string) {
      return fetchAllPages(url).then((response: NFTHistory[]) => {
        setNftHistory(response);
      });
    }
    if (props.nft) {
      const initialUrlHistory = `${publicEnv.API_ENDPOINT}/api/nft_history/${MEMES_CONTRACT}/${props.nft.id}`;
      fetchHistory(initialUrlHistory);
    }
  }, [props.nft]);

  if (props.show && props.nft) {
    return (
      <Container className="pt-3 pb-5 no-padding">
        <Row>
          <Col xs={12} md={{ span: 10, offset: 1 }}>
            {props.nft && <Timeline nft={props.nft} steps={nftHistory} />}
          </Col>
        </Row>
      </Container>
    );
  } else {
    return <></>;
  }
}
