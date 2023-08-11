import styles from "./6529Gradient.module.scss";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { GRADIENT_CONTRACT } from "../../constants";
import { NFT } from "../../entities/INFT";
import { Owner } from "../../entities/IOwner";
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
  TDH = "tdh_rank",
}

interface Props {
  wallets: string[];
}

export default function GradientsComponent(props: Props) {
  const router = useRouter();

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [nftOwners, setNftOwners] = useState<Owner[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [nftsSorted, setNftsSorted] = useState(false);
  const [sortDir, setSortDir] = useState<SortDirection>();
  const [sort, setSort] = useState<Sort>();

  const [ownersLoaded, setOwnersLoaded] = useState(false);

  useEffect(() => {
    if (router.isReady && ownersLoaded && nftsLoaded) {
      let initialSortDir = SortDirection.ASC;
      let initialSort = Sort.ID;

      const routerSortDir = router.query.sort_dir;
      if (routerSortDir) {
        const resolvedRouterSortDir = Object.values(SortDirection).find(
          (sd) => sd === routerSortDir
        );
        if (resolvedRouterSortDir) {
          initialSortDir = resolvedRouterSortDir;
        }
      }

      const routerSort = router.query.sort;
      if (routerSort) {
        const resolvedRouterSort = Object.values(Sort).find(
          (sd) => sd === routerSort
        );
        if (resolvedRouterSort) {
          initialSort = resolvedRouterSort;
        }
      }

      setSort(initialSort);
      setSortDir(initialSortDir);
    }
  }, [router.isReady, ownersLoaded, nftsLoaded]);

  useEffect(() => {
    async function fetchNfts(url: string) {
      fetchAllPages(url).then((newNfts: NFT[]) => {
        setNfts(
          [...newNfts]
            .sort((a, b) => (a.tdh > b.tdh ? -1 : 1))
            .map((n, index) => {
              n.tdh_rank = index + 1;
              return n;
            })
        );
        setNftsLoaded(true);
      });
    }
    if (router.isReady) {
      const initialUrlNfts = `${process.env.API_ENDPOINT}/api/nfts?contract=${GRADIENT_CONTRACT}`;
      fetchNfts(initialUrlNfts);
    }
  }, [router.isReady]);

  useEffect(() => {
    async function fetchOwners(url: string) {
      fetchAllPages(url).then((newOwners: Owner[]) => {
        if (!ownersLoaded) {
          const allOwners: Owner[] = [];
          [...nfts]
            .sort((a, b) => (a.tdh > b.tdh ? -1 : 1))
            .map((nft) => {
              const owner = newOwners.find((o) => o.token_id === nft.id);
              if (owner) {
                allOwners.push(owner);
              }
            });
          setNftOwners(allOwners);
          setOwnersLoaded(true);
        }
      });
    }

    if (router.isReady && nftsLoaded) {
      const initialUrlOwners = `${process.env.API_ENDPOINT}/api/owners?contract=${GRADIENT_CONTRACT}`;
      fetchOwners(initialUrlOwners);
    }
  }, [router.isReady, nftsLoaded]);

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
          setNfts([...nfts].sort((a, b) => (a.tdh > b.tdh ? -1 : 1)));
        } else {
          setNfts([...nfts].sort((a, b) => (a.tdh > b.tdh ? 1 : -1)));
        }
      }
      setNftsSorted(true);
    }
  }, [sortDir, sort]);

  function printNft(nft: NFT) {
    const owner = nftOwners.find((o) => o.token_id === nft.id);
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
          className="decoration-none decoration-hover-underline scale-hover">
          <Container fluid className="no-padding">
            <Row>
              <Col>
                <NFTImage
                  nft={nft}
                  animation={false}
                  height={300}
                  balance={0}
                  showOwned={
                    owner &&
                    props.wallets.some((w) =>
                      areEqualAddresses(w, owner.wallet)
                    )
                  }
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
                {owner &&
                props.wallets.some((w) => areEqualAddresses(w, owner.wallet))
                  ? "*"
                  : ""}
                {owner && (
                  <Address
                    wallets={[owner.wallet]}
                    display={owner.wallet_display}
                    hideCopy={true}
                  />
                )}
              </Col>
            </Row>
            {owner && (
              <Row>
                <Col className="text-center pt-2">
                  TDH: <b>{numberWithCommas(Math.round(nft.tdh))}</b> | Rank:{" "}
                  <b>
                    {nft.tdh_rank}/{nfts.length}
                  </b>
                </Col>
              </Row>
            )}
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
                  <h1>6529 GRADIENT</h1>
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
              {nftsSorted ? (
                nfts.length > 0 ? (
                  printNfts()
                ) : (
                  <Col>
                    <Image
                      width="0"
                      height="0"
                      style={{ height: "auto", width: "100px" }}
                      src="/SummerGlasses.svg"
                      alt="SummerGlasses"
                    />{" "}
                    Nothing here yet
                  </Col>
                )
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
