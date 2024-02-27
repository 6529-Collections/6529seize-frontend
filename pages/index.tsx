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
import useManiofoldClaim, {
  ManifoldClaimStatus,
} from "../hooks/useManiofoldClaim";
import DotLoader from "../components/dotLoader/DotLoader";
export interface IndexPageProps {
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
  const [isHeaderLoaded, setIsHeaderLoaded] = useState(false);
  const [isNftImageLoaded, setIsNftImageLoaded] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  const [nft, setNFT] = useState<NFT>();
  const [nftExtended, setnftExtended] = useState<MemesExtendedData>();
  const [nftBalance, setNftBalance] = useState<number>(0);

  const manifoldClaim = useManiofoldClaim(MEMES_CONTRACT, nft?.id ?? -1);

  useEffect(() => {
    fetchUrl(
      `${process.env.API_ENDPOINT}/api/memes_extended_data?page_size=1`
    ).then((response: DBResponse) => {
      const nftExtended = response.data[0];
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/nfts?id=${nftExtended.id}&contract=${MEMES_CONTRACT}`
      ).then((response: DBResponse) => {
        const nft = response.data[0];
        setNFT(nft);
        setnftExtended(nftExtended);
      });
    });
  }, []);

  useEffect(() => {
    if (connectedWallets && connectedWallets.length > 0 && nft && nft.id) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/owners?contract=${
          nft.contract
        }&wallet=${connectedWallets.join(",")}&id=${nft.id}`
      ).then((response: DBResponse) => {
        let balance = 0;
        response.data.map((d) => {
          balance += d.balance;
        });
        setNftBalance(balance);
      });
    } else {
      setNftBalance(0);
    }
  }, [connectedWallets, nft]);

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
          onSetWallets={(wallets) => setConnectedWallets(wallets)}
          onLoad={() => {
            setIsHeaderLoaded(true);
          }}
        />
        {isHeaderLoaded && nft && nftExtended && (
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
                  lg={{ span: 6 }}>
                  <Container className="no-padding">
                    <Row>
                      {nft.animation ? (
                        <span
                          className={
                            connectedWallets && styles.nftImagePadding
                          }>
                          <NFTImage
                            nft={nft}
                            animation={true}
                            height={650}
                            balance={nftBalance}
                            onLoad={() => {
                              setIsNftImageLoaded(true);
                            }}
                            showUnseized={connectedWallets.length > 0}
                          />
                        </span>
                      ) : (
                        <a
                          href={`/the-memes/${nft.id}`}
                          className={
                            connectedWallets && styles.nftImagePadding
                          }>
                          <NFTImage
                            nft={nft}
                            animation={true}
                            height={650}
                            balance={nftBalance}
                            onLoad={() => {
                              setIsNftImageLoaded(true);
                            }}
                            showUnseized={connectedWallets.length > 0}
                          />
                        </a>
                      )}
                    </Row>
                  </Container>
                </Col>
                {isNftImageLoaded && (
                  <Col
                    className="pt-3 pb-3"
                    xs={{ span: 12 }}
                    sm={{ span: 12 }}
                    md={{ span: 6 }}
                    lg={{ span: 6 }}>
                    <Container>
                      <Row>
                        <Col>
                          <u>
                            <h3>
                              <a href={`/the-memes/${nft.id}`}>
                                Card {nft.id} - {nft.name}
                              </a>
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
                                  {manifoldClaim ? (
                                    manifoldClaim.total ===
                                    manifoldClaim.totalMax ? (
                                      <>
                                        {numberWithCommas(manifoldClaim.total)}
                                      </>
                                    ) : (
                                      <>
                                        {numberWithCommas(manifoldClaim.total)}{" "}
                                        /{" "}
                                        {numberWithCommas(
                                          manifoldClaim.totalMax
                                        )}
                                      </>
                                    )
                                  ) : (
                                    <DotLoader />
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td>Collection</td>
                                <td>{nft.collection}</td>
                              </tr>
                              <tr>
                                <td>Season</td>
                                <td>{nftExtended.season}</td>
                              </tr>
                              <tr>
                                <td>Meme</td>
                                <td>{nftExtended.meme_name}</td>
                              </tr>
                              <tr>
                                <td>Artist</td>
                                <td>{nft.artist}</td>
                              </tr>
                              <tr>
                                <td>Mint Date</td>
                                <td>{printMintDate(nft.mint_date)}</td>
                              </tr>
                              <tr>
                                <td>File Type</td>
                                <td>
                                  {nft.animation
                                    ? nft.metadata.animation_details?.format
                                    : nft.metadata.image_details.format}
                                </td>
                              </tr>
                              <tr>
                                <td>Dimensions</td>
                                <td>
                                  {nft.metadata.image_details.width} x{" "}
                                  {nft.metadata.image_details.height}
                                </td>
                              </tr>
                            </tbody>
                          </Table>
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <h3>Minting Approach</h3>
                        </Col>
                      </Row>
                      {manifoldClaim &&
                        manifoldClaim.status !==
                          ManifoldClaimStatus.EXPIRED && (
                          <Row className="pb-3">
                            <Col sm={12} md={11}>
                              <MintCountdown
                                title={
                                  manifoldClaim.status ===
                                  ManifoldClaimStatus.UPCOMING
                                    ? `Starts In`
                                    : `Ends In`
                                }
                                date={
                                  manifoldClaim.status ===
                                  ManifoldClaimStatus.UPCOMING
                                    ? manifoldClaim.startDate
                                    : manifoldClaim.endDate
                                }
                                hide_mint_btn={false}
                                btn_label="MINT NOW"
                                mint_link={MEMES_MINTING_HREF}
                                new_tab={true}
                              />
                            </Col>
                          </Row>
                        )}
                      <Row>
                        <Col>
                          <a
                            href={
                              nft.has_distribution
                                ? `/the-memes/${nft.id}/distribution`
                                : `https://github.com/6529-Collections/thememecards/tree/main/card${nft.id}`
                            }
                            target={nft.has_distribution ? "_self" : "_blank"}
                            rel="noreferrer">
                            Distribution Plan
                          </a>
                        </Col>
                      </Row>
                      {/* <Row>
                        <Col>
                          <a
                            href={
                              `https://github.com/6529-Collections/thememecards/tree/main/card` +
                              nft.id
                            }
                            target="_blank"
                            rel="noreferrer">
                            Allowlist
                          </a>
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <a
                            href={
                              `https://github.com/6529-Collections/thememecards/tree/main/card` +
                              nft.id
                            }
                            target="_blank"
                            rel="noreferrer">
                            Randomization
                          </a>
                        </Col>
                      </Row> */}
                      <Row className="pt-3">
                        <Col>
                          Mint price:{" "}
                          {manifoldClaim ? (
                            manifoldClaim.cost > 0 ? (
                              `${numberWithCommas(
                                Math.round(
                                  fromGWEI(manifoldClaim.cost) * 100000
                                ) / 100000
                              )} ETH`
                            ) : (
                              `N/A`
                            )
                          ) : (
                            <DotLoader />
                          )}
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          Floor Price:{" "}
                          {nft.floor_price > 0
                            ? `${numberWithCommas(
                                Math.round(nft.floor_price * 100) / 100
                              )} ETH`
                            : `N/A`}
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          Market Cap:{" "}
                          {nft.market_cap > 0
                            ? `${numberWithCommas(
                                Math.round(nft.market_cap * 100) / 100
                              )} ETH`
                            : `N/A`}
                        </Col>
                      </Row>
                      <Row className="pt-3">
                        <Col>
                          <a
                            href={`https://opensea.io/assets/ethereum/${MEMES_CONTRACT}/${nft.id}`}
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
                            href={`https://x2y2.io/eth/${MEMES_CONTRACT}/${nft.id}`}
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
                )}
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
                      <a
                        href={`/nextgen/collection/${formatNameForUrl(
                          pageProps.nextGenFeatured.name
                        )}`}
                        className={styles.viewAllLink}>
                        <span>View All</span>
                      </a>
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
                <ProfileActivityLogs
                  initialParams={INITIAL_ACTIVITY_LOGS_PARAMS}
                  withFilters={true}>
                  <span className="d-flex align-items-center gap-3">
                    <h1 className="tw-block tw-whitespace-nowrap tw-float-none tw-pb-0 tw-mb-0">
                      <span className="font-lightest">Community</span> Activity{" "}
                    </h1>
                    <a
                      href="/community-activity"
                      className={styles.viewAllLink}>
                      <span>View All</span>
                    </a>
                  </span>
                </ProfileActivityLogs>
              </div>
            </div>
            {isNftImageLoaded && (
              <Container className={styles.mainContainer}>
                <Row className="pt-3">
                  <Col xs={12} sm={12} md={12} lg={12}>
                    <LatestActivity page={1} pageSize={12} showMore={false} />
                  </Col>
                </Row>
              </Container>
            )}
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
    const logsPage = await getUserProfileActivityLogs({
      headers,
      params: convertActivityLogParams(INITIAL_ACTIVITY_LOGS_PARAMS),
    });
    const nextGenFeatured = await commonApiFetch<NextGenCollection>({
      endpoint: `nextgen/featured`,
      headers: headers,
    });
    return {
      props: {
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
