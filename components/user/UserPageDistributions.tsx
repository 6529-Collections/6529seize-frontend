import styles from "./UserPage.module.scss";
import Image from "next/image";
import { Col, Row, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import {
  areEqualAddresses,
  formatAddress,
  numberWithCommas,
} from "../../helpers/Helpers";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "../../constants";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import { fetchUrl } from "../../services/6529api";
import Pagination from "../pagination/Pagination";
import { IDistribution } from "../../entities/IDistribution";
import { VIEW } from "../consolidation-switch/ConsolidationSwitch";

interface Props {
  show: boolean;
  ownerAddress: `0x${string}` | undefined;
  view: VIEW;
  consolidatedTDH?: ConsolidatedTDHMetrics;
  isConsolidation: boolean;
}

const DISTRIBUTIONS_PAGE_SIZE = 25;

export default function UserPageDistributions(props: Props) {
  const [distributions, setDistributions] = useState<IDistribution[]>([]);
  const [distributionsPage, setDistributionsPage] = useState(1);
  const [distributionsTotalResults, setDistributionsTotalResults] = useState(0);

  function printDistributionDate(dateString: any) {
    const d = new Date(
      dateString.substring(0, 4),
      dateString.substring(5, 7) - 1,
      dateString.substring(8, 10)
    );
    return d.toDateString();
  }

  useEffect(() => {
    setDistributionsPage(1);
  }, [props.view]);

  useEffect(() => {
    let url = `${process.env.API_ENDPOINT}/api/distributions?wallet=${props.ownerAddress}&page_size=${DISTRIBUTIONS_PAGE_SIZE}&page=${distributionsPage}`;
    if (props.view === VIEW.CONSOLIDATION && props.consolidatedTDH) {
      url = url = `${
        process.env.API_ENDPOINT
      }/api/distributions?wallet=${props.consolidatedTDH.wallets.join(
        ","
      )}&page_size=${DISTRIBUTIONS_PAGE_SIZE}&page=${distributionsPage}`;
    }
    if (props.ownerAddress) {
      fetchUrl(url).then((response: DBResponse) => {
        setDistributionsTotalResults(response.count);
        setDistributions(response.data);
      });
    }
  }, [distributionsPage, props.ownerAddress, props.view]);

  if (props.show) {
    return (
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
        <Row className={`pt-2 ${styles.distributionsScrollContainer}`}>
          <Col>
            {distributions.length > 0 ? (
              <Table className={styles.distributionsTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Card</th>
                    {props.isConsolidation &&
                      props.view === VIEW.CONSOLIDATION && <th>Wallet</th>}
                    <th className="text-center">Phase</th>
                    <th className="text-center">Count</th>
                    <th className="text-center">Minted</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((d) => (
                    <tr
                      key={`${d.contract}-${d.card_id}-${d.phase}-${d.wallet}}`}>
                      <td>{printDistributionDate(d.card_mint_date)}</td>
                      <td className={styles.distributionsTableWallet}>
                        {d.card_name ? (
                          <a
                            className={styles.distributionsTableCardLink}
                            href={
                              areEqualAddresses(d.contract, MEMES_CONTRACT)
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
                          areEqualAddresses(d.contract, MEMES_CONTRACT)
                            ? `The Memes`
                            : areEqualAddresses(d.contract, GRADIENT_CONTRACT)
                            ? `6529Gradient`
                            : areEqualAddresses(d.contract, MEMELAB_CONTRACT)
                            ? `Meme Lab`
                            : d.contract
                        }${d.card_name ? ` - ${d.card_name}` : ""}`}
                      </td>
                      {props.isConsolidation &&
                        props.view === VIEW.CONSOLIDATION && (
                          <td>
                            {d.display ? d.display : formatAddress(d.wallet)}
                          </td>
                        )}
                      <td className="text-center">{d.phase}</td>
                      <td className="text-center">{d.count}</td>
                      <td className="text-center">
                        {!d.card_mint_count
                          ? "-"
                          : d.card_mint_count === 0
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
    );
  } else {
    return <></>;
  }
}
