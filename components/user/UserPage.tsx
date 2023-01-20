import styles from "./User.module.scss";

import { Col, Container, Form, Row, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { Owner, OwnerTags } from "../../entities/IOwner";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import { NFT } from "../../entities/INFT";
import {
  areEqualAddresses,
  formatAddress,
  getDateDisplay,
  nextTdh,
  numberWithCommas,
} from "../../helpers/Helpers";
import {
  GRADIENT_CONTRACT,
  MANIFOLD,
  MEMES_CONTRACT,
  SIX529_MUSEUM,
} from "../../constants";
import { TDH, TDHCalc, TDHMetrics } from "../../entities/ITDH";
import { useAccount } from "wagmi";
import { SortDirection } from "../../entities/ISort";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TwitterShareButton, TwitterIcon } from "react-share";

const NFTImage = dynamic(() => import("../nft-image/NFTImage"), {
  ssr: false,
});

const Address = dynamic(() => import("../address/Address"), { ssr: false });

interface Props {
  user: string;
}

enum Sort {
  ID = "id",
  TDH = "tdh",
  RANK = "tdh_rank",
}

export default function UserPage(props: Props) {
  const router = useRouter();
  const { address, connector, isConnected } = useAccount();
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
  const [showNonSeized, setShowNonSeized] = useState(true);
  const [userIsOwner, setUserIsOwner] = useState(false);
  const [lastTDH, setLastTDH] = useState<TDHCalc>();

  const [hideMemes, setHideMemes] = useState(false);
  const [hideGradients, setHideGradients] = useState(false);

  function getBalance(nft: NFT) {
    const balance = owned.find(
      (b) => b.token_id == nft.id && areEqualAddresses(b.contract, nft.contract)
    );
    if (balance) {
      return balance.balance;
    }
    return 0;
  }

  printNextTdhCountdown();

  function printNextTdhCountdown() {
    var tdhDiv1 = document.getElementById("next-tdh-div-1");

    setInterval(function () {
      if (tdhDiv1) {
        tdhDiv1.innerHTML = nextTdh();
      }
    }, 1000);
  }

  useEffect(() => {
    fetch(`${process.env.API_ENDPOINT}/api/blocks?page_size=${1}`)
      .then((res) => res.json())
      .then((response: DBResponse) => {
        if (response.data.length > 0) {
          setLastTDH({
            block: response.data[0].block_number,
            date: new Date(response.data[0].timestamp),
          });
        }
      });
  }, []);

  useEffect(() => {
    async function fetchOwned(url: string, myowned: Owner[]) {
      return fetch(url)
        .then((res) => res.json())
        .then((response: DBResponse) => {
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
                router.push(walletDisplay.replace(" ", "-"), undefined, {
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
      return fetch(url)
        .then((res) => res.json())
        .then((response: DBResponse) => {
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
      let initialNftsUrl = "";
      if (isConnected && areEqualAddresses(ownerAddress, address)) {
        setUserIsOwner(true);
        setShowNonSeized(true);
        initialNftsUrl = `${process.env.API_ENDPOINT}/api/nfts?sort_direction=ASC`;
      } else {
        setUserIsOwner(false);
        initialNftsUrl = `${process.env.API_ENDPOINT}/api/${ownerAddress}/nfts`;
      }
      if (!nftsLoaded) {
        fetchNfts(initialNftsUrl, []);
      }
    }
  }, [ownerAddress, router.isReady, isConnected]);

  useEffect(() => {
    async function fetchTDH() {
      const url = `${process.env.API_ENDPOINT}/api/owner_metrics/?wallet=${ownerAddress}`;
      return fetch(url)
        .then((res) => res.json())
        .then((response: DBResponse) => {
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
      return fetch(url)
        .then((res) => res.json())
        .then((response: DBResponse) => {
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

    const isMemes = areEqualAddresses(nft.contract, MEMES_CONTRACT);
    const isGradients = areEqualAddresses(nft.contract, GRADIENT_CONTRACT);

    if (isMemes) {
      nfttdh = tdh?.memes.find((m) => m.id == nft.id)?.tdh;
      nftrank = tdh?.memes_ranks.find((g) => g.id == nft.id)?.rank;
    } else if (isGradients) {
      nfttdh = tdh?.gradients.find((m) => m.id == nft.id)?.tdh;
      nftrank = tdh?.gradients_ranks.find((g) => g.id == nft.id)?.rank;
    }

    if (
      (nftbalance > 0 || (userIsOwner && showNonSeized && isMemes)) &&
      // ((hideMemes && !isMemes) ||
      //   (hideGradients && !isGradients) ||
      //   (!hideMemes && isMemes) ||
      //   (!hideGradients && isGradients))
      ((!hideMemes && isMemes) || (!hideGradients && isGradients))
    )
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
          {ownerAddress && address && userIsOwner && (
            <Form.Check
              type="switch"
              className={`${styles.seizedToggle}`}
              label={`Hide Non-Seized`}
              onClick={() => setShowNonSeized(!showNonSeized)}
            />
          )}
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
                  {ownerAddress && (
                    <TwitterShareButton
                      className="twitter-share-button"
                      url={window.location.href.split("?")[0]}
                      title={`${
                        ownerENS
                          ? ownerENS
                          : formatAddress(ownerAddress as string)
                      }'s 6529 Collection${`\nTDH ${
                        tdh ? tdh.boosted_tdh : "N/A"
                      } - \Rank ${
                        tdh ? tdh.tdh_rank : "N/A"
                      }`}\n#6529Seize\n\n`}>
                      <TwitterIcon
                        size={30}
                        round
                        iconFillColor="white"
                        bgStyle={{ fill: "transparent" }}
                      />
                      Tweet
                    </TwitterShareButton>
                  )}
                </Col>
              </Row>
              <Row className="pt-3">
                <Col
                  className="text-center d-flex align-items-center justify-content-center"
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 6 }}
                  lg={{ span: 6 }}>
                  <h2 className={styles.ownerAddress}>
                    {ownerTags ? (
                      <Address
                        address={ownerAddress}
                        ens={ownerENS}
                        tags={{
                          memesCardsSets: ownerTags.memes_cards_sets,
                          memesCardsSetS1: ownerTags.memes_cards_sets_szn1,
                          memesCardsSetS2: ownerTags.memes_cards_sets_szn2,
                          memesBalance: ownerTags.unique_memes,
                          gradientsBalance: ownerTags.gradients_balance,
                          genesis: ownerTags.genesis,
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
                          {lastTDH && (
                            <td
                              className={`text-right ${styles.lastTDH}`}
                              colSpan={3}>
                              * TDH Block&nbsp;
                              <a
                                href={`https://etherscan.io/block/${lastTDH.block}`}
                                rel="noreferrer"
                                target="_blank">
                                {lastTDH.block}
                              </a>
                              &nbsp;|&nbsp;Next Calculation&nbsp;
                              <span id="next-tdh-div-1">{nextTdh()}</span>
                            </td>
                          )}
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
                            <b>Balance</b>
                          </td>
                          <td>{numberWithCommas(tdh.balance)}</td>
                          <td>{numberWithCommas(tdh.memes_balance)}</td>
                          <td>{numberWithCommas(tdh.memes_balance_season1)}</td>
                          <td>{numberWithCommas(tdh.memes_balance_season2)}</td>
                          <td>{numberWithCommas(tdh.gradients_balance)}</td>
                        </tr>
                        <tr>
                          <td>
                            <b>Rank</b>
                          </td>
                          <td>#{numberWithCommas(tdh.tdh_rank)}</td>
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
              <Row className="pt-2 pb-2">
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
                    <img src="/SummerGlasses.svg" className="icon-100" />{" "}
                    Nothing here yet
                  </Col>
                ))}
            </Container>
          </Col>
        </Row>
      </Container>
    </>
  );
}
