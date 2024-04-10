import Head from "next/head";
import styles from "../styles/Home.module.scss";
import Image from "next/image";
import { Col, Container, Row, Table } from "react-bootstrap";
import { useContext, useEffect, useState } from "react";
import { MEMES_CONTRACT, MEMES_MINTING_HREF } from "../constants";
import { DBResponse } from "../entities/IDBResponse";
import { NFT, MemesExtendedData } from "../entities/INFT";

import dynamic from "next/dynamic";
import {
  fromGWEI,
  isEmptyObject,
  numberWithCommas,
  printMintDate,
} from "../helpers/Helpers";
import { fetchUrl } from "../services/6529api";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import { ProfileActivityLog } from "../entities/IProfile";
import { Page } from "../helpers/Types";
import {
  getCommonHeaders,
  getUserProfileActivityLogs,
} from "../helpers/server.helpers";
import ProfileActivityLogs, {
  ActivityLogParams,
  convertActivityLogParams,
} from "../components/profile-activity/ProfileActivityLogs";
import { FilterTargetType } from "../components/utils/CommonFilterTargetSelect";
import { ReactQueryWrapperContext } from "../components/react-query-wrapper/ReactQueryWrapper";
import NextGenCollectionSlideshow from "../components/nextGen/collections/collectionParts/NextGenCollectionSlideshow";
import { NextGenCollection } from "../entities/INextgen";
import { commonApiFetch } from "../services/api/common-api";
import { formatNameForUrl } from "../components/nextGen/nextgen_helpers";
import useManifoldClaim, {
  ManifoldClaimStatus,
  ManifoldPhase,
} from "../hooks/useManifoldClaim";
import DotLoader from "../components/dotLoader/DotLoader";
import ArtistProfileHandle from "../components/the-memes/ArtistProfileHandle";
import Link from "next/link";
import { AuthContext } from "../components/auth/Auth";
import { NftOwner } from "../entities/IOwner";
import {
  getFileTypeFromMetadata,
  getDimensionsFromMetadata,
} from "../helpers/nft.helplers";
export interface IndexPageProps {
  readonly nft: NFT;
  readonly nftExtended: MemesExtendedData;
  readonly logsPage: Page<ProfileActivityLog>;
  readonly nextGenFeatured: NextGenCollection;
}

const INITIAL_ACTIVITY_LOGS_PARAMS: ActivityLogParams = {
  page: 1,
  pageSize: 20,
  logTypes: [],
  matter: null,
  targetType: FilterTargetType.ALL,
  handleOrWallet: null,
  activeCurationFilterId: null,
};

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const NFTImage = dynamic(() => import("../components/nft-image/NFTImage"), {
  ssr: false,
});

const LatestActivity = dynamic(
  () => import("../components/latest-activity/LatestActivity"),
  { ssr: false }
);

const MintCountdown = dynamic(
  () => import("../components/mintCountdownBox/MintCountdownBox"),
  { ssr: false }
);

export default function Home({
  pageProps,
}: {
  readonly pageProps: IndexPageProps;
}) {
  const { initLandingPage } = useContext(ReactQueryWrapperContext);
  initLandingPage({
    activityLogs: {
      data: pageProps.logsPage,
      params: INITIAL_ACTIVITY_LOGS_PARAMS,
    },
  });

  const { connectedProfile } = useContext(AuthContext);

  const [isHeaderLoaded, setIsHeaderLoaded] = useState(false);

  const [nftBalance, setNftBalance] = useState<number>(0);

  const [disableClaim, setDisableClaim] = useState(false);
  const manifoldClaim = useManifoldClaim(
    MEMES_CONTRACT,
    pageProps.nft.id,
    disableClaim
  );

  useEffect(() => {
    if (
      manifoldClaim &&
      (manifoldClaim.total === manifoldClaim.totalMax ||
        (manifoldClaim.phase == ManifoldPhase.PUBLIC &&
          manifoldClaim.status === ManifoldClaimStatus.EXPIRED))
    ) {
      setDisableClaim(true);
    }
  }, [manifoldClaim]);

  useEffect(() => {
    if (connectedProfile?.consolidation.consolidation_key && pageProps.nft) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/nft-owners/consolidation/${connectedProfile?.consolidation.consolidation_key}?contract=${pageProps.nft.contract}&token_id=${pageProps.nft.id}`
      ).then((response: DBResponse) => {
        const balanceObject: NftOwner = response.data[0];
        setNftBalance(balanceObject?.balance ?? 0);
      });
    } else {
      setNftBalance(0);
    }
  }, [connectedProfile]);

  const renderManifoldClaimEditionSize = () => {
    if (manifoldClaim) {
      if (disableClaim) {
        return <>{numberWithCommas(manifoldClaim.total)}</>;
      } else {
        return (
          <>
            {numberWithCommas(manifoldClaim.total)} /{" "}
            {numberWithCommas(manifoldClaim.totalMax)}
          </>
        );
      }
    } else {
      return <DotLoader />;
    }
  };

  const renderManifoldClaimCost = () => {
    if (manifoldClaim) {
      if (manifoldClaim.cost > 0) {
        return `${numberWithCommas(
          Math.round(fromGWEI(manifoldClaim.cost) * 100000) / 100000
        )} ETH`;
      } else {
        return `N/A`;
      }
    } else {
      return <DotLoader />;
    }
  };

  return (
    <>
      <Head>
        <title>6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="6529 SEIZE" />
        <meta property="og:url" content={`${process.env.BASE_ENDPOINT}`} />
        <meta property="og:title" content="6529 SEIZE" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header
          onLoad={() => {
            setIsHeaderLoaded(true);
          }}
        />
        {isHeaderLoaded && (
          <>
            <Container className={`pt-4 ${styles.mainContainer}`}>
              <Row>
                <Col>
                  <h1>
                    <span className="font-lightest">Latest</span> Drop
                  </h1>
                </Col>
              </Row>
              <Row>
                <Col
                  className="pt-3 pb-3 d-flex align-items-center justify-content-center"
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 6 }}
                  lg={{ span: 6 }}
                >
                  <Container className="no-padding">
                    <Row>
                      {pageProps.nft.animation ? (
                        <span
                          className={
                            connectedProfile ? styles.nftImagePadding : ""
                          }
                        >
                          <NFTImage
                            nft={pageProps.nft}
                            animation={true}
                            height={650}
                            balance={nftBalance}
                            showUnseized={!!connectedProfile}
                          />
                        </span>
                      ) : (
                        <Link
                          href={`/the-memes/${pageProps.nft.id}`}
                          className={
                            connectedProfile ? styles.nftImagePadding : ""
                          }
                        >
                          <NFTImage
                            nft={pageProps.nft}
                            animation={true}
                            height={650}
                            balance={nftBalance}
                            showUnseized={!!connectedProfile}
                          />
                        </Link>
                      )}
                    </Row>
                  </Container>
                </Col>

                <Col
                  className="pt-3 pb-3"
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 6 }}
                  lg={{ span: 6 }}
                >
                  <Container>
                    <Row>
                      <Col>
                        <u>
                          <h3>
                            <Link href={`/the-memes/${pageProps.nft.id}`}>
                              Card {pageProps.nft.id} - {pageProps.nft.name}
                            </Link>
                          </h3>
                        </u>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <Table bordered={false}>
                          <tbody>
                            <tr>
                              <td>Edition Size</td>
                              <td>{renderManifoldClaimEditionSize()}</td>
                            </tr>
                            <tr>
                              <td>Collection</td>
                              <td>{pageProps.nft.collection}</td>
                            </tr>
                            <tr>
                              <td>Season</td>
                              <td>{pageProps.nftExtended.season}</td>
                            </tr>
                            <tr>
                              <td>Meme</td>
                              <td>{pageProps.nftExtended.meme_name}</td>
                            </tr>
                            <tr>
                              <td>Artist Name</td>
                              <td>{pageProps.nft.artist}</td>
                            </tr>
                            <tr>
                              <td>Artist Profile</td>
                              <td>
                                <ArtistProfileHandle nft={pageProps.nft} />
                              </td>
                            </tr>
                            <tr>
                              <td>Mint Date</td>
                              <td>{printMintDate(pageProps.nft.mint_date)}</td>
                            </tr>
                            <tr>
                              <td>File Type</td>
                              <td>
                                {getFileTypeFromMetadata(
                                  pageProps.nft.metadata
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td>Dimensions</td>
                              <td>
                                {getDimensionsFromMetadata(
                                  pageProps.nft.metadata
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                    {manifoldClaim &&
                      manifoldClaim.status !== ManifoldClaimStatus.EXPIRED &&
                      !disableClaim && (
                        <Row className="pb-3">
                          <Col sm={12} md={11}>
                            <MintCountdown
                              title={
                                manifoldClaim.status ===
                                ManifoldClaimStatus.UPCOMING
                                  ? `${manifoldClaim.phase} Starts In`
                                  : `${manifoldClaim.phase} Ends In`
                              }
                              date={
                                manifoldClaim.status ===
                                ManifoldClaimStatus.UPCOMING
                                  ? manifoldClaim.startDate
                                  : manifoldClaim.endDate
                              }
                              hide_mint_btn={false}
                              btn_label="GO TO MINTING PAGE"
                              mint_link={MEMES_MINTING_HREF}
                              new_tab={true}
                              additional_elements={
                                manifoldClaim.phase ===
                                  ManifoldPhase.ALLOWLIST && (
                                  <span className="font-smaller pt-1">
                                    * The timer above displays the current time
                                    remaining for a specific phase of the drop.
                                    Please refer to the distribution plan to
                                    check if you are in the allowlist.
                                  </span>
                                )
                              }
                            />
                          </Col>
                        </Row>
                      )}
                    <Row>
                      <Col>
                        <h3>Minting Approach</h3>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <a
                          href={
                            pageProps.nft.has_distribution
                              ? `/the-memes/${pageProps.nft.id}/distribution`
                              : `https://github.com/6529-Collections/thememecards/tree/main/card${pageProps.nft.id}`
                          }
                          target={
                            pageProps.nft.has_distribution ? "_self" : "_blank"
                          }
                          rel="noreferrer"
                        >
                          Distribution Plan
                        </a>
                      </Col>
                    </Row>
                    <Row className="pt-3">
                      <Col>Mint price: {renderManifoldClaimCost()}</Col>
                    </Row>
                    <Row>
                      <Col>
                        Floor Price:{" "}
                        {pageProps.nft.floor_price > 0
                          ? `${numberWithCommas(
                              Math.round(pageProps.nft.floor_price * 100) / 100
                            )} ETH`
                          : `N/A`}
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        Market Cap:{" "}
                        {pageProps.nft.market_cap > 0
                          ? `${numberWithCommas(
                              Math.round(pageProps.nft.market_cap * 100) / 100
                            )} ETH`
                          : `N/A`}
                      </Col>
                    </Row>
                    <Row className="pt-3">
                      <Col>
                        <a
                          href={`https://opensea.io/assets/ethereum/${MEMES_CONTRACT}/${pageProps.nft.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Image
                            className={styles.marketplace}
                            src="/opensea.png"
                            alt="opensea"
                            width={40}
                            height={40}
                          />
                        </a>
                        <a
                          href={`https://x2y2.io/eth/${MEMES_CONTRACT}/${pageProps.nft.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
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
              </Row>
            </Container>
            {pageProps.nextGenFeatured &&
              !isEmptyObject(pageProps.nextGenFeatured) && (
                <Container className="pt-3 pb-5">
                  <Row>
                    <Col className="d-flex align-items-center gap-3">
                      <h1>
                        <span className="font-lightest">Discover</span> NextGen
                        - {pageProps.nextGenFeatured.name}{" "}
                      </h1>
                      <Link
                        href={`/nextgen/collection/${formatNameForUrl(
                          pageProps.nextGenFeatured.name
                        )}`}
                        className={styles.viewAllLink}
                      >
                        <span>View Collection</span>
                      </Link>
                    </Col>
                  </Row>
                  <Row className="pt-3">
                    <Col>
                      <NextGenCollectionSlideshow
                        collection={pageProps.nextGenFeatured}
                      />
                    </Col>
                  </Row>
                </Container>
              )}
            {/* TODO */}
            {/* <div className="tailwind-scope tw-relative tw-px-2 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
              <div className="tw-px-2">
                <ProfileActivityLogs
                  initialParams={INITIAL_ACTIVITY_LOGS_PARAMS}
                  withFilters={true}
                  disableActiveCurationFilter={true}>
                  <span className="d-flex align-items-center gap-3">
                    <h1 className="tw-block tw-whitespace-nowrap tw-float-none tw-pb-0 tw-mb-0">
                      <span className="font-lightest">Community</span> Activity{" "}
                    </h1>
                    <Link
                      href="/community-activity"
                      className={styles.viewAllLink}>
                      <span>View All</span>
                    </Link>
                  </span>
                </ProfileActivityLogs>
              </div>
            </div> */}
            <Container className={styles.mainContainer}>
              <Row className="pt-3">
                <Col xs={12} sm={12} md={12} lg={12}>
                  <LatestActivity page={1} pageSize={12} showMore={false} />
                </Col>
              </Row>
            </Container>
          </>
        )}
      </main>
    </>
  );
}

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: IndexPageProps;
}> {
  try {
    const headers = getCommonHeaders(req);
    const { nft, nftExtended } = await commonApiFetch<{
      data: MemesExtendedData[];
    }>({
      endpoint: `memes_extended_data?sort=age&sort_direction=asc&page_size=1`,
      headers: headers,
    }).then(async (responseExtended) => {
      const nftExtended = responseExtended.data[0];
      return await commonApiFetch<{
        data: NFT[];
      }>({
        endpoint: `nfts?id=${nftExtended.id}&contract=${MEMES_CONTRACT}`,
        headers: headers,
      }).then((responseNft) => {
        const nft = responseNft.data[0];
        return {
          nft: nft,
          nftExtended: nftExtended,
        };
      });
    });
    const logsPage = await getUserProfileActivityLogs({
      headers,
      params: convertActivityLogParams({
        params: INITIAL_ACTIVITY_LOGS_PARAMS,
        disableActiveCurationFilter: true,
      }),
    });
    const nextGenFeatured = await commonApiFetch<NextGenCollection>({
      endpoint: `nextgen/featured`,
      headers: headers,
    });
    return {
      props: {
        nft,
        nftExtended,
        logsPage,
        nextGenFeatured,
      },
    };
  } catch (e: any) {
    return {
      redirect: {
        permanent: false,
        destination: "/404",
      },
      props: {},
    } as any;
  }
}
