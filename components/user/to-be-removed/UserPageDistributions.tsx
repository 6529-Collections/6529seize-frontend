import styles from "../UserPage.module.scss";
import Image from "next/image";
import { Col, Row, Table } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import { DBResponse } from "../../../entities/IDBResponse";
import {
  areEqualAddresses,
  capitalizeEveryWord,
  formatAddress,
  isDivInViewport,
  numberWithCommas,
  scrollToDiv,
} from "../../../helpers/Helpers";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "../../../constants";
import { fetchUrl } from "../../../services/6529api";
import Pagination from "../../pagination/Pagination";
import {
  DistributionPhase,
  IDistribution,
} from "../../../entities/IDistribution";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import DotLoader from "../../dotLoader/DotLoader";

interface Props {
  show: boolean;
  activeAddress: string | null;
  profile: IProfileAndConsolidations;
}

const DISTRIBUTIONS_PAGE_SIZE = 50;

export default function UserPageDistributions(props: Props) {
  const distributionsDivRef = useRef(null);

  const [distributions, setDistributions] = useState<IDistribution[]>([]);
  const [distributionsPhases, setDistributionsPhases] = useState<
    DistributionPhase[]
  >([]);
  const [distributionsPage, setDistributionsPage] = useState(1);
  const [distributionsTotalResults, setDistributionsTotalResults] = useState(0);
  const [distributionsLoaded, setDistributionsLoaded] = useState(false);

  function printDistributionDate(dateString: any) {
    const d = new Date(
      dateString.substring(0, 4),
      dateString.substring(5, 7) - 1,
      dateString.substring(8, 10)
    );
    return d.toDateString();
  }

  const changeDistributionPage = (page: number) => {
    setDistributionsPage(page);
    setDistributionsLoaded(false);
  };

  useEffect(() => {
    changeDistributionPage(1);
  }, [props.activeAddress]);

  useEffect(() => {
    if (distributionsPage === 1) {
      return;
    }
    changeDistributionPage(1);
  }, [props.show]);

  useEffect(() => {
    if (!props.show) {
      return;
    }

    if (distributionsLoaded) {
      return;
    }
    const walletFilter: string[] = [];
    if (!props.activeAddress) {
      props.profile.consolidation.wallets.forEach((w) =>
        walletFilter.push(w.wallet.address)
      );
    } else {
      walletFilter.push(props.activeAddress);
    }

    let url = `${process.env.API_ENDPOINT
      }/api/distributions?wallet=${walletFilter.join(
        ","
      )}&page_size=${DISTRIBUTIONS_PAGE_SIZE}&page=${distributionsPage}`;
    if (!props.activeAddress) {
      const consolidatedWallets = props.profile.consolidation.wallets.map(
        (w) => w.wallet.address
      );
      url = `${process.env.API_ENDPOINT
        }/api/distributions?wallet=${consolidatedWallets.join(
          ","
        )}&page_size=${DISTRIBUTIONS_PAGE_SIZE}&page=${distributionsPage}`;
    }
    fetchUrl(url).then((response: DBResponse) => {
      setDistributionsTotalResults(response.count);
      const mydistributions: IDistribution[] = response.data;
      setDistributions(mydistributions);
      const phases = [];
      if (mydistributions.some((d) => d.airdrop > 0)) {
        phases.push(DistributionPhase.AIRDROP);
      }
      if (mydistributions.some((d) => d.allowlist > 0)) {
        phases.push(DistributionPhase.ALLOWLIST);
      }
      if (mydistributions.some((d) => d.phase_0 > 0)) {
        phases.push(DistributionPhase.PHASE_0);
      }
      if (mydistributions.some((d) => d.phase_1 > 0)) {
        phases.push(DistributionPhase.PHASE_1);
      }
      if (mydistributions.some((d) => d.phase_2 > 0)) {
        phases.push(DistributionPhase.PHASE_2);
      }
      if (mydistributions.some((d) => d.phase_3 > 0)) {
        phases.push(DistributionPhase.PHASE_3);
      }
      setDistributionsPhases(phases);
      setDistributionsLoaded(true);
    });
  }, [
    distributionsPage,
    props.activeAddress,
    props.profile,
    props.show,
    distributionsLoaded,
  ]);

  if (!props.show) {
    return <></>;
  }

  if (!distributionsLoaded) {
    return (
      <Row>
        <DotLoader />
      </Row>
    );
  }

  return (
    <>
      <Row>
        <Col
          className="d-flex align-items-center"
          xs={{ span: 7 }}
          sm={{ span: 7 }}
          md={{ span: 9 }}
          lg={{ span: 10 }}
        >
          <h3 ref={distributionsDivRef}>Distributions</h3>
        </Col>
      </Row>
      <Row className={`pt-2 ${styles.distributionsScrollContainer}`}>
        <Col>
          {distributions.length > 0 ? (
            <Table className={styles.distributionsTable}>
              <thead>
                <tr>
                  <th
                    colSpan={
                      !!props.profile.consolidation.wallets.length &&
                        !props.activeAddress
                        ? 3
                        : 2
                    }
                  ></th>
                  <th
                    colSpan={distributionsPhases.length}
                    className="text-center"
                  >
                    ALLOWLIST SPOTS
                  </th>
                  <th colSpan={2} className="text-center">
                    ACTUAL
                  </th>
                </tr>
                <tr>
                  <th>Date</th>
                  <th>Card</th>
                  {!!props.profile.consolidation.wallets.length &&
                    !props.activeAddress && <th>Wallet</th>}
                  {distributionsPhases.map((p) => (
                    <th key={`${p}-header`} className="text-center">
                      {capitalizeEveryWord(p.replaceAll("_", " "))}
                    </th>
                  ))}
                  <th className="text-center">Minted</th>
                  <th className="text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((d) => (
                  <tr key={`${d.contract}-${d.card_id}-${d.wallet}`}>
                    <td>{printDistributionDate(d.card_mint_date)}</td>
                    <td className={styles.distributionsTableWallet}>
                      {d.card_name ? (
                        <a
                          className={styles.distributionsTableCardLink}
                          href={
                            areEqualAddresses(d.contract, MEMES_CONTRACT)
                              ? `/the-memes/${d.card_id}`
                              : areEqualAddresses(d.contract, GRADIENT_CONTRACT)
                                ? `/6529-gradient/${d.card_id}`
                                : areEqualAddresses(d.contract, MEMELAB_CONTRACT)
                                  ? `/meme-lab/${d.card_id}`
                                  : d.contract
                          }
                        >
                          Card #{d.card_id}
                        </a>
                      ) : (
                        `Card #${d.card_id}`
                      )}
                      {` - ${areEqualAddresses(d.contract, MEMES_CONTRACT)
                          ? `The Memes`
                          : areEqualAddresses(d.contract, GRADIENT_CONTRACT)
                            ? `6529Gradient`
                            : areEqualAddresses(d.contract, MEMELAB_CONTRACT)
                              ? `Meme Lab`
                              : d.contract
                        }${d.card_name ? ` - ${d.card_name}` : ""}`}
                    </td>
                    {!!props.profile.consolidation.wallets.length &&
                      !props.activeAddress && (
                        <td>
                          {d.display ? d.display : formatAddress(d.wallet)}
                        </td>
                      )}
                    {distributionsPhases.map((p) => (
                      <th
                        key={`${p}-${d.contract}-${d.card_id}`}
                        className="text-center"
                      >
                        {d[p] === 0 ? "-" : numberWithCommas(d[p])}
                      </th>
                    ))}
                    <td className="text-center">
                      {d.total_minted === 0
                        ? "-"
                        : numberWithCommas(d.total_minted)}
                    </td>
                    <td className="text-center">
                      {!d.total_minted && !d.airdrop
                        ? "-"
                        : numberWithCommas(d.total_minted + d.airdrop)}
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
              changeDistributionPage(newPage);
              if (!isDivInViewport(distributionsDivRef)) {
                scrollToDiv(distributionsDivRef, "start");
              }
            }}
          />
        </Row>
      )}
    </>
  );
}
