import styles from "./UserPage.module.scss";
import Image from "next/image";
import { Col, Container, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { Owner } from "../../entities/IOwner";
import { useRouter } from "next/router";
import {
  areEqualAddresses,
  containsEmojis,
  getRandomColor,
  isValidEthAddress,
  numberWithCommas,
} from "../../helpers/Helpers";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../entities/ITDH";
import { useAccount } from "wagmi";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import Tag, { TagType } from "../address/Tag";
import ConsolidationSwitch, {
  VIEW,
} from "../consolidation-switch/ConsolidationSwitch";
import Address from "../address/Address";
import UserPageDetails, { Focus } from "./UserPageDetails";
import { ENS } from "../../entities/IENS";
import DotLoader from "../dotLoader/DotLoader";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import UserEditProfileButton from "./settings/UserEditProfileButton";
import UserPageLinks from "./UserPageLinks";

interface Props {
  user: string;
  wallets: string[];
  profile: IProfileAndConsolidations;
}

const DEFAULT_BANNER_1 = getRandomColor();
const DEFAULT_BANNER_2 = getRandomColor();

const DEFAULT_PFP_1 = DEFAULT_BANNER_1;
const DEFAULT_PFP_2 = DEFAULT_BANNER_2;

export default function UserPage(props: Props) {
  const router = useRouter();
  const account = useAccount();
  const [view, setView] = useState<VIEW>(
    router.query.address ? VIEW.WALLET : VIEW.CONSOLIDATION
  );

  const [activeAddress, setActiveAddress] = useState<string | null>(
    router.query.address ? (router.query.address as string) : null
  );

  const [latestActiveAddress, setLatestActiveAddress] = useState<string | null>(
    null
  );

  const onView = (newView: VIEW) => {
    if (newView === VIEW.CONSOLIDATION) {
      const currentQuery = { ...router.query };
      delete currentQuery.address;
      setLatestActiveAddress(activeAddress);
      setActiveAddress(null);
      setView(newView);
      router.push(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true }
      );
    } else if (newView === VIEW.WALLET && latestActiveAddress) {
      const currentQuery = { ...router.query };
      currentQuery.address = latestActiveAddress;
      setActiveAddress(latestActiveAddress);
      setLatestActiveAddress(null);
      setView(newView);
      router.push(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true }
      );
    }
  };

  const [walletOwnedLoaded, setWalletOwnedLoaded] = useState(false);
  const [consolidationOwnedLoaded, setConsolidationOwnedLoaded] =
    useState(false);
  const [ownedLoaded, setOwnedLoaded] = useState(false);

  const [ownerAddress, setOwnerAddress] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [ownerENS, setOwnerENS] = useState("");

  const [owned, setOwned] = useState<Owner[]>([]);
  const [walletOwned, setWalletOwned] = useState<Owner[]>([]);
  const [consolidationOwned, setConsolidationOwned] = useState<Owner[]>([]);

  const [walletTDH, setWalletTDH] = useState<TDHMetrics>();
  const [consolidatedTDH, setConsolidatedTDH] =
    useState<ConsolidatedTDHMetrics>();
  const [tdh, setTDH] = useState<ConsolidatedTDHMetrics | TDHMetrics>();
  const [isConsolidation, setIsConsolidation] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);

  const [ens, setEns] = useState<ENS>();

  const [focus, setFocus] = useState<Focus>(
    (router.query.focus as Focus) || Focus.COLLECTION
  );

  useEffect(() => {
    const currFocus = router.query.focus;
    if (currFocus !== focus) {
      setFocus(currFocus as Focus);
    }
    const currAddress = router.query.address;
    if (!currAddress && activeAddress) {
      setLatestActiveAddress(activeAddress);
      setActiveAddress(null);
    } else if (currAddress && currAddress !== activeAddress) {
      setLatestActiveAddress(null);
      setActiveAddress(currAddress as string);
    }
  }, [router.query]);

  useEffect(() => {
    if (focus) {
      const currFocus = router.query.focus;
      if (!currFocus || currFocus[0] != focus) {
        const currentQuery = { ...router.query };
        currentQuery.focus = focus;
        router.push(
          {
            pathname: router.pathname,
            query: currentQuery,
          },
          undefined,
          { shallow: true }
        );
      }
    }
  }, [focus]);

  useEffect(() => {
    async function fetchENS() {
      if (
        isValidEthAddress(props.user) ||
        props.user.endsWith(".eth") ||
        props.profile?.profile?.primary_wallet ||
        activeAddress
      ) {
        const userUrl =
          isValidEthAddress(props.user) || props.user.endsWith(".eth")
            ? props.user
            : activeAddress
            ? activeAddress
            : props.profile?.profile?.primary_wallet;
        const url = `${process.env.API_ENDPOINT}/api/user/${userUrl}`;
        return fetchUrl(url).then((response: ENS) => {
          setEns({
            ...response,
            display: props.profile.profile?.handle ?? response.display,
            pfp: props.profile.profile?.pfp_url,
            banner_1: props.profile.profile?.banner_1,
            banner_2: props.profile.profile?.banner_2,
            website: props.profile.profile?.website,
          });

          const oAddress =
            activeAddress ??
            props.profile.profile?.primary_wallet ??
            response.wallet ??
            props.user;
          setOwnerAddress(oAddress as `0x${string}`);
          setOwnerENS(
            activeAddress ??
              props.profile?.profile?.primary_wallet ??
              response.display ??
              oAddress
          );
          const currentQuery: { focus: Focus; address?: string | undefined } = {
            focus: focus,
          };

          if (activeAddress) {
            currentQuery.address = activeAddress;
          }
          router.push(
            {
              pathname: props.profile.profile?.handle
                ? props.profile.profile.handle
                : response.display && !containsEmojis(response.display)
                ? response.display.replaceAll(" ", "-")
                : oAddress,
              query: currentQuery,
            },
            undefined,
            { shallow: true }
          );
          setFetchingUser(false);
        });
      }
      setFetchingUser(false);
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
      const url = `${process.env.API_ENDPOINT}/api/consolidated_owner_metrics/${
        ens?.consolidation_key ? ens?.consolidation_key : props.user
      }`;
      return fetchUrl(url).then((response: ConsolidatedTDHMetrics) => {
        if (response) {
          setConsolidatedTDH(response);
          if (response.wallets && response.wallets.length > 1) {
            setIsConsolidation(true);
          }
        }
      });
    }

    if (ens) {
      fetchConsolidatedTDH();
    }
  }, [ens]);

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

  return (
    <>
      <div
        style={{
          background: `linear-gradient(45deg, ${
            ens && ens.banner_1 ? ens.banner_1 : DEFAULT_BANNER_1
          } 0%, ${ens && ens.banner_2 ? ens.banner_2 : DEFAULT_BANNER_2} 100%)`,
        }}
      >
        <Container>
          <Row>
            <Col className={`${styles.banner}`}>
              <div>
                {tdh && (
                  <>
                    {(tdh.memes_cards_sets_szn1 > 0 ||
                      tdh.unique_memes > 0) && (
                      <>
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
                            text_after={tdh.genesis > 0 ? ` (+Genesis) ` : ""}
                          />
                        )}
                      </>
                    )}
                    {tdh.memes_cards_sets_szn1 > 0 && (
                      <Tag
                        type={TagType.SZN1}
                        text={"SZN1 Sets x"}
                        value={tdh.memes_cards_sets_szn1}
                      />
                    )}
                    {tdh.memes_cards_sets_szn2 > 0 && (
                      <Tag
                        type={TagType.SZN2}
                        text={"SZN2 Sets x"}
                        value={tdh.memes_cards_sets_szn2}
                      />
                    )}
                    {tdh.memes_cards_sets_szn3 > 0 && (
                      <Tag
                        type={TagType.SZN3}
                        text={"SZN3 Sets x"}
                        value={tdh.memes_cards_sets_szn3}
                      />
                    )}
                    {tdh.memes_cards_sets_szn4 > 0 && (
                      <Tag
                        type={TagType.SZN4}
                        text={"SZN4 Sets x"}
                        value={tdh.memes_cards_sets_szn4}
                      />
                    )}
                    {tdh.memes_cards_sets_szn5 > 0 && (
                      <Tag
                        type={TagType.SZN5}
                        text={"SZN5 Sets x"}
                        value={tdh.memes_cards_sets_szn5}
                      />
                    )}
                    {tdh.gradients_balance > 0 && (
                      <Tag
                        type={TagType.GRADIENT}
                        text={"Gradients x"}
                        value={tdh.gradients_balance}
                      />
                    )}
                  </>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      <Container>
        {ownerAddress && (
          <>
            <Container className="no-padding">
              <Row>
                <Col className="d-flex align-items-start justify-content-between">
                  <span
                    className={`${styles.imagePlaceholder} d-flex flex-wrap gap-2 align-items-center`}
                  >
                    {ens && ens.pfp ? (
                      <Image
                        priority
                        loading={"eager"}
                        src={ens.pfp}
                        alt={props.user}
                        width={0}
                        height={0}
                        className={styles.pfp}
                      />
                    ) : (
                      <span
                        className={styles.pfpPlaceholder}
                        style={{
                          background: `linear-gradient(45deg, ${
                            ens?.banner_1 ? ens.banner_1 : DEFAULT_PFP_1
                          } 0%, ${
                            ens?.banner_2 ? ens.banner_2 : DEFAULT_PFP_2
                          } 100%)`,
                        }}
                      ></span>
                    )}
                  </span>

                  <span className="mt-3 d-flex align-items-start gap-2">
                    {account.address &&
                      areEqualAddresses(account.address, ownerAddress) && (
                        <UserEditProfileButton user={props.user} />
                      )}
                  </span>
                </Col>
              </Row>
            </Container>
            <Container className="no-padding">
              <Row>
                <Col
                  xs={12}
                  sm={6}
                  className={`pt-2 pb-2 ${styles.tagsContainer}`}
                >
                  {tdh ? (
                    <Container>
                      {tdh && consolidatedTDH ? (
                        <span className={styles.addressContainer}>
                          {isConsolidation &&
                            (activeAddress || latestActiveAddress) && (
                              <span>
                                <ConsolidationSwitch
                                  view={view}
                                  onSetView={onView}
                                />
                              </span>
                            )}
                          <span>
                            <Address
                              wallets={
                                view === VIEW.CONSOLIDATION
                                  ? consolidatedTDH.wallets
                                  : [ownerAddress]
                              }
                              consolidatedWallets={
                                props.profile.consolidation.wallets
                              }
                              display={
                                activeAddress
                                  ? props.profile.consolidation.wallets.find(
                                      (w) =>
                                        w.wallet.address.toLowerCase() ===
                                        activeAddress.toLowerCase()
                                    )?.wallet.ens
                                  : props.profile.profile?.handle
                                  ? props.profile.profile.handle
                                  : view === VIEW.CONSOLIDATION &&
                                    consolidatedTDH.consolidation_display
                                  ? consolidatedTDH.consolidation_display
                                  : ownerENS
                              }
                              displayEns={
                                activeAddress
                                  ? props.profile.consolidation.wallets.find(
                                      (w) =>
                                        w.wallet.address.toLowerCase() ===
                                        activeAddress.toLowerCase()
                                    )?.wallet.ens
                                  : props.profile.profile?.handle
                                  ? props.profile.consolidation.wallets.reduce(
                                      (prev, curr) =>
                                        prev.tdh > curr.tdh ? prev : curr
                                    ).wallet.ens
                                  : undefined
                              }
                              isUserPage={true}
                              disableLink={true}
                              viewingWallet={ownerAddress}
                              setLinkQueryAddress={true}
                            />
                          </span>
                        </span>
                      ) : (
                        <span className="d-flex flex-wrap">
                          <Address
                            wallets={[ownerAddress]}
                            display={ownerENS}
                            disableLink={true}
                            isUserPage={true}
                            viewingWallet={ownerAddress}
                            setLinkQueryAddress={true}
                          />
                        </span>
                      )}
                      {tdh.tdh_rank && (
                        <Row className="pt-2 pb-2">
                          <Col>
                            <Tag
                              type={TagType.RANK}
                              text={`TDH ${numberWithCommas(tdh.boosted_tdh)} ${
                                tdh.day_change
                                  ? `(${
                                      tdh.day_change > 0 ? "+" : ""
                                    }${numberWithCommas(tdh.day_change)})`
                                  : ""
                              } | Rank #${tdh.tdh_rank}`}
                            />
                          </Col>
                        </Row>
                      )}
                      {tdh.balance > 0 ? (
                        <>
                          <Row className="pt-2 pb-2">
                            <Col>
                              <Tag
                                type={TagType.RANK}
                                text={`Total Cards x${numberWithCommas(
                                  tdh.balance
                                )} | Rank #${tdh.dense_rank_balance}`}
                              />
                            </Col>
                          </Row>
                          <Row className="pt-2 pb-2">
                            <Col>
                              <Tag
                                type={TagType.RANK}
                                text={`Unique Cards x${numberWithCommas(
                                  tdh.unique_memes + tdh.gradients_balance
                                )} | Rank #${tdh.dense_rank_unique}`}
                              />
                            </Col>
                          </Row>
                        </>
                      ) : (
                        <>
                          <Row className="pt-2 pb-2">
                            <Col>
                              <Tag type={TagType.RANK} text={`TDH -`} />
                            </Col>
                          </Row>
                          <Row className="pt-2 pb-2">
                            <Col>
                              <Tag type={TagType.RANK} text={`Total Cards -`} />
                            </Col>
                          </Row>
                        </>
                      )}
                      {tdh.boost && (
                        <Row className="pt-2 pb-2">
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
                  ) : (
                    <Container>
                      <Row>
                        <Col>
                          <DotLoader />
                        </Col>
                      </Row>
                    </Container>
                  )}
                </Col>
                <UserPageLinks
                  user={props.user}
                  userAddress={ownerAddress}
                  activeAddress={activeAddress}
                  profile={props.profile}
                />
              </Row>
            </Container>
          </>
        )}
      </Container>
      <Container>
        <Row>
          <Col>
            {focus && (
              <UserPageDetails
                ownerAddress={ownerAddress}
                owned={owned}
                view={view}
                consolidatedTDH={consolidatedTDH}
                tdh={tdh}
                isConsolidation={isConsolidation}
                focus={focus}
                setFocus={setFocus}
              />
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}
