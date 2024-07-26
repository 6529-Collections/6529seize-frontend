import styles from "../NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  AllowlistType,
  CollectionWithMerkle,
  Status,
} from "../../nextgen_entities";
import Image from "next/image";
import { NEXTGEN_CHAIN_ID } from "../../nextgen_contracts";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DateCountdown from "../../../date-countdown/DateCountdown";
import { fetchUrl } from "../../../../services/6529api";
import DotLoader from "../../../dotLoader/DotLoader";
import { NextGenCollection } from "../../../../entities/INextgen";
import {
  formatNameForUrl,
  getOpenseaLink,
  getStatusFromDates,
  useCollectionMintCount,
} from "../../nextgen_helpers";
import { isEmptyObject, numberWithCommas } from "../../../../helpers/Helpers";
import { DistributionLink } from "../NextGen";
import Head from "next/head";
import { getCommonHeaders } from "../../../../helpers/server.helpers";
import { commonApiFetch } from "../../../../services/api/common-api";

interface Props {
  collection: NextGenCollection;
  collection_link?: boolean;
  show_links?: boolean;
}

interface CountdownProps {
  collection: NextGenCollection;
}

interface PhaseProps {
  collection: NextGenCollection;
  available: number;
}

export function NextGenBackToCollectionPageLink(
  props: Readonly<{ collection: NextGenCollection }>
) {
  const pathname = window?.location.pathname;
  const isArtPage =
    (pathname.endsWith("/art") ||
      pathname.endsWith("/trait-sets") ||
      pathname.endsWith("/distribution-plan")) ??
    false;
  const content = isArtPage
    ? "Back to collection page"
    : "Back to collection art";

  const link = `/nextgen/collection/${formatNameForUrl(props.collection.name)}${
    isArtPage ? "" : "/art"
  }`;

  return (
    <a
      href={link}
      className="pt-2 decoration-none d-flex align-items-center gap-2 pb-2">
      <FontAwesomeIcon icon="arrow-circle-left" className={styles.backIcon} />
      {content}
    </a>
  );
}

export function NextGenCountdown(props: Readonly<CountdownProps>) {
  const router = useRouter();
  const alStatus = getStatusFromDates(
    props.collection.allowlist_start,
    props.collection.allowlist_end
  );
  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  const [collection, setCollection] = useState<CollectionWithMerkle>();
  const [collectionLoaded, setCollectionLoaded] = useState(false);

  useEffect(() => {
    const url = `${process.env.API_ENDPOINT}/api/nextgen/merkle_roots/${props.collection.merkle_root}`;
    fetchUrl(url).then((response: CollectionWithMerkle) => {
      if (response) {
        setCollection(response);
      }
      setCollectionLoaded(true);
    });
  }, [props.collection]);

  function getButtonLabel() {
    if (collectionLoaded) {
      if (collection && collection.al_type === AllowlistType.EXTERNAL_BURN) {
        return "BURN TO MINT";
      }
      return "MINT";
    }
    return <DotLoader />;
  }

  function printCountdown(title: string, date: number) {
    const pathParts = router.pathname.split("/");
    const hideMintBtn = pathParts[pathParts.length - 1] === "mint";

    return (
      <span className={styles.countdownContainer}>
        <DateCountdown title={`${title} in`} date={new Date(date * 1000)} />
        {!hideMintBtn && (
          <a
            href={`/nextgen/collection/${formatNameForUrl(
              props.collection.name
            )}/mint`}>
            <button
              className={`pt-2 pb-2 seize-btn btn-block no-wrap ${styles.exploreBtn}`}>
              {getButtonLabel()}
            </button>
          </a>
        )}
        <DistributionLink collection={props.collection} />
      </span>
    );
  }

  return (
    <>
      {alStatus == Status.UPCOMING &&
        printCountdown("Allowlist Starting", props.collection.allowlist_start)}
      {alStatus == Status.LIVE &&
        printCountdown("Allowlist Ending", props.collection.allowlist_end)}
      {alStatus != Status.LIVE &&
        alStatus != Status.UPCOMING &&
        publicStatus == Status.UPCOMING &&
        printCountdown("Public Phase Starting", props.collection.public_start)}
      {publicStatus == Status.LIVE &&
        printCountdown("Public Phase Ending", props.collection.public_end)}
    </>
  );
}

export function NextGenPhases(props: Readonly<PhaseProps>) {
  const alStatus = getStatusFromDates(
    props.collection.allowlist_start,
    props.collection.allowlist_end
  );
  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  function getAllowlistClassName() {
    if (alStatus === Status.LIVE && props.available > 0) {
      return styles.phaseTimeTagActive;
    } else if (alStatus === Status.UPCOMING && props.available > 0) {
      return styles.phaseTimeTagUpcoming;
    } else {
      return styles.phaseTimeTagComplete;
    }
  }

  function getPublicStatusClassName() {
    if (publicStatus === Status.LIVE && props.available > 0) {
      return styles.phaseTimeTagActive;
    } else if (publicStatus === Status.UPCOMING && props.available > 0) {
      return styles.phaseTimeTagUpcoming;
    } else {
      return styles.phaseTimeTagComplete;
    }
  }

  return (
    <span className="pt-2 pb-2 d-flex align-items-center gap-2 align-items-center">
      {alStatus !== Status.UNAVAILABLE && (
        <span
          className={`d-flex align-items-center font-bolder font-smaller ${
            styles.nextgenTag
          } ${getAllowlistClassName()}`}>
          ALLOWLIST {alStatus}
        </span>
      )}
      {publicStatus !== Status.UNAVAILABLE && (
        <span
          className={`d-flex align-items-center font-bolder font-smaller ${
            styles.nextgenTag
          } ${getPublicStatusClassName()}`}>
          PUBLIC PHASE {publicStatus}
        </span>
      )}
    </span>
  );
}

export default function NextGenCollectionHeader(props: Readonly<Props>) {
  const [available, setAvailable] = useState<number>(0);

  function showMint() {
    if (props.collection.mint_count == props.collection.total_supply) {
      return false;
    }

    const now = new Date().getTime() / 1000;
    const allowlistStartsIn = props.collection.allowlist_start - now;
    if (allowlistStartsIn > 0 && allowlistStartsIn < 1000 * 60 * 60 * 24) {
      return true;
    }
    const publicStartsIn = props.collection.public_start - now;
    if (publicStartsIn > 0 && publicStartsIn < 1000 * 60 * 60 * 24) {
      return true;
    }
    return (
      (now >= props.collection.allowlist_start &&
        props.collection.allowlist_end > now) ||
      (now >= props.collection.public_start &&
        props.collection.public_end > now)
    );
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col className="d-flex justify-content-between align-items-center flex-wrap">
          {
            <NextGenPhases
              collection={props.collection}
              available={available}
            />
          }
          {props.show_links && (
            <span className="pt-2 pb-2 d-flex align-items-center justify-content-end gap-4">
              <a
                href={
                  props.collection.opensea_link ||
                  getOpenseaLink(NEXTGEN_CHAIN_ID)
                }
                target="_blank"
                rel="noreferrer">
                <Image
                  className={styles.marketplace}
                  src="/opensea.png"
                  alt="opensea"
                  width={32}
                  height={32}
                />
              </a>
            </span>
          )}
        </Col>
      </Row>
      <Row>
        <Col className={`d-flex flex-column align-items-start pt-3 gap-3`}>
          <span className="d-flex flex-column align-items-start">
            <h1 className="mb-0 font-color">{props.collection.name}</h1>
            {props.collection_link && (
              <NextGenBackToCollectionPageLink collection={props.collection} />
            )}
          </span>
          <span className="font-larger">
            by{" "}
            <b>
              <a href={`/${props.collection.artist_address}`}>
                {props.collection.artist}
              </a>
            </b>
          </span>
          <span className="pt-2 font-larger d-inline-flex align-items-center">
            <NextGenMintCounts
              collection={props.collection}
              setAvailable={setAvailable}
            />
          </span>
        </Col>
        {showMint() && (
          <Col
            className="pt-3 d-flex flex-column align-items-center"
            sm={12}
            md={6}>
            <NextGenCountdown collection={props.collection} />
          </Col>
        )}
      </Row>
    </Container>
  );
}

export function NextGenMintCounts(
  props: Readonly<{
    collection: NextGenCollection;
    setAvailable?(available: number): void;
    shouldRefetchMintCounts?: boolean;
    setShouldRefetchMintCounts?(shouldRefetchMintCounts: boolean): void;
  }>
) {
  const [enableRefresh, setEnableRefresh] = useState<boolean>(true);
  const [available, setAvailable] = useState<number>(0);

  const collectionMintCount = useCollectionMintCount(
    props.collection.id,
    enableRefresh
  );
  const [mintCount, setMintCount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (props.shouldRefetchMintCounts) {
      collectionMintCount.refetch().then(() => {
        if (props.setShouldRefetchMintCounts) {
          props.setShouldRefetchMintCounts(false);
        }
      });
    }
  }, [props.shouldRefetchMintCounts]);

  useEffect(() => {
    setIsLoading(collectionMintCount.isFetching);
  }, [collectionMintCount.isFetching]);

  useEffect(() => {
    const mintC = parseInt(collectionMintCount.data as any);
    setMintCount(mintC);
    const avail = props.collection.total_supply - mintC;
    setAvailable(avail);
    setEnableRefresh(avail > 0);
    if (props.setAvailable) {
      props.setAvailable(avail);
    }
  }, [collectionMintCount.data]);

  return (
    <span>
      {mintCount > 0 ? numberWithCommas(mintCount) : mintCount} /{" "}
      {numberWithCommas(props.collection.total_supply)} minted
      {available > 0 && ` | ${numberWithCommas(available)} remaining`}
      {isLoading && (
        <>
          &nbsp;
          <DotLoader />
        </>
      )}
    </span>
  );
}

export function NextGenCollectionHead(
  props: Readonly<{ collection: NextGenCollection; name: string }>
) {
  return (
    <Head>
      <title>{props.name}</title>
      <link rel="icon" href="/favicon.ico" />
      <meta name="description" content={props.name} />
      <meta
        property="og:url"
        content={`${
          process.env.BASE_ENDPOINT
        }/nextgen/collection/${formatNameForUrl(props.collection.name)}`}
      />
      <meta property="og:title" content={props.name} />
      <meta property="og:image" content={props.collection.image} />
      <meta property="og:description" content="NEXTGEN | 6529 SEIZE" />
      <meta name="twitter:card" content={props.name} />
      <meta name="twitter:image:alt" content={props.name} />
      <meta name="twitter:title" content={props.name} />
      <meta name="twitter:description" content="NEXTGEN | 6529 SEIZE" />
      <meta name="twitter:image" content={props.collection.image} />
    </Head>
  );
}

export async function getServerSideCollection(req: any) {
  const collectionId = req.query.collection;
  const headers = getCommonHeaders(req);
  const collection = await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/collections/${collectionId}`,
    headers: headers,
  });

  if (isEmptyObject(collection)) {
    return {
      notFound: true,
      props: {},
    };
  }

  return {
    props: {
      collection: collection,
    },
  };
}
