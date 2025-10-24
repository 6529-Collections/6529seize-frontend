"use client";

import Address from "@/components/address/Address";
import { useAuth } from "@/components/auth/Auth";
import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import NFTImage from "@/components/nft-image/NFTImage";
import { publicEnv } from "@/config/env";
import { GRADIENT_CONTRACT } from "@/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import { NFT } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { areEqualAddresses, numberWithCommas } from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import {
  faChevronCircleDown,
  faChevronCircleUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import YouOwnNftBadge from "../you-own-nft-badge/YouOwnNftBadge";
import styles from "./6529Gradient.module.scss";

enum Sort {
  ID = "id",
  TDH = "tdh",
}

interface GradientNFT extends NFT {
  owner: `0x${string}`;
  owner_display: string;
  tdh_rank: number;
}

export default function GradientsComponent() {
  useSetTitle("6529 Gradient | Collections");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { connectedProfile } = useAuth();
  const wallets = connectedProfile?.wallets?.map((w) => w.wallet) ?? [];

  const [nftsRaw, setNftsRaw] = useState<GradientNFT[]>([]);
  const [nfts, setNfts] = useState<GradientNFT[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<Sort>(Sort.ID);

  useEffect(() => {
    const sortParam = (searchParams?.get("sort") as Sort) || Sort.ID;
    const dirParam =
      (searchParams?.get("sort_dir")?.toUpperCase() as SortDirection) ||
      SortDirection.ASC;

    setSort(sortParam);
    setSortDir(dirParam);

    const url = `${publicEnv.API_ENDPOINT}/api/nfts/gradients?page_size=101`;
    fetchAllPages(url).then((raw: GradientNFT[]) => {
      setNftsRaw(raw);
      setNftsLoaded(true);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("sort", sort.toLowerCase());
    params.set("sort_dir", sortDir.toLowerCase());

    router.replace(`/6529-gradient?${params.toString()}`, {
      scroll: false,
    });
  }, [sort, sortDir]);

  useEffect(() => {
    if (!nftsLoaded) return;

    const sorted = [...nftsRaw];

    if (sort === Sort.ID) {
      sorted.sort((a, b) =>
        sortDir === SortDirection.ASC ? a.id - b.id : b.id - a.id
      );
    } else if (sort === Sort.TDH) {
      sorted.sort((a, b) =>
        sortDir === SortDirection.ASC
          ? b.boosted_tdh - a.boosted_tdh
          : a.boosted_tdh - b.boosted_tdh
      );
    }

    setNfts(sorted);
  }, [sort, sortDir, nftsLoaded]);

  function printNft(nft: GradientNFT) {
    return (
      <Col
        key={`${nft.contract}-${nft.id}`}
        className="pt-3 pb-3"
        xs={{ span: 6 }}
        sm={{ span: 4 }}
        md={{ span: 3 }}
        lg={{ span: 3 }}>
        <Link
          href={`/6529-gradient/${nft.id}`}
          className="decoration-none scale-hover">
          <Container fluid className="no-padding">
            <Row>
              <Col>
                <NFTImage
                  nft={nft}
                  animation={false}
                  height={300}
                  showBalance={false}
                  showThumbnail={true}
                />
              </Col>
            </Row>
            <Row>
              <Col className="text-center pt-2">{nft.name}</Col>
            </Row>
            <Row>
              <Col className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                {nft.owner && (
                  <Address
                    wallets={[nft.owner]}
                    display={nft.owner_display}
                    hideCopy={true}
                  />
                )}
                {wallets.some((w) => areEqualAddresses(w, nft.owner)) && (
                  <YouOwnNftBadge />
                )}
              </Col>
            </Row>
            <Row>
              <Col className="text-center pt-2">
                TDH: <b>{numberWithCommas(Math.round(nft.boosted_tdh))}</b> |
                Rank:{" "}
                <b>
                  {nft.tdh_rank}/{nfts.length}
                </b>
              </Col>
            </Row>
          </Container>
        </Link>
      </Col>
    );
  }

  function printNfts() {
    return <Row className="pt-2">{nfts.map((nft) => printNft(nft))}</Row>;
  }

  return (
    <Container fluid className={styles.mainContainer}>
      <Row>
        <Col>
          <Container className="pt-4">
            <>
              {/* Page header - visible on all devices */}
              <Row>
                <Col className="d-flex align-items-center justify-content-between mb-3">
                  <span className="d-flex align-items-center gap-3 flex-wrap">
                    <h1 className="mb-0">
                      6529 Gradient
                    </h1>
                    <LFGButton contract={GRADIENT_CONTRACT} />
                  </span>
                </Col>
              </Row>

              {/* Mobile & tablet elements - visible until xl breakpoint (1200px) */}
              <Row className="d-xl-none">
                <Col xs={12} sm="auto" className="mb-3">
                  <CollectionsDropdown activePage="gradient" />
                </Col>
              </Row>
              <Row className="pt-2">
                <Col>
                  Sort&nbsp;&nbsp;
                  <FontAwesomeIcon
                    icon={faChevronCircleUp}
                    onClick={() => setSortDir(SortDirection.ASC)}
                    className={`${styles.sortDirection} ${
                      sortDir != SortDirection.ASC ? styles.disabled : ""
                    }`}
                  />{" "}
                  <FontAwesomeIcon
                    icon={faChevronCircleDown}
                    onClick={() => setSortDir(SortDirection.DESC)}
                    className={`${styles.sortDirection} ${
                      sortDir != SortDirection.DESC ? styles.disabled : ""
                    }`}
                  />
                </Col>
              </Row>
              <Row className="pt-2">
                <Col>
                  <span
                    onClick={() => setSort(Sort.ID)}
                    className={`${styles.sort} ${
                      sort != Sort.ID ? styles.disabled : ""
                    }`}>
                    ID
                  </span>
                  <span
                    onClick={() => setSort(Sort.TDH)}
                    className={`${styles.sort} ${
                      sort != Sort.TDH ? styles.disabled : ""
                    }`}>
                    TDH
                  </span>
                </Col>
              </Row>
              {nftsLoaded ? (
                printNfts()
              ) : (
                <Row>
                  <Col className="pt-3">
                    Fetching <DotLoader />
                  </Col>
                </Row>
              )}
            </>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
