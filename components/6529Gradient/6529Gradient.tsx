import styles from "./6529Gradient.module.scss";
import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { NFT } from "../../entities/INFT";
import { SortDirection } from "../../entities/ISort";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { areEqualAddresses, numberWithCommas } from "../../helpers/Helpers";
import { useRouter } from "next/router";
import { fetchAllPages } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";
import Address from "../address/Address";
import DotLoader from "../dotLoader/DotLoader";

enum Sort {
  ID = "id",
  TDH = "tdh",
}

interface Props {
  wallets: string[];
}

interface GradientNFT extends NFT {
  owner: `0x${string}`;
  owner_display: string;
  tdh_rank: number;
}

export default function GradientsComponent(props: Readonly<Props>) {
  const router = useRouter();

  const [nfts, setNfts] = useState<GradientNFT[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [nftsSorted, setNftsSorted] = useState(false);
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<Sort>(Sort.ID);

  function fetchResults() {
    const url = `${process.env.API_ENDPOINT}/api/nfts/gradients?&page_size=101&sort=${sort}&sort_direction=${sortDir}`;
    fetchAllPages(url).then((newNfts: GradientNFT[]) => {
      setNfts(newNfts);
      setNftsLoaded(true);
    });
  }

  useEffect(() => {
    if (sort && sortDir) {
      fetchResults();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (sort && sortDir) {
      router.replace(
        {
          query: { sort: sort, sort_dir: sortDir },
        },
        undefined,
        { shallow: true }
      );

      if (sort === Sort.ID) {
        if (sortDir === SortDirection.ASC) {
          setNfts([...nfts].sort((a, b) => (a.id > b.id ? 1 : -1)));
        } else {
          setNfts([...nfts].sort((a, b) => (a.id > b.id ? -1 : 1)));
        }
      }
      if (sort === Sort.TDH) {
        if (sortDir === SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => (a.boosted_tdh > b.boosted_tdh ? -1 : 1))
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => (a.boosted_tdh > b.boosted_tdh ? 1 : -1))
          );
        }
      }
      setNftsSorted(true);
    }
  }, [sortDir, sort]);

  function printNft(nft: GradientNFT) {
    return (
      <Col
        key={`${nft.contract}-${nft.id}`}
        className="pt-3 pb-3"
        xs={{ span: 6 }}
        sm={{ span: 4 }}
        md={{ span: 3 }}
        lg={{ span: 3 }}>
        <a
          href={`/6529-gradient/${nft.id}`}
          className="decoration-none scale-hover">
          <Container fluid className="no-padding">
            <Row>
              <Col>
                <NFTImage
                  nft={nft}
                  animation={false}
                  height={300}
                  balance={0}
                  showOwned={false}
                  showUnseized={false}
                  showThumbnail={true}
                />
              </Col>
            </Row>
            <Row>
              <Col className="text-center pt-2">{nft.name}</Col>
            </Row>
            <Row>
              <Col className="text-center">
                {props.wallets.some((w) => areEqualAddresses(w, nft.owner))
                  ? "*"
                  : ""}
                {nft.owner && (
                  <Address
                    wallets={[nft.owner]}
                    display={nft.owner_display}
                    hideCopy={true}
                  />
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
        </a>
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
              <Row>
                <Col>
                  <h1>
                    <span className="font-lightest">6529</span> Gradient
                  </h1>
                </Col>
              </Row>
              <Row className="pt-2">
                <Col>
                  Sort&nbsp;&nbsp;
                  <FontAwesomeIcon
                    icon="chevron-circle-up"
                    onClick={() => setSortDir(SortDirection.ASC)}
                    className={`${styles.sortDirection} ${
                      sortDir != SortDirection.ASC ? styles.disabled : ""
                    }`}
                  />{" "}
                  <FontAwesomeIcon
                    icon="chevron-circle-down"
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
