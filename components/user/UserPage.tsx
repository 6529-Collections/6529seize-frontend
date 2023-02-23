import styles from "./UserPage.module.scss";
import Image from "next/image";
import { Col, Container, Dropdown, Form, Row, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { Owner, OwnerTags } from "../../entities/IOwner";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import { NFT } from "../../entities/INFT";
import {
  areEqualAddresses,
  isGradientsContract,
  isMemesContract,
  numberWithCommas,
} from "../../helpers/Helpers";
import {
  GRADIENT_CONTRACT,
  MANIFOLD,
  MEMES_CONTRACT,
  SIX529_MUSEUM,
} from "../../constants";
import { TDHMetrics } from "../../entities/ITDH";
import { useAccount } from "wagmi";
import { SortDirection } from "../../entities/ISort";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchUrl } from "../../services/6529api";
import Pagination from "../pagination/Pagination";
import { TypeFilter } from "../latest-activity/LatestActivity";
import LatestActivityRow from "../latest-activity/LatestActivityRow";
import { Transaction } from "../../entities/ITransaction";

const NFTImage = dynamic(() => import("../nft-image/NFTImage"), {
  ssr: false,
});

const Address = dynamic(() => import("../address/Address"), { ssr: false });

interface Props {
  user: string;
}

enum Focus {
  COLLECTION,
  ACTIVITY,
}
enum Sort {
  ID = "id",
  TDH = "tdh",
  RANK = "tdh_rank",
}

const ACTIVITY_PAGE_SIZE = 25;

export default function UserPage(props: Props) {
  const router = useRouter();
  const { address, connector, isConnected } = useAccount();
  const [focus, setFocus] = useState<Focus>(Focus.COLLECTION);
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<Sort>(Sort.ID);

  const [user, setUser] = useState(
    props.user.toUpperCase() == "6529Museum".toUpperCase()
      ? SIX529_MUSEUM
      : props.user.toUpperCase() == "Manifold-Gallery".toUpperCase()
      ? MANIFOLD
      : props.user
  );

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const [ownerLoaded, setOwnerLoaded] = useState(false);

  const [ownerAddress, setOwnerAddress] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [ownerENS, setOwnerENS] = useState("");
  const [owned, setOwned] = useState<Owner[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [tdh, setTDH] = useState<TDHMetrics>();
  const [ownerTags, setOwnerTags] = useState<OwnerTags>();

  const [hideSeized, setHideSeized] = useState(false);
  const [hideNonSeized, setHideNonSeized] = useState(true);
  const [userIsOwner, setUserIsOwner] = useState(false);

  const [hideMemes, setHideMemes] = useState(false);
  const [hideGradients, setHideGradients] = useState(false);

  const [activity, setActivity] = useState<Transaction[]>([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState<TypeFilter>(
    TypeFilter.ALL
  );
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalResults, setActivityTotalResults] = useState(0);

  function getBalance(nft: NFT) {
    const balance = owned.find(
      (b) => b.token_id == nft.id && areEqualAddresses(b.contract, nft.contract)
    );
    if (balance) {
      return balance.balance;
    }
    return 0;
  }

  function findNftOrNull(tr: Transaction) {
    const nft = [...nfts].find(
      (n) => areEqualAddresses(tr.contract, n.contract) && tr.token_id == n.id
    );

    return nft;
  }

  useEffect(() => {
    async function fetchOwned(url: string, myowned: Owner[]) {
      return fetchUrl(url).then((response: DBResponse) => {
        if (response.next) {
          fetchOwned(response.next, [...myowned].concat(response.data));
        } else {
          const newOwned = [...myowned].concat(response.data);
          if (newOwned.length > 0) {
            setOwned(newOwned);
            setOwnerAddress(newOwned[0].wallet);
            let walletDisplay = newOwned[0].wallet as string;
            if (
              walletDisplay &&
              areEqualAddresses(walletDisplay, SIX529_MUSEUM)
            ) {
              walletDisplay = "6529Museum";
            }
            if (walletDisplay && areEqualAddresses(walletDisplay, MANIFOLD)) {
              walletDisplay = "Manifold Gallery";
            }
            walletDisplay = newOwned[0].wallet_display
              ? newOwned[0].wallet_display
              : walletDisplay.startsWith("0x")
              ? ""
              : walletDisplay;
            if (walletDisplay) {
              setOwnerENS(walletDisplay);
              router.push(walletDisplay.replaceAll(" ", "-"), undefined, {
                shallow: true,
              });
            }

            let walletCrumb = walletDisplay
              ? walletDisplay
              : newOwned[0].wallet;

            setBreadcrumbs([
              { display: "Home", href: "/" },
              {
                display: walletCrumb,
              },
            ]);
            setOwnerLoaded(true);
          } else {
            if (user.startsWith("0x") && user.length > 20) {
              setOwnerAddress(user as `0x${string}`);
              setOwnerLoaded(true);
            } else if (user.endsWith(".eth")) {
              setOwnerAddress(user as `0x${string}`);
              setOwnerENS(user);
              setOwnerLoaded(true);
            } else {
              window.location.href = "/404";
            }
          }
        }
      });
    }

    if (user && router.isReady) {
      const initialOwnersUrl = `${process.env.API_ENDPOINT}/api/owners?wallet=${user}`;
      fetchOwned(initialOwnersUrl, []);
    }
  }, [user, router.isReady]);

  useEffect(() => {
    async function fetchNfts(url: string, mynfts: NFT[]) {
      return fetchUrl(url).then((response: DBResponse) => {
        if (response.next) {
          fetchNfts(response.next, [...mynfts].concat(response.data));
        } else {
          const newnfts = [...mynfts].concat(response.data);
          setNfts(newnfts);
          setNftsLoaded(true);
        }
      });
    }

    if (ownerAddress && router.isReady) {
      let initialNftsUrl = `${process.env.API_ENDPOINT}/api/nfts?sort_direction=ASC`;
      if (isConnected && areEqualAddresses(ownerAddress, address)) {
        setUserIsOwner(true);
      } else {
        setUserIsOwner(false);
      }
      if (!nftsLoaded) {
        fetchNfts(initialNftsUrl, []);
      }
    }
  }, [ownerAddress, router.isReady, isConnected]);

  useEffect(() => {
    async function fetchTDH() {
      const url = `${process.env.API_ENDPOINT}/api/owner_metrics/?wallet=${ownerAddress}`;
      return fetchUrl(url).then((response: DBResponse) => {
        if (response && response.data.length == 1) {
          setTDH(response.data[0]);
        }
      });
    }

    if (ownerAddress && router.isReady) {
      fetchTDH();
    }
  }, [ownerAddress, router.isReady]);

  useEffect(() => {
    async function fetchOwnerTags(url: string) {
      return fetchUrl(url).then((response: DBResponse) => {
        if (response.data.length == 1) {
          setOwnerTags(response.data[0]);
        }
      });
    }

    if (tdh && router.isReady) {
      const initialUrlOwners = `${process.env.API_ENDPOINT}/api/owners_tags?wallet=${tdh.wallet}`;
      fetchOwnerTags(initialUrlOwners);
    }
  }, [router.isReady, tdh]);

  useEffect(() => {
    if (ownerAddress && router.isReady) {
      let url = `${process.env.API_ENDPOINT}/api/transactions?contract=${MEMES_CONTRACT}&wallet=${ownerAddress}&page_size=${ACTIVITY_PAGE_SIZE}&page=${activityPage}`;
      switch (activityTypeFilter) {
        case TypeFilter.SALES:
          url += `&filter=sales`;
          break;
        case TypeFilter.TRANSFERS:
          url += `&filter=transfers`;
          break;
        case TypeFilter.AIRDROPS:
          url += `&filter=airdrops`;
          break;
      }
      fetchUrl(url).then((response: DBResponse) => {
        setActivityTotalResults(response.count);
        setActivity(response.data);
      });
    }
  }, [activityPage, ownerAddress, router.isReady, activityTypeFilter]);

  useEffect(() => {
    if (sort && sortDir) {
      if (sort == Sort.ID) {
        if (sortDir == SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.contract > b.contract) {
                return 1;
              } else if (a.contract < b.contract) {
                return -1;
              } else {
                return a.id > b.id ? 1 : -1;
              }
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.contract > b.contract) {
                return 1;
              } else if (a.contract < b.contract) {
                return -1;
              } else {
                return a.id > b.id ? -1 : 1;
              }
            })
          );
        }
      }
      if (sort == Sort.TDH) {
        if (sortDir == SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              let atdh;
              let btdh;

              const aBalance = getBalance(a);
              const bBalance = getBalance(b);

              if (areEqualAddresses(a.contract, MEMES_CONTRACT)) {
                atdh = tdh?.memes.find((m) => m.id == a.id)?.tdh;
              } else if (areEqualAddresses(a.contract, GRADIENT_CONTRACT)) {
                atdh = tdh?.gradients.find((m) => m.id == a.id)?.tdh;
              }
              if (areEqualAddresses(b.contract, MEMES_CONTRACT)) {
                btdh = tdh?.memes.find((m) => m.id == b.id)?.tdh;
              } else if (areEqualAddresses(b.contract, GRADIENT_CONTRACT)) {
                btdh = tdh?.gradients.find((m) => m.id == b.id)?.tdh;
              }

              if (aBalance > 0 && !atdh) {
                atdh = 0;
              }
              if (bBalance > 0 && !btdh) {
                btdh = 0;
              }

              if (atdh != undefined && btdh != undefined) {
                if (atdh > btdh) {
                  return 1;
                } else if (atdh < btdh) {
                  return -1;
                } else {
                  return a.id > b.id ? 1 : -1;
                }
              } else {
                return aBalance > bBalance ? -1 : 1;
              }
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              let atdh;
              let btdh;

              const aBalance = getBalance(a);
              const bBalance = getBalance(b);

              if (areEqualAddresses(a.contract, MEMES_CONTRACT)) {
                atdh = tdh?.memes.find((m) => m.id == a.id)?.tdh;
              } else if (areEqualAddresses(a.contract, GRADIENT_CONTRACT)) {
                atdh = tdh?.gradients.find((m) => m.id == a.id)?.tdh;
              }
              if (areEqualAddresses(b.contract, MEMES_CONTRACT)) {
                btdh = tdh?.memes.find((m) => m.id == b.id)?.tdh;
              } else if (areEqualAddresses(b.contract, GRADIENT_CONTRACT)) {
                btdh = tdh?.gradients.find((m) => m.id == b.id)?.tdh;
              }

              if (aBalance > 0 && !atdh) {
                atdh = 0;
              }
              if (bBalance > 0 && !btdh) {
                btdh = 0;
              }
              if (atdh && btdh) {
                if (atdh > btdh) {
                  return -1;
                } else if (atdh < btdh) {
                  return 1;
                } else {
                  return a.id > b.id ? 1 : -1;
                }
              } else {
                return aBalance > bBalance ? -1 : 1;
              }
            })
          );
        }
      }
      if (sort == Sort.RANK) {
        if (sortDir == SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              let atdh;
              let btdh;

              const aBalance = getBalance(a);
              const bBalance = getBalance(b);

              if (areEqualAddresses(a.contract, MEMES_CONTRACT)) {
                atdh = tdh?.memes_ranks.find((m) => m.id == a.id)?.rank;
              } else if (areEqualAddresses(a.contract, GRADIENT_CONTRACT)) {
                atdh = tdh?.gradients_ranks.find((m) => m.id == a.id)?.rank;
              }
              if (areEqualAddresses(b.contract, MEMES_CONTRACT)) {
                btdh = tdh?.memes_ranks.find((m) => m.id == b.id)?.rank;
              } else if (areEqualAddresses(b.contract, GRADIENT_CONTRACT)) {
                btdh = tdh?.gradients_ranks.find((m) => m.id == b.id)?.rank;
              }

              if (aBalance > 0 && !atdh) {
                atdh = 0;
              }
              if (bBalance > 0 && !btdh) {
                btdh = 0;
              }

              if (atdh != undefined && btdh != undefined) {
                if (atdh > btdh) {
                  return 1;
                } else if (atdh < btdh) {
                  return -1;
                } else {
                  return a.id > b.id ? 1 : -1;
                }
              } else {
                return aBalance > bBalance ? -1 : 1;
              }
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              let atdh;
              let btdh;

              const aBalance = getBalance(a);
              const bBalance = getBalance(b);

              if (areEqualAddresses(a.contract, MEMES_CONTRACT)) {
                atdh = tdh?.memes_ranks.find((m) => m.id == a.id)?.rank;
              } else if (areEqualAddresses(a.contract, GRADIENT_CONTRACT)) {
                atdh = tdh?.gradients_ranks.find((m) => m.id == a.id)?.rank;
              }
              if (areEqualAddresses(b.contract, MEMES_CONTRACT)) {
                btdh = tdh?.memes_ranks.find((m) => m.id == b.id)?.rank;
              } else if (areEqualAddresses(b.contract, GRADIENT_CONTRACT)) {
                btdh = tdh?.gradients_ranks.find((m) => m.id == b.id)?.rank;
              }

              if (aBalance > 0 && !atdh) {
                atdh = 0;
              }
              if (bBalance > 0 && !btdh) {
                btdh = 0;
              }
              if (atdh && btdh) {
                if (atdh > btdh) {
                  return -1;
                } else if (atdh < btdh) {
                  return 1;
                } else {
                  return a.id > b.id ? 1 : -1;
                }
              } else {
                return aBalance > bBalance ? -1 : 1;
              }
            })
          );
        }
      }
    }
  }, [sortDir, sort]);

  function printNft(nft: NFT) {
    let nfttdh;
    let nftrank;
    const nftbalance = getBalance(nft);

    const isMemes = isMemesContract(nft.contract);
    const isGradients = isGradientsContract(nft.contract);

    if (isMemes && tdh?.memes) {
      nfttdh = tdh?.memes.find((m) => m.id == nft.id)?.tdh;
      nftrank = tdh?.memes_ranks.find((g) => g.id == nft.id)?.rank;
    } else if (isGradients && tdh?.gradients) {
      nfttdh = tdh?.gradients.find((m) => m.id == nft.id)?.tdh;
      nftrank = tdh?.gradients_ranks.find((g) => g.id == nft.id)?.rank;
    }

    if (nftbalance > 0 && hideSeized) {
      return;
    }
    if (nftbalance == 0 && (hideNonSeized || isGradients)) {
      return;
    }
    if (nftbalance > 0 && isGradients && hideGradients) {
      return;
    }
    if (nftbalance > 0 && isMemes && hideMemes) {
      return;
    }

    return (
      <Col
        key={`${nft.contract}-${nft.id}`}
        className="pt-3 pb-3"
        xs={{ span: 6 }}
        sm={{ span: 4 }}
        md={{ span: 3 }}
        lg={{ span: 3 }}>
        <Container fluid className="no-padding">
          <Row>
            <Col>
              <a
                href={`/${
                  areEqualAddresses(nft.contract, MEMES_CONTRACT)
                    ? "the-memes"
                    : "6529-gradient"
                }/${nft.id}`}>
                <NFTImage
                  nft={nft}
                  animation={false}
                  height={300}
                  missing={nftbalance == 0}
                  balance={
                    areEqualAddresses(nft.contract, GRADIENT_CONTRACT)
                      ? 0
                      : nftbalance
                  }
                  showOwned={
                    areEqualAddresses(nft.contract, GRADIENT_CONTRACT) &&
                    nftbalance > 0
                      ? true
                      : false
                  }
                  showThumbnail={true}
                />
              </a>
            </Col>
          </Row>
          <Row>
            <Col className="text-center pt-2">
              <a
                href={`/${
                  areEqualAddresses(nft.contract, MEMES_CONTRACT)
                    ? "the-memes"
                    : "6529-gradient"
                }/${nft.id}`}>
                {nft.name}
              </a>
            </Col>
          </Row>
          {nfttdh && nftrank && (
            <Row>
              <Col className="text-center pt-2">
                TDH: {numberWithCommas(Math.round(nfttdh))} | Rank #{nftrank}
              </Col>
            </Row>
          )}
          {!nfttdh && !nftrank && nftbalance > 0 && (
            <Row>
              <Col className="text-center pt-2">TDH: 0 | Rank N/A</Col>
            </Row>
          )}
        </Container>
      </Col>
    );
  }

  function printNfts() {
    return <Row className="pt-2">{nfts.map((nft) => printNft(nft))}</Row>;
  }

  function printUserControls() {
    return (
      <Row className="pt-3">
        <Col>
          <Form.Check
            type="switch"
            className={`${styles.seizedToggle}`}
            label={`Hide Non-Seized`}
            checked={hideNonSeized}
            onChange={() => setHideNonSeized(!hideNonSeized)}
          />
          <Form.Check
            type="switch"
            className={`${styles.seizedToggle}`}
            label={`Hide Seized`}
            checked={hideSeized}
            onChange={() => setHideSeized(!hideSeized)}
          />
          {ownerTags &&
            ownerTags?.memes_balance > 0 &&
            ownerTags?.gradients_balance > 0 && (
              <>
                <Form.Check
                  type="switch"
                  className={`${styles.seizedToggle}`}
                  label={`Hide Gradients`}
                  checked={hideGradients}
                  onChange={() => {
                    setHideGradients(!hideGradients);
                  }}
                />
                <Form.Check
                  type="switch"
                  className={`${styles.seizedToggle}`}
                  label={`Hide Memes`}
                  checked={hideMemes}
                  onChange={() => {
                    setHideMemes(!hideMemes);
                  }}
                />
              </>
            )}
        </Col>
      </Row>
    );
  }

  return (
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <Container fluid className={styles.mainContainer}>
        <Row>
          <Col>
            <Container className="mt-2 pt-2 pb-2">
              <Row>
                <Col className="text-right">
                  {/* {ownerAddress && (
                    <TwitterShareButton
                      className="twitter-share-button"
                      url={window.location.href.split("?")[0]}
                      title={`${
                        ownerENS
                          ? ownerENS
                          : formatAddress(ownerAddress as string)
                      }'s SEIZE Collection${
                        tdh
                          ? `\n\nCards\nx${numberWithCommas(
                              tdh.balance
                            )} - \Rank #${
                              tdh.dense_rank_balance
                            }\n\nTDH\n${numberWithCommas(
                              tdh.boosted_tdh
                            )} - \Rank #${tdh.tdh_rank}`
                          : ""
                      }\n\n#6529SEIZE\n\n`}>
                      <TwitterIcon
                        size={30}
                        round
                        iconFillColor="white"
                        bgStyle={{ fill: "transparent" }}
                      />
                      Tweet
                    </TwitterShareButton>
                  )} */}
                </Col>
              </Row>
              <Row className="pt-3">
                <Col
                  className="text-center d-flex align-items-center justify-content-center"
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 6 }}
                  lg={{ span: 6 }}>
                  <Container className="p-0">
                    {ownerAddress && (
                      <>
                        <Row>
                          <h2 className={styles.ownerAddress}>
                            {ownerTags ? (
                              <Address
                                address={ownerAddress}
                                ens={ownerENS}
                                tags={{
                                  memesCardsSets: ownerTags.memes_cards_sets,
                                  memesCardsSetS1:
                                    ownerTags.memes_cards_sets_szn1,
                                  memesCardsSetS2:
                                    ownerTags.memes_cards_sets_szn2,
                                  memesBalance: ownerTags.unique_memes,
                                  gradientsBalance: ownerTags.gradients_balance,
                                  genesis: ownerTags.genesis,
                                  tdh_rank: tdh ? tdh?.tdh_rank : -1,
                                  balance_rank: tdh
                                    ? tdh?.dense_rank_balance
                                    : -1,
                                }}
                                expandedTags={true}
                                isUserPage={true}
                                disableLink={true}
                              />
                            ) : (
                              <Address
                                address={ownerAddress}
                                ens={ownerENS}
                                disableLink={true}
                              />
                            )}
                          </h2>
                        </Row>
                        <Row className="pt-3">
                          <Col>
                            <a
                              href={`https://opensea.io/${ownerAddress}`}
                              target="_blank"
                              rel="noreferrer">
                              <Image
                                className={styles.marketplace}
                                src="/opensea.png"
                                alt="opensea"
                                width={40}
                                height={40}
                              />
                            </a>
                            <a
                              href={`https://x2y2.io/user/${ownerAddress}`}
                              target="_blank"
                              rel="noreferrer">
                              <Image
                                className={styles.marketplace}
                                src="/x2y2.png"
                                alt="x2y2"
                                width={40}
                                height={40}
                              />
                            </a>
                          </Col>
                        </Row>
                      </>
                    )}
                  </Container>
                </Col>
                {tdh && (
                  <Col
                    className="text-left pt-2"
                    xs={{ span: 12 }}
                    sm={{ span: 12 }}
                    md={{ span: 6 }}
                    lg={{ span: 6 }}>
                    <Table className={styles.primaryTable}>
                      <tbody>
                        <tr>
                          <td colSpan={3}>
                            <h4>Cards HODLed</h4>
                          </td>
                        </tr>
                        <tr>
                          <td></td>
                          <td>
                            <b>Total</b>
                          </td>
                          <td>
                            <b>Memes</b>
                          </td>
                          <td>
                            <b>Memes SZN1</b>
                          </td>
                          <td>
                            <b>Memes SZN2</b>
                          </td>
                          <td>
                            <b>6529 Gradient</b>
                          </td>
                        </tr>
                        <tr className={styles.primaryTableGap}></tr>
                        <tr>
                          <td>
                            <b>Cards</b>
                          </td>
                          <td>
                            x
                            {numberWithCommas(
                              tdh.memes_balance + tdh.gradients_balance
                            )}
                          </td>
                          <td>
                            {tdh.memes_balance > 0
                              ? `x${numberWithCommas(tdh.memes_balance)}`
                              : "-"}
                          </td>
                          <td>
                            {tdh.memes_balance_season1 > 0
                              ? `x${numberWithCommas(
                                  tdh.memes_balance_season1
                                )}`
                              : "-"}
                          </td>
                          <td>
                            {tdh.memes_balance_season2 > 0
                              ? `x${numberWithCommas(
                                  tdh.memes_balance_season2
                                )}`
                              : "-"}
                          </td>
                          <td>
                            {tdh.gradients_balance > 0
                              ? `x${numberWithCommas(tdh.gradients_balance)}`
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <b>Unique</b>
                          </td>
                          <td>
                            x
                            {numberWithCommas(
                              tdh.unique_memes + tdh.gradients_balance
                            )}
                          </td>
                          <td>
                            {tdh.unique_memes > 0
                              ? `x${numberWithCommas(tdh.unique_memes)}`
                              : "-"}
                          </td>
                          <td>
                            {tdh.unique_memes_szn1 > 0
                              ? `x${numberWithCommas(tdh.unique_memes_szn1)}`
                              : "-"}
                          </td>
                          <td>
                            {tdh.unique_memes_szn2 > 0
                              ? `x${numberWithCommas(tdh.unique_memes_szn2)}`
                              : "-"}
                          </td>
                          <td>
                            {tdh.gradients_balance > 0
                              ? `x${numberWithCommas(tdh.gradients_balance)}`
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <b>Rank</b>
                          </td>
                          <td>
                            #{numberWithCommas(tdh.dense_rank_balance)}
                            {tdh.dense_rank_balance__ties > 1 && ` (tie)`}
                          </td>
                          <td>
                            {tdh.memes_balance > 0
                              ? `#${numberWithCommas(
                                  tdh.dense_rank_balance_memes
                                )}${
                                  tdh.dense_rank_balance_memes__ties > 1
                                    ? ` (tie)`
                                    : ""
                                }`
                              : "-"}
                          </td>
                          <td>
                            {tdh.memes_balance_season1 > 0
                              ? `#${numberWithCommas(
                                  tdh.dense_rank_balance_memes_season1
                                )}${
                                  tdh.dense_rank_balance_memes_season1__ties > 1
                                    ? ` (tie)`
                                    : ""
                                }`
                              : "-"}
                          </td>
                          <td>
                            {tdh.memes_balance_season2 > 0
                              ? `#${numberWithCommas(
                                  tdh.dense_rank_balance_memes_season2
                                )}${
                                  tdh.dense_rank_balance_memes_season2__ties > 1
                                    ? ` (tie)`
                                    : ""
                                }`
                              : "-"}
                          </td>
                          <td>
                            {tdh.gradients_balance > 0
                              ? `#${numberWithCommas(
                                  tdh.dense_rank_balance_gradients
                                )}${
                                  tdh.dense_rank_balance_gradients__ties > 1
                                    ? ` (tie)`
                                    : ""
                                }`
                              : "-"}
                          </td>
                        </tr>
                        <tr className={styles.primaryTableGap}></tr>
                        <tr>
                          <td>
                            <b>TDH</b>
                          </td>
                          <td>{numberWithCommas(tdh.boosted_tdh)}</td>
                          <td>
                            {numberWithCommas(
                              Math.round(tdh.boosted_memes_tdh)
                            )}
                          </td>
                          <td>
                            {numberWithCommas(
                              Math.round(tdh.boosted_memes_tdh_season1)
                            )}
                          </td>
                          <td>
                            {numberWithCommas(
                              Math.round(tdh.boosted_memes_tdh_season2)
                            )}
                          </td>
                          <td>
                            {numberWithCommas(
                              Math.round(tdh.boosted_gradients_tdh)
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <b>Rank</b>
                          </td>
                          <td>
                            {tdh.tdh_rank > 0
                              ? `#${numberWithCommas(tdh.tdh_rank)}`
                              : "-"}
                          </td>
                          <td>
                            {tdh.tdh_rank_memes > 0
                              ? `#${numberWithCommas(tdh.tdh_rank_memes)}`
                              : "-"}
                          </td>
                          <td>
                            {tdh.tdh_rank_memes_szn1 > 0
                              ? `#${numberWithCommas(tdh.tdh_rank_memes_szn1)}`
                              : "-"}
                          </td>
                          <td>
                            {tdh.tdh_rank_memes_szn2 > 0
                              ? `#${numberWithCommas(tdh.tdh_rank_memes_szn2)}`
                              : "-"}
                          </td>
                          <td>
                            {tdh.tdh_rank_gradients > 0
                              ? `#${numberWithCommas(tdh.tdh_rank_gradients)}`
                              : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    <Table className={styles.secondaryTable}>
                      <tbody>
                        <tr>
                          <td>
                            <h4>In</h4>
                          </td>
                        </tr>
                        <tr>
                          <td>Purchases</td>
                          <td>
                            {tdh.purchases_count > 0
                              ? `x${numberWithCommas(tdh.purchases_count)}`
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <td>Purchases (ETH)</td>
                          <td>
                            {tdh.purchases_value > 0
                              ? `${numberWithCommas(
                                  Math.round(tdh.purchases_value * 100) / 100
                                )}`
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <td>Transfers In</td>
                          <td>
                            {tdh.transfers_in > 0
                              ? `x${numberWithCommas(tdh.transfers_in)}`
                              : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    <Table
                      className={`${styles.secondaryTable} ${styles.secondaryTableMargin} pt-2`}>
                      <tbody>
                        <tr>
                          <td>
                            <h4>Out</h4>
                          </td>
                        </tr>
                        <tr>
                          <td>Sales</td>
                          <td>
                            {tdh.sales_count > 0
                              ? `x${numberWithCommas(tdh.sales_count)}`
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <td>Sales (ETH)</td>
                          <td>
                            {tdh.sales_value > 0
                              ? `${numberWithCommas(
                                  Math.round(tdh.sales_value * 100) / 100
                                )}`
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <td>Transfers Out</td>
                          <td>
                            {tdh.transfers_out > 0
                              ? `x${numberWithCommas(tdh.transfers_out)}`
                              : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                )}
              </Row>
            </Container>
            <Container>
              <Row className="pt-3 pb-3">
                {focus == Focus.COLLECTION && (
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
                )}
                <Col className="d-flex justify-content-end">
                  <h3
                    className={
                      focus == Focus.COLLECTION
                        ? styles.focusActive
                        : styles.focus
                    }
                    onClick={() => setFocus(Focus.COLLECTION)}>
                    Collection
                  </h3>
                  <h3>&nbsp;|&nbsp;</h3>
                  <h3
                    className={
                      focus == Focus.ACTIVITY
                        ? styles.focusActive
                        : styles.focus
                    }
                    onClick={() => setFocus(Focus.ACTIVITY)}>
                    Activity
                  </h3>
                </Col>
              </Row>
              {focus == Focus.COLLECTION && (
                <>
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
                      <span
                        onClick={() => setSort(Sort.RANK)}
                        className={`${styles.sort} ${
                          sort != Sort.RANK ? styles.disabled : ""
                        }`}>
                        RANK
                      </span>
                    </Col>
                  </Row>
                  {printUserControls()}
                  {ownerLoaded &&
                    (owned.length > 0 ? (
                      printNfts()
                    ) : (
                      <Col>
                        <Image
                          loading={"lazy"}
                          width="0"
                          height="0"
                          style={{ height: "auto", width: "100px" }}
                          src="/SummerGlasses.svg"
                          alt="SummerGlasses"
                        />{" "}
                        Nothing here yet
                      </Col>
                    ))}
                </>
              )}
              {focus == Focus.ACTIVITY && (
                <>
                  <Row>
                    <Col
                      className="d-flex align-items-center"
                      xs={{ span: 7 }}
                      sm={{ span: 7 }}
                      md={{ span: 9 }}
                      lg={{ span: 10 }}>
                      <h3>Wallet Activity</h3>
                    </Col>
                    <Col
                      xs={{ span: 5 }}
                      sm={{ span: 5 }}
                      md={{ span: 3 }}
                      lg={{ span: 2 }}>
                      <Dropdown
                        className={styles.activityFilterDropdown}
                        drop={"down-centered"}>
                        <Dropdown.Toggle>
                          Filter: {activityTypeFilter}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {Object.values(TypeFilter).map((filter) => (
                            <Dropdown.Item
                              key={`nft-activity-${filter}`}
                              onClick={() => {
                                setActivityPage(1);
                                setActivityTypeFilter(filter);
                              }}>
                              {filter}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>
                  </Row>
                  <Row className={`pt-2 ${styles.transactionsScrollContainer}`}>
                    <Col>
                      {activity.length > 0 ? (
                        <Table
                          bordered={false}
                          className={styles.transactionsTable}>
                          <tbody>
                            {activity.map((tr) => (
                              <LatestActivityRow
                                tr={tr}
                                nft={findNftOrNull(tr)}
                                key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
                              />
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <>
                          <Image
                            loading={"lazy"}
                            width="0"
                            height="0"
                            style={{ height: "auto", width: "100px" }}
                            src="/SummerGlasses.svg"
                            alt="SummerGlasses"
                          />{" "}
                          Nothing here yet
                        </>
                      )}
                    </Col>
                  </Row>
                  {activity.length > 0 && (
                    <Row className="text-center pt-2 pb-3">
                      <Pagination
                        page={activityPage}
                        pageSize={ACTIVITY_PAGE_SIZE}
                        totalResults={activityTotalResults}
                        setPage={function (newPage: number) {
                          setActivityPage(newPage);
                          window.scrollTo(0, 0);
                        }}
                      />
                    </Row>
                  )}
                </>
              )}
            </Container>
          </Col>
        </Row>
      </Container>
    </>
  );
}
