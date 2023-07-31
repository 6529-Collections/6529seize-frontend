import styles from "./UserPage.module.scss";
import Image from "next/image";
import {
  Accordion,
  Col,
  Container,
  Dropdown,
  Form,
  Row,
  Table,
  Button,
} from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { Owner } from "../../entities/IOwner";
import { useRouter } from "next/router";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import { MemesExtendedData, NFT } from "../../entities/INFT";
import {
  areEqualAddresses,
  containsEmojis,
  formatAddress,
  isEmptyObject,
  isGradientsContract,
  isMemesContract,
  numberWithCommas,
  parseEmojis,
  removeProtocol,
} from "../../helpers/Helpers";
import {
  GRADIENT_CONTRACT,
  MANIFOLD,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  SIX529_MUSEUM,
} from "../../constants";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../entities/ITDH";
import { useEnsAvatar } from "wagmi";
import { SortDirection } from "../../entities/ISort";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import Pagination from "../pagination/Pagination";
import { TypeFilter } from "../latest-activity/LatestActivity";
import LatestActivityRow from "../latest-activity/LatestActivityRow";
import { Transaction } from "../../entities/ITransaction";
import { ReservedUser } from "../../pages/[user]";
import Tippy from "@tippyjs/react";
import { IDistribution } from "../../entities/IDistribution";
import Tag, { TagType } from "../address/Tag";
import ConsolidationSwitch, {
  VIEW,
} from "../consolidation-switch/ConsolidationSwitch";
import Address from "../address/Address";
import NFTImage from "../nft-image/NFTImage";
import NotFound from "../notFound/NotFound";

interface Props {
  user: string;
}

enum Focus {
  COLLECTION,
  ACTIVITY,
  DISTRIBUTIONS,
}

enum Sort {
  ID = "id",
  TDH = "tdh",
  RANK = "tdh_rank",
}

const ACTIVITY_PAGE_SIZE = 25;
const DISTRIBUTIONS_PAGE_SIZE = 25;

export default function UserPage(props: Props) {
  const router = useRouter();
  const [view, setView] = useState<VIEW>(VIEW.WALLET);
  const [focus, setFocus] = useState<Focus>(Focus.COLLECTION);
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<Sort>(Sort.ID);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [nftMetas, setNftMetas] = useState<MemesExtendedData[]>([]);
  const [ownerLinkCopied, setIsOwnerLinkCopied] = useState(false);

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const [walletOwnedLoaded, setWalletOwnedLoaded] = useState(false);
  const [consolidationOwnedLoaded, setConsolidationOwnedLoaded] =
    useState(false);
  const [ownedLoaded, setOwnedLoaded] = useState(false);

  const [ownerAddress, setOwnerAddress] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [ownerENS, setOwnerENS] = useState("");

  const ensAvatar = useEnsAvatar({ chainId: 1 });
  const [ownerLinkDisplay, setOwnerLinkDisplay] = useState("");
  const [owned, setOwned] = useState<Owner[]>([]);
  const [walletOwned, setWalletOwned] = useState<Owner[]>([]);
  const [consolidationOwned, setConsolidationOwned] = useState<Owner[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);
  const [walletTDH, setWalletTDH] = useState<TDHMetrics>();
  const [consolidatedTDH, setConsolidatedTDH] =
    useState<ConsolidatedTDHMetrics>();
  const [tdh, setTDH] = useState<ConsolidatedTDHMetrics | TDHMetrics>();
  const [isConsolidation, setIsConsolidation] = useState(false);

  const [hideSeized, setHideSeized] = useState(false);
  const [hideNonSeized, setHideNonSeized] = useState(true);

  const [hideMemes, setHideMemes] = useState(false);
  const [hideGradients, setHideGradients] = useState(false);

  const [activity, setActivity] = useState<Transaction[]>([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState<TypeFilter>(
    TypeFilter.ALL
  );
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalResults, setActivityTotalResults] = useState(0);

  const [distributions, setDistributions] = useState<IDistribution[]>([]);
  const [distributionsPage, setDistributionsPage] = useState(1);
  const [distributionsTotalResults, setDistributionsTotalResults] = useState(0);

  const [userError, setUserError] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);

  function printDistributionDate(dateString: any) {
    const d = new Date(
      dateString.substring(0, 4),
      dateString.substring(5, 7) - 1,
      dateString.substring(8, 10)
    );
    return d.toDateString();
  }

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
    async function fetchENS() {
      let oLink = process.env.BASE_ENDPOINT
        ? process.env.BASE_ENDPOINT
        : "https://seize.io";
      if (props.user.startsWith("0x") || props.user.endsWith(".eth")) {
        const url = `${process.env.API_ENDPOINT}/api/ens/${props.user}`;
        return fetchUrl(url).then((response: any) => {
          if (isEmptyObject(response)) {
            setUserError(true);
          }
          setFetchingUser(false);
          const oAddress = response.wallet ? response.wallet : props.user;
          setOwnerAddress(oAddress);
          setOwnerENS(response.display ? response.display : oAddress);
          let reservedDisplay;
          if (props.user.toUpperCase() == SIX529_MUSEUM.toUpperCase()) {
            reservedDisplay = ReservedUser.MUSEUM;
          } else if (props.user.toUpperCase() == MANIFOLD.toUpperCase()) {
            reservedDisplay = ReservedUser.MANIFOLD;
          }
          setOwnerLinkDisplay(
            `${oLink}/${
              reservedDisplay
                ? reservedDisplay
                : response.display && !containsEmojis(response.display)
                ? response.display.replaceAll(" ", "-")
                : formatAddress(oAddress)
            }`
          );
          setBreadcrumbs([
            { display: "Home", href: "/" },
            {
              display: reservedDisplay
                ? reservedDisplay
                : response.display
                ? parseEmojis(response.display)
                : oAddress,
            },
          ]);
          router.push(
            reservedDisplay
              ? reservedDisplay
              : response.display && !containsEmojis(response.display)
              ? response.display.replaceAll(" ", "-")
              : oAddress,
            undefined,
            {
              shallow: true,
            }
          );
        });
      } else {
        if (props.user.toUpperCase() == ReservedUser.MUSEUM.toUpperCase()) {
          setOwnerAddress(SIX529_MUSEUM);
          setOwnerENS(ReservedUser.MUSEUM);
          setOwnerLinkDisplay(`${oLink}/${ReservedUser.MUSEUM}`);
          setBreadcrumbs([
            { display: "Home", href: "/" },
            { display: ReservedUser.MUSEUM },
          ]);
          setFetchingUser(false);
          router.push(ReservedUser.MUSEUM, undefined, {
            shallow: true,
          });
        } else if (
          props.user.toUpperCase() == ReservedUser.MANIFOLD.toUpperCase()
        ) {
          setOwnerAddress(MANIFOLD);
          setOwnerENS(ReservedUser.MANIFOLD);
          setOwnerLinkDisplay(`${oLink}/${ReservedUser.MANIFOLD}`);
          setBreadcrumbs([
            { display: "Home", href: "/" },
            { display: ReservedUser.MANIFOLD },
          ]);
          setFetchingUser(false);
          router.push(ReservedUser.MANIFOLD, undefined, {
            shallow: true,
          });
        } else {
          window.location.href = "/404";
        }
      }
    }

    if (router.isReady) {
      fetchENS();
    }
  }, [router.isReady]);

  useEffect(() => {
    async function fetchOwned(url: string, myowned: Owner[]) {
      return fetchUrl(url).then((response: DBResponse) => {
        if (response.next) {
          fetchOwned(response.next, [...myowned].concat(response.data));
        } else {
          const newOwned = [...myowned].concat(response.data);
          if (newOwned.length > 0) {
            const mergedOwners = newOwned.reduce(
              (accumulator: Owner[], currentOwner: Owner) => {
                const existingOwner = accumulator.find(
                  (owner) =>
                    areEqualAddresses(owner.contract, currentOwner.contract) &&
                    owner.token_id === currentOwner.token_id
                );

                if (existingOwner) {
                  existingOwner.balance += currentOwner.balance;
                } else {
                  accumulator.push(currentOwner);
                }

                return accumulator;
              },
              [] as Owner[]
            );
            setConsolidationOwned(mergedOwners);
          }
          setConsolidationOwnedLoaded(true);
        }
      });
    }

    if (consolidatedTDH) {
      if (consolidatedTDH.balance > 0) {
        const ownedUrl = `${
          process.env.API_ENDPOINT
        }/api/owners?wallet=${consolidatedTDH.wallets.join(",")}`;
        fetchOwned(ownedUrl, []);
      } else {
        setConsolidationOwnedLoaded(true);
        setWalletOwnedLoaded(true);
      }
    }
  }, [consolidatedTDH]);

  useEffect(() => {
    async function fetchOwned(url: string, myowned: Owner[]) {
      fetchAllPages(url).then((response: Owner[]) => {
        setWalletOwned(response);
        setWalletOwnedLoaded(true);
      });
    }

    if (walletTDH && walletTDH.balance > 0) {
      if (walletTDH.balance > 0) {
        const ownedUrl = `${process.env.API_ENDPOINT}/api/owners?wallet=${walletTDH.wallet}`;
        fetchOwned(ownedUrl, []);
      } else {
        setWalletOwnedLoaded(true);
      }
    }
  }, [walletTDH]);

  useEffect(() => {
    const nftsUrl = `${process.env.API_ENDPOINT}/api/memes_extended_data`;
    fetchAllPages(nftsUrl).then((responseNftMetas: any[]) => {
      setNftMetas(responseNftMetas);
      setSeasons(
        Array.from(new Set(responseNftMetas.map((meme) => meme.season))).sort(
          (a, b) => a - b
        )
      );
      if (responseNftMetas.length > 0) {
        fetchAllPages(`${process.env.API_ENDPOINT}/api/nfts`).then(
          (responseNfts: any[]) => {
            setNfts(responseNfts);
            setNftsLoaded(true);
          }
        );
      } else {
        setNfts([]);
        setNftsLoaded(true);
      }
    });
  }, []);

  useEffect(() => {
    async function fetchConsolidatedTDH() {
      const url = `${process.env.API_ENDPOINT}/api/consolidated_owner_metrics/?wallet=${ownerAddress}&profile_page=true`;
      return fetchUrl(url).then((response: DBResponse) => {
        if (response && response.data.length == 1) {
          setConsolidatedTDH(response.data[0]);
          if (response.data[0].wallets && response.data[0].wallets.length > 1) {
            setIsConsolidation(true);
          }
        }
      });
    }

    if (ownerAddress && router.isReady) {
      fetchConsolidatedTDH();
    }
  }, [ownerAddress, router.isReady]);

  useEffect(() => {
    async function fetchTDH() {
      const url = `${process.env.API_ENDPOINT}/api/owner_metrics/?wallet=${ownerAddress}&profile_page=true`;
      return fetchUrl(url).then((response: DBResponse) => {
        if (response && response.data.length == 1) {
          setWalletTDH(response.data[0]);
        }
      });
    }

    if (consolidatedTDH) {
      if (isConsolidation) {
        fetchTDH();
      } else {
        setWalletOwnedLoaded(true);
      }
    }
  }, [isConsolidation, consolidatedTDH]);

  useEffect(() => {
    if (view == VIEW.CONSOLIDATION || !isConsolidation) {
      setTDH(consolidatedTDH);
    } else {
      setTDH(walletTDH);
    }
  }, [view, walletTDH, consolidatedTDH]);

  useEffect(() => {
    if (walletOwnedLoaded && consolidationOwnedLoaded) {
      if (view == VIEW.CONSOLIDATION || !isConsolidation) {
        setOwned(consolidationOwned);
      } else {
        setOwned(walletOwned);
      }
      setOwnedLoaded(true);
    }
  }, [view, walletOwnedLoaded, consolidationOwnedLoaded]);

  useEffect(() => {
    setActivityPage(1);
    setDistributionsPage(1);
  }, [view]);

  useEffect(() => {
    let url = `${process.env.API_ENDPOINT}/api/transactions?contract=${MEMES_CONTRACT}&wallet=${ownerAddress}&page_size=${ACTIVITY_PAGE_SIZE}&page=${activityPage}`;
    if (view == VIEW.CONSOLIDATION && consolidatedTDH) {
      url = `${
        process.env.API_ENDPOINT
      }/api/transactions?contract=${MEMES_CONTRACT}&wallet=${consolidatedTDH.wallets.join(
        ","
      )}&page_size=${ACTIVITY_PAGE_SIZE}&page=${activityPage}`;
    }
    if (ownerAddress && router.isReady) {
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
  }, [activityPage, ownerAddress, router.isReady, activityTypeFilter, view]);

  useEffect(() => {
    let url = `${process.env.API_ENDPOINT}/api/distributions?wallet=${ownerAddress}&page_size=${DISTRIBUTIONS_PAGE_SIZE}&page=${distributionsPage}`;
    if (view == VIEW.CONSOLIDATION && consolidatedTDH) {
      url = url = `${
        process.env.API_ENDPOINT
      }/api/distributions?wallet=${consolidatedTDH.wallets.join(
        ","
      )}&page_size=${DISTRIBUTIONS_PAGE_SIZE}&page=${distributionsPage}`;
    }
    if (ownerAddress && router.isReady) {
      fetchUrl(url).then((response: DBResponse) => {
        setDistributionsTotalResults(response.count);
        setDistributions(response.data);
      });
    }
  }, [distributionsPage, ownerAddress, router.isReady, view]);

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
  }, [
    sortDir,
    sort,
    hideMemes,
    hideGradients,
    hideSeized,
    hideNonSeized,
    nftsLoaded,
  ]);

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

    const season = nftMetas.find((a) => a.id == nft.id)?.season;
    if (selectedSeason != 0 && selectedSeason != season) {
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
            <a
              className={styles.nftImagePadding}
              href={`/${
                areEqualAddresses(nft.contract, MEMES_CONTRACT)
                  ? "the-memes"
                  : "6529-gradient"
              }/${nft.id}`}>
              <NFTImage
                nft={nft}
                animation={false}
                height={300}
                balance={nftbalance}
                showOwned={
                  areEqualAddresses(nft.contract, GRADIENT_CONTRACT) &&
                  nftbalance > 0
                    ? true
                    : false
                }
                showThumbnail={true}
                showUnseized={true}
              />
            </a>
          </Row>
          <Row>
            <Col className="text-center pt-2">
              <a
                href={`/${
                  areEqualAddresses(nft.contract, MEMES_CONTRACT)
                    ? "the-memes"
                    : "6529-gradient"
                }/${nft.id}`}>
                {areEqualAddresses(nft.contract, MEMES_CONTRACT)
                  ? `#${nft.id} - ${nft.name}`
                  : nft.name}
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
    if (tdh?.balance) {
      return (
        <Row className="pt-3">
          <Col>
            <Form.Check
              type="radio"
              name="hide"
              checked={!hideSeized && !hideNonSeized}
              className={`${styles.seizedToggle}`}
              label={`All`}
              onChange={() => {
                setHideSeized(false);
                setHideNonSeized(false);
              }}
            />
            <Form.Check
              type="radio"
              checked={!hideSeized && hideNonSeized}
              className={`${styles.seizedToggle}`}
              name="hide"
              label={`Seized`}
              onChange={() => {
                setHideSeized(false);
                setHideNonSeized(true);
              }}
            />
            <Form.Check
              type="radio"
              checked={hideSeized && !hideNonSeized}
              className={`${styles.seizedToggle}`}
              name="hide"
              label={`Unseized`}
              onChange={() => {
                setHideSeized(true);
                setHideNonSeized(false);
              }}
            />
            {tdh && tdh?.memes_balance > 0 && tdh?.gradients_balance > 0 && (
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
  }

  if (fetchingUser) {
    return (
      <Container className="pt-5 text-center">
        <Row>
          <Col>
            <h4 className="mb-0 float-none">Fetching User...</h4>
          </Col>
        </Row>
      </Container>
    );
  }

  if (userError) {
    return (
      <NotFound
        title="User Not found"
        links={[{ href: "/", display: "BACK TO HOME" }]}
      />
    );
  }

  return (
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <Container fluid className={styles.mainContainer}>
        <Row>
          <Col>
            <Container className="mt-2 pt-2 pb-2">
              {/* <Row>
                <Col className="text-right">
                  {ownerAddress && (
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
                  )}
                </Col>
              </Row> */}
              {isConsolidation && (
                <Row>
                  <Col className={styles.consolidationSwitch}>
                    <ConsolidationSwitch
                      view={view}
                      onSetView={(v) => setView(v)}
                    />
                  </Col>
                </Row>
              )}
              {ownerAddress && (
                <Row>
                  <Col
                    xs={12}
                    sm={6}
                    className={isConsolidation ? "pt-2" : "pt-3"}>
                    <Container className="no-padding">
                      <Row className="pb-1">
                        <Col
                          className={
                            view == VIEW.WALLET
                              ? "d-flex align-items-center"
                              : ""
                          }>
                          {ensAvatar.data && view == VIEW.WALLET && (
                            <Image
                              className={styles.avatar}
                              src={ensAvatar.data}
                              alt="opensea"
                              width={0}
                              height={0}
                            />
                          )}
                          {tdh && consolidatedTDH ? (
                            <Address
                              wallets={
                                view == VIEW.CONSOLIDATION
                                  ? consolidatedTDH.wallets
                                  : [ownerAddress]
                              }
                              display={
                                view == VIEW.CONSOLIDATION &&
                                consolidatedTDH.consolidation_display
                                  ? consolidatedTDH.consolidation_display
                                  : ownerENS
                              }
                              isUserPage={true}
                              disableLink={true}
                              viewingWallet={ownerAddress}
                            />
                          ) : (
                            <Address
                              wallets={[ownerAddress]}
                              display={ownerENS}
                              disableLink={true}
                              isUserPage={true}
                              viewingWallet={ownerAddress}
                            />
                          )}
                        </Col>
                      </Row>
                      <Row className="pt-1">
                        <Tippy
                          content={ownerLinkCopied ? "Copied" : "Copy"}
                          placement={"right"}
                          theme={"light"}
                          hideOnClick={false}>
                          <span
                            className={styles.ownerLink}
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(
                                  window.location.href
                                );
                              }
                              setIsOwnerLinkCopied(true);
                              setTimeout(() => {
                                setIsOwnerLinkCopied(false);
                              }, 1000);
                            }}>
                            {removeProtocol(ownerLinkDisplay)}{" "}
                            <FontAwesomeIcon
                              icon="link"
                              className={styles.ownerLinkIcon}
                            />
                          </span>
                        </Tippy>
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
                    </Container>
                  </Col>
                  {tdh && tdh.balance > 0 && (
                    <>
                      <Col
                        xs={6}
                        sm={6}
                        md={3}
                        className={isConsolidation ? "pt-2" : "pt-3"}>
                        <Container className="no-padding text-right">
                          <Row className="pt-2 pb-1">
                            <Col>
                              <Tag
                                type={TagType.RANK}
                                text={"All Cards Rank #"}
                                value={tdh.dense_rank_balance}
                              />
                            </Col>
                          </Row>
                          <Row className="pt-1 pb-1">
                            <Col>
                              <Tag
                                type={TagType.RANK}
                                text={"Unique Cards Rank #"}
                                value={tdh.dense_rank_unique}
                              />
                            </Col>
                          </Row>
                          {tdh.tdh_rank && (
                            <Row className="pt-1 pb-1">
                              <Col>
                                <Tag
                                  type={TagType.RANK}
                                  text={"TDH Rank #"}
                                  value={tdh.tdh_rank}
                                />
                              </Col>
                            </Row>
                          )}
                          {tdh.boost && (
                            <Row className="pt-1 pb-1">
                              <Col>
                                <Tag
                                  type={TagType.RANK}
                                  text={"Boost x"}
                                  value={tdh.boost}
                                />
                              </Col>
                            </Row>
                          )}
                        </Container>
                      </Col>
                      <Col
                        xs={6}
                        sm={6}
                        md={3}
                        className={isConsolidation ? "pt-2" : "pt-3"}>
                        <Container className="no-padding text-right">
                          <Row className="pt-2 pb-1">
                            <Col>
                              {tdh.memes_cards_sets > 0 ? (
                                <Tag
                                  type={TagType.MEME_SETS}
                                  text={"Memes Sets x"}
                                  value={tdh.memes_cards_sets}
                                />
                              ) : (
                                <Tag
                                  type={TagType.MEMES}
                                  text={"Memes x"}
                                  value={tdh.unique_memes}
                                  text_after={
                                    tdh.genesis > 0 ? ` (+Genesis) ` : ""
                                  }
                                />
                              )}
                            </Col>
                          </Row>
                          {tdh.memes_cards_sets_szn1 > 0 && (
                            <Row className="pt-1 pb-1">
                              <Col>
                                <Tag
                                  type={TagType.SZN1}
                                  text={"SZN1 Sets x"}
                                  value={tdh.memes_cards_sets_szn1}
                                />
                              </Col>
                            </Row>
                          )}
                          {tdh.memes_cards_sets_szn2 > 0 && (
                            <Row className="pt-1 pb-1">
                              <Col>
                                <Tag
                                  type={TagType.SZN2}
                                  text={"SZN2 Sets x"}
                                  value={tdh.memes_cards_sets_szn2}
                                />
                              </Col>
                            </Row>
                          )}
                          {tdh.memes_cards_sets_szn3 > 0 && (
                            <Row className="pt-1 pb-1">
                              <Col>
                                <Tag
                                  type={TagType.SZN3}
                                  text={"SZN3 Sets x"}
                                  value={tdh.memes_cards_sets_szn3}
                                />
                              </Col>
                            </Row>
                          )}
                          {tdh.memes_cards_sets_szn4 > 0 && (
                            <Row className="pt-1 pb-1">
                              <Col>
                                <Tag
                                  type={TagType.SZN4}
                                  text={"SZN4 Sets x"}
                                  value={tdh.memes_cards_sets_szn4}
                                />
                              </Col>
                            </Row>
                          )}
                          {tdh.gradients_balance > 0 && (
                            <Row className="pt-1 pb-1">
                              <Col>
                                <Tag
                                  type={TagType.GRADIENT}
                                  text={"Gradients x"}
                                  value={tdh.gradients_balance}
                                />
                              </Col>
                            </Row>
                          )}
                        </Container>
                      </Col>
                    </>
                  )}
                </Row>
              )}
            </Container>
            <Container className="pt-5 pb-3">
              {tdh && tdh.balance > 0 && (
                <Row>
                  <Accordion alwaysOpen className={styles.userPageAccordion}>
                    <Accordion.Item
                      className={styles.userPageAccordionItem}
                      eventKey={"0"}>
                      <Accordion.Header>Cards Collected</Accordion.Header>
                      <Accordion.Body
                        className={styles.primaryTableScrollContainer}>
                        <Table className={styles.primaryTable}>
                          <tbody>
                            <tr>
                              <td></td>
                              <td>
                                <b>Total</b>
                              </td>
                              <td>
                                <b>Memes</b>
                              </td>
                              <td>
                                <b>SZN1</b>
                              </td>
                              <td>
                                <b>SZN2</b>
                              </td>
                              <td>
                                <b>SZN3</b>
                              </td>
                              <td>
                                <b>SZN4</b>
                              </td>
                              <td>
                                <b>6529 Gradient</b>
                              </td>
                            </tr>
                            <tr className={styles.primaryTableGap}></tr>
                            <tr>
                              <td>
                                <b>All Cards</b>
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
                                {tdh.memes_balance_season3 > 0
                                  ? `x${numberWithCommas(
                                      tdh.memes_balance_season3
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.memes_balance_season4 > 0
                                  ? `x${numberWithCommas(
                                      tdh.memes_balance_season4
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.gradients_balance > 0
                                  ? `x${numberWithCommas(
                                      tdh.gradients_balance
                                    )}`
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
                                      tdh.dense_rank_balance_memes_season1__ties >
                                      1
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
                                      tdh.dense_rank_balance_memes_season2__ties >
                                      1
                                        ? ` (tie)`
                                        : ""
                                    }`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.memes_balance_season3 > 0
                                  ? `#${numberWithCommas(
                                      tdh.dense_rank_balance_memes_season3
                                    )}${
                                      tdh.dense_rank_balance_memes_season3__ties >
                                      1
                                        ? ` (tie)`
                                        : ""
                                    }`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.memes_balance_season4 > 0
                                  ? `#${numberWithCommas(
                                      tdh.dense_rank_balance_memes_season4
                                    )}${
                                      tdh.dense_rank_balance_memes_season4__ties >
                                      1
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
                                <b>Unique Cards</b>
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
                                  ? `x${numberWithCommas(
                                      tdh.unique_memes_szn1
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.unique_memes_szn2 > 0
                                  ? `x${numberWithCommas(
                                      tdh.unique_memes_szn2
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.unique_memes_szn3 > 0
                                  ? `x${numberWithCommas(
                                      tdh.unique_memes_szn3
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.unique_memes_szn4 > 0
                                  ? `x${numberWithCommas(
                                      tdh.unique_memes_szn4
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.gradients_balance > 0
                                  ? `x${numberWithCommas(
                                      tdh.gradients_balance
                                    )}`
                                  : "-"}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <b>Rank</b>
                              </td>
                              <td>
                                #{numberWithCommas(tdh.dense_rank_unique)}
                                {tdh.dense_rank_unique__ties > 1 && ` (tie)`}
                              </td>
                              <td>
                                {tdh.memes_balance > 0
                                  ? `#${numberWithCommas(
                                      tdh.dense_rank_unique_memes
                                    )}${
                                      tdh.dense_rank_unique_memes__ties > 1
                                        ? ` (tie)`
                                        : ""
                                    }`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.memes_balance_season1 > 0
                                  ? `#${numberWithCommas(
                                      tdh.dense_rank_unique_memes_season1
                                    )}${
                                      tdh.dense_rank_unique_memes_season1__ties >
                                      1
                                        ? ` (tie)`
                                        : ""
                                    }`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.memes_balance_season2 > 0
                                  ? `#${numberWithCommas(
                                      tdh.dense_rank_unique_memes_season2
                                    )}${
                                      tdh.dense_rank_unique_memes_season2__ties >
                                      1
                                        ? ` (tie)`
                                        : ""
                                    }`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.memes_balance_season3 > 0
                                  ? `#${numberWithCommas(
                                      tdh.dense_rank_unique_memes_season3
                                    )}${
                                      tdh.dense_rank_unique_memes_season3__ties >
                                      1
                                        ? ` (tie)`
                                        : ""
                                    }`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.memes_balance_season4 > 0
                                  ? `#${numberWithCommas(
                                      tdh.dense_rank_unique_memes_season4
                                    )}${
                                      tdh.dense_rank_unique_memes_season4__ties >
                                      1
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
                                  Math.round(tdh.boosted_memes_tdh_season3)
                                )}
                              </td>
                              <td>
                                {numberWithCommas(
                                  Math.round(tdh.boosted_memes_tdh_season4)
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
                                  ? `#${numberWithCommas(
                                      tdh.tdh_rank_memes_szn1
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.tdh_rank_memes_szn2 > 0
                                  ? `#${numberWithCommas(
                                      tdh.tdh_rank_memes_szn2
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.tdh_rank_memes_szn3 > 0
                                  ? `#${numberWithCommas(
                                      tdh.tdh_rank_memes_szn3
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.tdh_rank_memes_szn4 > 0
                                  ? `#${numberWithCommas(
                                      tdh.tdh_rank_memes_szn4
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.tdh_rank_gradients > 0
                                  ? `#${numberWithCommas(
                                      tdh.tdh_rank_gradients
                                    )}`
                                  : "-"}
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Row>
              )}
              {tdh && (
                <Row>
                  <Accordion alwaysOpen className={styles.userPageAccordion}>
                    <Accordion.Item
                      className={`${styles.userPageAccordionItem} mt-4`}
                      eventKey={"1"}>
                      <Accordion.Header>Activity Overview</Accordion.Header>
                      <Accordion.Body
                        className={styles.primaryTableScrollContainer}>
                        <Table className={styles.primaryTableActivity}>
                          <tbody>
                            <tr>
                              <td></td>
                              <td>
                                <b>Total</b>
                              </td>
                              <td>
                                <b>Memes</b>
                              </td>
                              <td>
                                <b>SZN1</b>
                              </td>
                              <td>
                                <b>SZN2</b>
                              </td>
                              <td>
                                <b>SZN3</b>
                              </td>
                              <td>
                                <b>SZN4</b>
                              </td>
                              <td>
                                <b>6529 Gradient</b>
                              </td>
                            </tr>
                            <tr className={styles.primaryTableGap}></tr>
                            <tr>
                              <td>
                                <b>Transfers In</b>
                              </td>
                              <td>
                                {tdh.transfers_in > 0
                                  ? `x${numberWithCommas(tdh.transfers_in)}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_in_memes > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_in_memes
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_in_memes_season1 > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_in_memes_season1
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_in_memes_season2 > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_in_memes_season2
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_in_memes_season3 > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_in_memes_season3
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_in_memes_season4 > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_in_memes_season4
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_in_gradients > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_in_gradients
                                    )}`
                                  : "-"}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <b>Purchases</b>
                              </td>
                              <td>
                                {tdh.purchases_count > 0
                                  ? `x${numberWithCommas(tdh.purchases_count)}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_count_memes > 0
                                  ? `x${numberWithCommas(
                                      tdh.purchases_count_memes
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_count_memes_season1 > 0
                                  ? `x${numberWithCommas(
                                      tdh.purchases_count_memes_season1
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_count_memes_season2 > 0
                                  ? `x${numberWithCommas(
                                      tdh.purchases_count_memes_season2
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_count_memes_season3 > 0
                                  ? `x${numberWithCommas(
                                      tdh.purchases_count_memes_season3
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_count_memes_season4 > 0
                                  ? `x${numberWithCommas(
                                      tdh.purchases_count_memes_season4
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_count_gradients > 0
                                  ? `x${numberWithCommas(
                                      tdh.purchases_count_gradients
                                    )}`
                                  : "-"}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <b>Purchases (ETH)</b>
                              </td>
                              <td>
                                {tdh.purchases_value > 0
                                  ? `${numberWithCommas(
                                      Math.round(tdh.purchases_value * 100) /
                                        100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_value_memes > 0
                                  ? `${numberWithCommas(
                                      Math.round(
                                        tdh.purchases_value_memes * 100
                                      ) / 100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_value_memes_season1 > 0
                                  ? `${numberWithCommas(
                                      Math.round(
                                        tdh.purchases_value_memes_season1 * 100
                                      ) / 100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_value_memes_season2 > 0
                                  ? `${numberWithCommas(
                                      Math.round(
                                        tdh.purchases_value_memes_season2 * 100
                                      ) / 100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_value_memes_season3 > 0
                                  ? `${numberWithCommas(
                                      Math.round(
                                        tdh.purchases_value_memes_season3 * 100
                                      ) / 100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_value_memes_season4 > 0
                                  ? `${numberWithCommas(
                                      Math.round(
                                        tdh.purchases_value_memes_season4 * 100
                                      ) / 100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.purchases_value_gradients > 0
                                  ? `${numberWithCommas(
                                      Math.round(
                                        tdh.purchases_value_gradients * 100
                                      ) / 100
                                    )}`
                                  : "-"}
                              </td>
                            </tr>
                            <tr className={styles.primaryTableGap}></tr>
                            <tr>
                              <td>
                                <b>Transfers Out</b>
                              </td>
                              <td>
                                {tdh.transfers_out > 0
                                  ? `x${numberWithCommas(tdh.transfers_out)}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_out_memes > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_out_memes
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_out_memes_season1 > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_out_memes_season1
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_out_memes_season2 > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_out_memes_season2
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_out_memes_season3 > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_out_memes_season3
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_out_memes_season4 > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_out_memes_season4
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.transfers_out_gradients > 0
                                  ? `x${numberWithCommas(
                                      tdh.transfers_out_gradients
                                    )}`
                                  : "-"}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <b>Sales</b>
                              </td>
                              <td>
                                {tdh.sales_count > 0
                                  ? `x${numberWithCommas(tdh.sales_count)}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_count_memes > 0
                                  ? `x${numberWithCommas(
                                      tdh.sales_count_memes
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_count_memes_season1 > 0
                                  ? `x${numberWithCommas(
                                      tdh.sales_count_memes_season1
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_count_memes_season2 > 0
                                  ? `x${numberWithCommas(
                                      tdh.sales_count_memes_season2
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_count_memes_season3 > 0
                                  ? `x${numberWithCommas(
                                      tdh.sales_count_memes_season3
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_count_memes_season4 > 0
                                  ? `x${numberWithCommas(
                                      tdh.sales_count_memes_season4
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_count_gradients > 0
                                  ? `x${numberWithCommas(
                                      tdh.sales_count_gradients
                                    )}`
                                  : "-"}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <b>Sales (ETH)</b>
                              </td>
                              <td>
                                {tdh.sales_value > 0
                                  ? `${numberWithCommas(
                                      Math.round(tdh.sales_value * 100) / 100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_value_memes > 0
                                  ? `${numberWithCommas(
                                      Math.round(tdh.sales_value_memes * 100) /
                                        100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_value_memes_season1 > 0
                                  ? `${numberWithCommas(
                                      Math.round(
                                        tdh.sales_value_memes_season1 * 100
                                      ) / 100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_value_memes_season2 > 0
                                  ? `${numberWithCommas(
                                      Math.round(
                                        tdh.sales_value_memes_season2 * 100
                                      ) / 100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_value_memes_season3 > 0
                                  ? `${numberWithCommas(
                                      Math.round(
                                        tdh.sales_value_memes_season3 * 100
                                      ) / 100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_value_memes_season4 > 0
                                  ? `${numberWithCommas(
                                      Math.round(
                                        tdh.sales_value_memes_season4 * 100
                                      ) / 100
                                    )}`
                                  : "-"}
                              </td>
                              <td>
                                {tdh.sales_value_gradients > 0
                                  ? `${numberWithCommas(
                                      Math.round(
                                        tdh.sales_value_gradients * 100
                                      ) / 100
                                    )}`
                                  : "-"}
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Row>
              )}
            </Container>
            <Container>
              <Row className="pt-5 pb-5">
                <Col className="d-flex align-items-center justify-content-center">
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
                  <h3>&nbsp;|&nbsp;</h3>
                  <h3
                    className={
                      focus == Focus.DISTRIBUTIONS
                        ? styles.focusActive
                        : styles.focus
                    }
                    onClick={() => setFocus(Focus.DISTRIBUTIONS)}>
                    Distributions
                  </h3>
                </Col>
              </Row>
              {focus == Focus.COLLECTION && (
                <>
                  {tdh?.balance && (
                    <Row>
                      <Col xs={5}>
                        <Col xs={12}>
                          Sort&nbsp;&nbsp;
                          <FontAwesomeIcon
                            icon="chevron-circle-up"
                            onClick={() => setSortDir(SortDirection.ASC)}
                            className={`${styles.sortDirection} ${
                              sortDir != SortDirection.ASC
                                ? styles.disabled
                                : ""
                            }`}
                          />{" "}
                          <FontAwesomeIcon
                            icon="chevron-circle-down"
                            onClick={() => setSortDir(SortDirection.DESC)}
                            className={`${styles.sortDirection} ${
                              sortDir != SortDirection.DESC
                                ? styles.disabled
                                : ""
                            }`}
                          />
                        </Col>
                        <Col xs={12} className="pt-2">
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
                      </Col>
                      <Col
                        className="d-flex align-items-center justify-content-end"
                        xs={7}>
                        <Dropdown
                          className={styles.seasonDropdown}
                          drop={"down-centered"}>
                          <Dropdown.Toggle>
                            SZN: {selectedSeason == 0 ? `All` : selectedSeason}
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item
                              onClick={() => {
                                setSelectedSeason(0);
                              }}>
                              All
                            </Dropdown.Item>
                            {seasons.map((s) => (
                              <Dropdown.Item
                                key={`season-${s}`}
                                onClick={() => {
                                  setSelectedSeason(s);
                                }}>
                                SNZ{s}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </Col>
                    </Row>
                  )}
                  {printUserControls()}
                  {ownedLoaded &&
                    (owned.length > 0 ? (
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
              {focus == Focus.DISTRIBUTIONS && (
                <>
                  <Row>
                    <Col
                      className="d-flex align-items-center"
                      xs={{ span: 7 }}
                      sm={{ span: 7 }}
                      md={{ span: 9 }}
                      lg={{ span: 10 }}>
                      <h3>Distributions</h3>
                    </Col>
                  </Row>
                  <Row
                    className={`pt-2 ${styles.distributionsScrollContainer}`}>
                    <Col>
                      {distributions.length > 0 ? (
                        <Table className={styles.distributionsTable}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Card</th>
                              {isConsolidation &&
                                view == VIEW.CONSOLIDATION && <th>Wallet</th>}
                              <th className="text-center">Phase</th>
                              <th className="text-center">Count</th>
                              <th className="text-center">Minted</th>
                            </tr>
                          </thead>
                          <tbody>
                            {distributions.map((d) => (
                              <tr
                                key={`${d.contract}-${d.card_id}-${d.phase}-${d.wallet}}`}>
                                <td>
                                  {printDistributionDate(d.card_mint_date)}
                                </td>
                                <td className={styles.distributionsTableWallet}>
                                  {d.card_name ? (
                                    <a
                                      className={
                                        styles.distributionsTableCardLink
                                      }
                                      href={
                                        areEqualAddresses(
                                          d.contract,
                                          MEMES_CONTRACT
                                        )
                                          ? `/the-memes/${d.card_id}`
                                          : areEqualAddresses(
                                              d.contract,
                                              GRADIENT_CONTRACT
                                            )
                                          ? `/6529-gradient/${d.card_id}`
                                          : areEqualAddresses(
                                              d.contract,
                                              MEMELAB_CONTRACT
                                            )
                                          ? `/meme-lab/${d.card_id}`
                                          : d.contract
                                      }>
                                      Card #{d.card_id}
                                    </a>
                                  ) : (
                                    `Card #${d.card_id}`
                                  )}
                                  {` - ${
                                    areEqualAddresses(
                                      d.contract,
                                      MEMES_CONTRACT
                                    )
                                      ? `The Memes`
                                      : areEqualAddresses(
                                          d.contract,
                                          GRADIENT_CONTRACT
                                        )
                                      ? `6529Gradient`
                                      : areEqualAddresses(
                                          d.contract,
                                          MEMELAB_CONTRACT
                                        )
                                      ? `Meme Lab`
                                      : d.contract
                                  }${d.card_name ? ` - ${d.card_name}` : ""}`}
                                </td>
                                {isConsolidation &&
                                  view == VIEW.CONSOLIDATION && (
                                    <td>
                                      {d.display
                                        ? d.display
                                        : formatAddress(d.wallet)}
                                    </td>
                                  )}
                                <td className="text-center">{d.phase}</td>
                                <td className="text-center">{d.count}</td>
                                <td className="text-center">
                                  {!d.card_mint_count
                                    ? "-"
                                    : d.card_mint_count == 0
                                    ? d.card_mint_count
                                    : numberWithCommas(d.card_mint_count)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <>
                          <Image
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
                  {distributions.length > 0 && (
                    <Row className="text-center pt-2 pb-3">
                      <Pagination
                        page={distributionsPage}
                        pageSize={DISTRIBUTIONS_PAGE_SIZE}
                        totalResults={distributionsTotalResults}
                        setPage={function (newPage: number) {
                          setDistributionsPage(newPage);
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
