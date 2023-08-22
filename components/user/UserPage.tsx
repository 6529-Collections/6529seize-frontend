import styles from "./UserPage.module.scss";
import Image from "next/image";
import { Button, Col, Container, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { Owner } from "../../entities/IOwner";
import { useRouter } from "next/router";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
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
import { MANIFOLD, SIX529_MUSEUM } from "../../constants";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../entities/ITDH";
import { useEnsAvatar } from "wagmi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import { ReservedUser } from "../../pages/[user]";
import Tippy from "@tippyjs/react";
import Tag, { TagType } from "../address/Tag";
import ConsolidationSwitch, {
  VIEW,
} from "../consolidation-switch/ConsolidationSwitch";
import Address from "../address/Address";
import UserPageDetails from "./UserPageDetails";
import UserPageOverview from "./UserPageOverview";
import NotFound from "../notFound/NotFound";

interface Props {
  user: string;
  wallets: string[];
}

export default function UserPage(props: Props) {
  const router = useRouter();
  const [view, setView] = useState<VIEW>(VIEW.WALLET);

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

  const [ownerLinkDisplay, setOwnerLinkDisplay] = useState("");
  const [owned, setOwned] = useState<Owner[]>([]);
  const [walletOwned, setWalletOwned] = useState<Owner[]>([]);
  const [consolidationOwned, setConsolidationOwned] = useState<Owner[]>([]);

  const [walletTDH, setWalletTDH] = useState<TDHMetrics>();
  const [consolidatedTDH, setConsolidatedTDH] =
    useState<ConsolidatedTDHMetrics>();
  const [tdh, setTDH] = useState<ConsolidatedTDHMetrics | TDHMetrics>();
  const [isConsolidation, setIsConsolidation] = useState(false);
  const [userError, setUserError] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);

  const [pfp, setPfp] = useState<string>();
  // "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/134.WEBP"

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
          if (areEqualAddresses(props.user, SIX529_MUSEUM)) {
            reservedDisplay = ReservedUser.MUSEUM;
          } else if (areEqualAddresses(props.user, MANIFOLD)) {
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
        if (props.user.toUpperCase() === ReservedUser.MUSEUM.toUpperCase()) {
          setOwnerAddress(SIX529_MUSEUM);
          setOwnerENS(ReservedUser.MUSEUM);
          setOwnerLinkDisplay(`${oLink}/${ReservedUser.MUSEUM}`);
          setFetchingUser(false);
          setBreadcrumbs([
            { display: "Home", href: "/" },
            { display: ReservedUser.MUSEUM },
          ]);
          setFetchingUser(false);
          router.push(ReservedUser.MUSEUM, undefined, {
            shallow: true,
          });
        } else if (
          props.user.toUpperCase() === ReservedUser.MANIFOLD.toUpperCase()
        ) {
          setOwnerAddress(MANIFOLD);
          setOwnerENS(ReservedUser.MANIFOLD);
          setOwnerLinkDisplay(`${oLink}/${ReservedUser.MANIFOLD}`);
          setFetchingUser(false);
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

    if (walletTDH) {
      if (walletTDH.balance > 0) {
        const ownedUrl = `${process.env.API_ENDPOINT}/api/owners?wallet=${walletTDH.wallet}`;
        fetchOwned(ownedUrl, []);
      } else {
        setWalletOwnedLoaded(true);
      }
    }
  }, [walletTDH]);

  useEffect(() => {
    async function fetchConsolidatedTDH() {
      const url = `${process.env.API_ENDPOINT}/api/consolidated_owner_metrics/?wallet=${ownerAddress}&profile_page=true`;
      return fetchUrl(url).then((response: DBResponse) => {
        if (response && response.data.length === 1) {
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
        if (response && response.data.length === 1) {
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
    if (view === VIEW.CONSOLIDATION || !isConsolidation) {
      setTDH(consolidatedTDH);
    } else {
      setTDH(walletTDH);
    }
  }, [view, walletTDH, consolidatedTDH]);

  useEffect(() => {
    if (walletOwnedLoaded && consolidationOwnedLoaded) {
      if (view === VIEW.CONSOLIDATION || !isConsolidation) {
        setOwned(consolidationOwned);
      } else {
        setOwned(walletOwned);
      }
      setOwnedLoaded(true);
    }
  }, [view, walletOwnedLoaded, consolidationOwnedLoaded]);

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
                        <Col className="d-flex gap-4">
                          {pfp && (
                            <span className={`mt-3 ${styles.avatar}`}>
                              <Image
                                src={pfp}
                                alt="add-image"
                                width={0}
                                height={0}
                              />
                            </span>
                          )}
                          {!pfp &&
                            ownerAddress &&
                            props.wallets &&
                            props.wallets.some((w) =>
                              areEqualAddresses(w, ownerAddress)
                            ) && (
                              <span
                                className={`mt-3 ${styles.avatarPlaceholder}`}>
                                <Image
                                  src="/add-image.png"
                                  alt={ownerENS}
                                  width={0}
                                  height={0}
                                />
                              </span>
                            )}
                          <span className="d-flex flex-column">
                            <span>
                              {tdh && consolidatedTDH ? (
                                <Address
                                  wallets={
                                    view === VIEW.CONSOLIDATION
                                      ? consolidatedTDH.wallets
                                      : [ownerAddress]
                                  }
                                  display={
                                    view === VIEW.CONSOLIDATION &&
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
                            </span>
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
                            <span className="pt-3">
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
                            </span>
                          </span>
                        </Col>
                      </Row>
                      {/* <Row className="pt-1">
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
                      </Row> */}
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
            <UserPageOverview tdh={tdh} />
            {walletOwnedLoaded && consolidationOwnedLoaded && (
              <UserPageDetails
                ownerAddress={ownerAddress}
                owned={owned}
                view={view}
                consolidatedTDH={consolidatedTDH}
                tdh={tdh}
                isConsolidation={isConsolidation}
              />
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}
