import styles from "./UserPage.module.scss";
import Image from "next/image";
import { Col, Dropdown, Row, Table } from "react-bootstrap";
import Pagination from "../pagination/Pagination";
import { TypeFilter } from "../latest-activity/LatestActivity";
import LatestActivityRow from "../latest-activity/LatestActivityRow";
import { VIEW } from "../consolidation-switch/ConsolidationSwitch";
import { useEffect, useState } from "react";
import { Transaction } from "../../entities/ITransaction";
import { MEMES_CONTRACT } from "../../constants";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import { areEqualAddresses } from "../../helpers/Helpers";
import { NFTLite } from "../../entities/INFT";
import { IProfileAndConsolidations } from "../../entities/IProfile";

interface Props {
  show: boolean;
  ownerAddress: `0x${string}` | undefined;
  view: VIEW;
  memesLite: NFTLite[];
  profile: IProfileAndConsolidations;
}

const ACTIVITY_PAGE_SIZE = 25;

export default function UserPageActivity(props: Props) {
  const [activity, setActivity] = useState<Transaction[]>([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState<TypeFilter>(
    TypeFilter.ALL
  );

  const [activityPage, setActivityPage] = useState(1);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [activityTotalResults, setActivityTotalResults] = useState(0);

  const changeActivityPage = ({
    page,
    filter,
  }: {
    page: number;
    filter: TypeFilter | null;
  }) => {
    setActivityPage(page);
    if (filter) {
      setActivityTypeFilter(filter);
    }
    setActivityLoaded(false);
  };

  useEffect(() => {
    changeActivityPage({
      page: 1,
      filter: null,
    });
  }, [props.view]);

  useEffect(() => {
    if (activityPage === 1 && activityTypeFilter === TypeFilter.ALL) {
      return;
    }
    changeActivityPage({ page: 1, filter: TypeFilter.ALL });
  }, [props.show]);

  useEffect(() => {
    if (!props.show) {
      return;
    }

    if (activityLoaded) {
      return;
    }

    let url = `${process.env.API_ENDPOINT}/api/transactions?contract=${MEMES_CONTRACT}&wallet=${props.ownerAddress}&page_size=${ACTIVITY_PAGE_SIZE}&page=${activityPage}`;
    if (props.view === VIEW.CONSOLIDATION) {
      const wallets = props.profile.consolidation.wallets.map(
        (w) => w.wallet.address
      );

      url = `${
        process.env.API_ENDPOINT
      }/api/transactions?contract=${MEMES_CONTRACT}&wallet=${wallets.join(
        ","
      )}&page_size=${ACTIVITY_PAGE_SIZE}&page=${activityPage}`;
    }
    if (props.ownerAddress) {
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
        case TypeFilter.MINTS:
          url += `&filter=mints`;
          break;
        case TypeFilter.BURNS:
          url += `&filter=burns`;
          break;
      }
      fetchUrl(url).then((response: DBResponse) => {
        setActivityTotalResults(response.count);
        setActivity(response.data);
        setActivityLoaded(true);
      });
    }
  }, [
    activityPage,
    props.profile,
    activityTypeFilter,
    props.view,
    activityLoaded,
    props.show,
  ]);

  function findNftOrNull(tr: Transaction) {
    const nft = [...props.memesLite].find(
      (n) => areEqualAddresses(tr.contract, n.contract) && tr.token_id === n.id
    );

    return nft;
  }

  if (props.show) {
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
            <h3>Wallet Activity</h3>
          </Col>
          <Col
            xs={{ span: 5 }}
            sm={{ span: 5 }}
            md={{ span: 3 }}
            lg={{ span: 2 }}
          >
            <Dropdown
              className={styles.activityFilterDropdown}
              drop={"down-centered"}
            >
              <Dropdown.Toggle>Filter: {activityTypeFilter}</Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.values(TypeFilter).map((filter) => (
                  <Dropdown.Item
                    key={`nft-activity-${filter}`}
                    onClick={() =>
                      changeActivityPage({
                        page: 1,
                        filter,
                      })
                    }
                  >
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
              <Table bordered={false} className={styles.transactionsTable}>
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
                changeActivityPage({
                  page: newPage,
                  filter: null,
                });

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
