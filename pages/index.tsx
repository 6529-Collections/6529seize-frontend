import Head from "next/head";
import styles from "../styles/Home.module.scss";
import Image from "next/image";
import { Col, Container, Row, Table } from "react-bootstrap";
import { useContext, useEffect, useState } from "react";
import { MEMES_CONTRACT } from "../constants";
import { DBResponse } from "../entities/IDBResponse";
import { NFTWithMemesExtendedData } from "../entities/INFT";

import dynamic from "next/dynamic";
import {
  capitalizeEveryWord,
  fromGWEI,
  isEmptyObject,
  numberWithCommas,
  printMintDate,
} from "../helpers/Helpers";
import { fetchUrl } from "../services/6529api";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import { ProfileActivityLog } from "../entities/IProfile";
import { CountlessPage } from "../helpers/Types";
import {
  getCommonHeaders,
  getUserProfileActivityLogs,
} from "../helpers/server.helpers";
import {
  ActivityLogParams,
  convertActivityLogParams,
} from "../components/profile-activity/ProfileActivityLogs";
import { FilterTargetType } from "../components/utils/CommonFilterTargetSelect";
import { ReactQueryWrapperContext } from "../components/react-query-wrapper/ReactQueryWrapper";
import NextGenCollectionSlideshow from "../components/nextGen/collections/collectionParts/NextGenCollectionSlideshow";
import { NextGenCollection } from "../entities/INextgen";
import { commonApiFetch } from "../services/api/common-api";
import { formatNameForUrl } from "../components/nextGen/nextgen_helpers";
import DotLoader from "../components/dotLoader/DotLoader";
import ArtistProfileHandle from "../components/the-memes/ArtistProfileHandle";
import Link from "next/link";
import { AuthContext } from "../components/auth/Auth";
import { NftOwner } from "../entities/IOwner";
import {
  getFileTypeFromMetadata,
  getDimensionsFromMetadata,
} from "../helpers/nft.helpers";
import { getProfileLogTypes } from "../helpers/profile-logs.helpers";
import { ManifoldClaim } from "../hooks/useManifoldClaim";

export interface IndexPageProps {
  readonly nft: NFTWithMemesExtendedData;
  readonly logsPage: CountlessPage<ProfileActivityLog>;
  readonly nextGenFeatured: NextGenCollection;
}

const INITIAL_ACTIVITY_LOGS_PARAMS: ActivityLogParams = {
  page: 1,
  pageSize: 20,
  logTypes: getProfileLogTypes({
    logTypes: [],
  }),
  matter: null,
  targetType: FilterTargetType.ALL,
  handleOrWallet: null,
  groupId: null,
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

const MemePageMintCountdown = dynamic(
  () => import("../components/the-memes/MemePageMintCountdown"),
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

  const [manifoldClaim, setManifoldClaim] = useState<ManifoldClaim>();

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
      if (manifoldClaim.isFinalized) {
        return <>{numberWithCommas(manifoldClaim.total)}</>;
      } else {
        return (
          <>
            {numberWithCommas(manifoldClaim.total)} /{" "}
            {numberWithCommas(manifoldClaim.totalMax)}
            {manifoldClaim.isFetching && (
              <>
                {" "}
                <DotLoader />
              </>
            )}
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
                      {pageProps.nft.animation ||
                      pageProps.nft.metadata.animation ? (
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
                              <td>
                                <b>{renderManifoldClaimEditionSize()}</b>
                              </td>
                            </tr>
                            <tr>
                              <td>Collection</td>
                              <td>
                                <b>{pageProps.nft.collection}</b>
                              </td>
                            </tr>
                            <tr>
                              <td>Season</td>
                              <td>
                                <b>{pageProps.nft.season}</b>
                              </td>
                            </tr>
                            <tr>
                              <td>Meme</td>
                              <td>
                                <b>{pageProps.nft.meme_name}</b>
                              </td>
                            </tr>
                            <tr>
                              <td>Artist Name</td>
                              <td>
                                <b>{pageProps.nft.artist}</b>
                              </td>
                            </tr>
                            <tr>
                              <td>Artist Profile</td>
                              <td>
                                <b>
                                  <ArtistProfileHandle nft={pageProps.nft} />
                                </b>
                              </td>
                            </tr>
                            <tr>
                              <td>Mint Date</td>
                              <td>
                                <b>{printMintDate(pageProps.nft.mint_date)}</b>
                              </td>
                            </tr>
                            <tr>
                              <td>File Type</td>
                              <td>
                                <b>
                                  {getFileTypeFromMetadata(
                                    pageProps.nft.metadata
                                  )}
                                </b>
                              </td>
                            </tr>
                            <tr>
                              <td>Dimensions</td>
                              <td>
                                <b>
                                  {getDimensionsFromMetadata(
                                    pageProps.nft.metadata
                                  )}
                                </b>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <MemePageMintCountdown
                          nft_id={pageProps.nft.id}
                          setClaim={setManifoldClaim}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <h3>Minting Approach</h3>
                      </Col>
                    </Row>
                    <Row className="pb-3">
                      <Col>
                        <Link
                          href={`/the-memes/${pageProps.nft.id}/distribution`}
                        >
                          Distribution Plan
                        </Link>
                      </Col>
                    </Row>
                    <Table bordered={false}>
                      <tbody>
                        {manifoldClaim && (
                          <tr>
                            <td>Status</td>
                            <td>
                              <b>
                                {capitalizeEveryWord(manifoldClaim?.status)}
                              </b>
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td>Mint Price</td>
                          <td>
                            <b>{renderManifoldClaimCost()}</b>
                          </td>
                        </tr>
                        <tr>
                          <td>Floor Price</td>
                          <td>
                            <b>
                              {pageProps.nft.floor_price > 0
                                ? `${numberWithCommas(
                                    Math.round(
                                      pageProps.nft.floor_price * 100
                                    ) / 100
                                  )} ETH`
                                : `N/A`}
                            </b>
                          </td>
                        </tr>
                        <tr>
                          <td>Market Cap</td>
                          <td>
                            <b>
                              {pageProps.nft.market_cap > 0
                                ? `${numberWithCommas(
                                    Math.round(pageProps.nft.market_cap * 100) /
                                      100
                                  )} ETH`
                                : `N/A`}
                            </b>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
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
            <div className="tailwind-scope tw-relative tw-px-2 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
              <div className="tw-px-2">
                {/* <ProfileActivityLogs
                  initialParams={INITIAL_ACTIVITY_LOGS_PARAMS}
                  withFilters={true}
                  disableActiveGroup={true}>
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
                </ProfileActivityLogs> */}
              </div>
            </div>
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
    const nft = await commonApiFetch<NFTWithMemesExtendedData>({
      endpoint: `memes_latest`,
      headers: headers,
    }).then(async (responseExtended) => responseExtended);
    const logsPage = await getUserProfileActivityLogs({
      headers,
      params: convertActivityLogParams({
        params: INITIAL_ACTIVITY_LOGS_PARAMS,
        disableActiveGroup: true,
      }),
    });
    const nextGenFeatured = await commonApiFetch<NextGenCollection>({
      endpoint: `nextgen/featured`,
      headers: headers,
    });
    return {
      props: {
        nft,
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
