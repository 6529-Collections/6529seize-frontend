import styles from "../UserPage.module.scss";
import Image from "next/image";
import { Col, Container, Row } from "react-bootstrap";
import {
  areEqualAddresses,
  getRandomColor,
  numberWithCommas,
} from "../../../helpers/Helpers";
import UserEditProfileButton from "../settings/UserEditProfileButton";
import ConsolidationSwitch, {
  VIEW,
} from "../../consolidation-switch/ConsolidationSwitch";
import Address from "../../address/Address";
import DotLoader from "../../dotLoader/DotLoader";
import UserPageLinks from "../UserPageLinks";
import Tag, { TagType } from "../../address/Tag";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useAccount } from "wagmi";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../entities/ITDH";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Focus } from "../details/UserPageDetails";

const DEFAULT_BANNER_1 = getRandomColor();
const DEFAULT_BANNER_2 = getRandomColor();

export default function UserPageHeader({
  profile,
  tdh,
  ownerAddress,
  consolidatedTDH,
  isConsolidation,
  activeAddress,
  setActiveAddress,
  user,
  ownerENS,
  view,
  setView,
}: {
  profile: IProfileAndConsolidations;
  tdh: ConsolidatedTDHMetrics | TDHMetrics | undefined;
  consolidatedTDH: ConsolidatedTDHMetrics | undefined;
  isConsolidation: boolean;
  ownerAddress: `0x${string}` | undefined;
  activeAddress: string | null;
  setActiveAddress: (address: string | null) => void;
  user: string;
  ownerENS: string;
  view: VIEW;
  setView: (view: VIEW) => void;
}) {
  const account = useAccount();
  const router = useRouter();
  const banner1 = profile.profile?.banner_1 ?? DEFAULT_BANNER_1;
  const banner2 = profile.profile?.banner_2 ?? DEFAULT_BANNER_2;

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

  useEffect(() => {
    const currAddress = router.query.address;
    if (!currAddress && activeAddress) {
      setLatestActiveAddress(activeAddress);
      setActiveAddress(null);
    } else if (currAddress && currAddress !== activeAddress) {
      setLatestActiveAddress(null);
      setActiveAddress(currAddress as string);
    }
  }, [router.query]);

  return (
    <>
      <div
        style={{
          background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
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
                    {profile.profile?.pfp_url ? (
                      <Image
                        priority
                        loading={"eager"}
                        src={profile.profile?.pfp_url}
                        alt={user}
                        width={0}
                        height={0}
                        className={styles.pfp}
                      />
                    ) : (
                      <span
                        className={styles.pfpPlaceholder}
                        style={{
                          background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
                        }}
                      ></span>
                    )}
                  </span>

                  <span className="mt-3 d-flex align-items-start gap-2">
                    {account.address &&
                      areEqualAddresses(account.address, ownerAddress) && (
                        <UserEditProfileButton user={user} />
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
                                profile.consolidation.wallets
                              }
                              display={
                                activeAddress
                                  ? profile.consolidation.wallets.find(
                                      (w) =>
                                        w.wallet.address.toLowerCase() ===
                                        activeAddress.toLowerCase()
                                    )?.wallet.ens
                                  : profile.profile?.handle
                                  ? profile.profile.handle
                                  : view === VIEW.CONSOLIDATION &&
                                    consolidatedTDH.consolidation_display
                                  ? consolidatedTDH.consolidation_display
                                  : ownerENS
                              }
                              displayEns={
                                activeAddress
                                  ? profile.consolidation.wallets.find(
                                      (w) =>
                                        w.wallet.address.toLowerCase() ===
                                        activeAddress.toLowerCase()
                                    )?.wallet.ens
                                  : profile.profile?.handle
                                  ? profile.consolidation.wallets.reduce(
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
                  user={user}
                  userAddress={ownerAddress}
                  activeAddress={activeAddress}
                  profile={profile}
                />
              </Row>
            </Container>
          </>
        )}
      </Container>
    </>
  );
}
