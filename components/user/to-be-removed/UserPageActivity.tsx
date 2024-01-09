import styles from "../UserPage.module.scss";
import { Col, Dropdown, Row, Table } from "react-bootstrap";
import Pagination from "../../pagination/Pagination";
import LatestActivityRow from "../../latest-activity/LatestActivityRow";
import { useEffect, useState } from "react";
import { Transaction } from "../../../entities/ITransaction";
import { MEMES_CONTRACT } from "../../../constants";
import { DBResponse } from "../../../entities/IDBResponse";
import { fetchUrl } from "../../../services/6529api";
import { areEqualAddresses } from "../../../helpers/Helpers";
import { NFTLite } from "../../../entities/INFT";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserPageDetailsNothingHere from "../UserPageDetailsNothingHere";
import DotLoader from "../../dotLoader/DotLoader";

interface Props {
  readonly show: boolean;
  readonly activeAddress: string | null;
  readonly memesLite: NFTLite[];
  readonly profile: IProfileAndConsolidations;
}

const ACTIVITY_PAGE_SIZE = 25;

export enum UserActivityTypeFilter {
  ALL = "All",
  AIRDROPS = "Airdrops",
  MINTS = "Mints",
  SALES = "Sales",
  PURCHASES = "Purchases",
  TRANSFERS = "Transfers",
  BURNS = "Burns",
}

export default function UserPageActivity(props: Readonly<Props>) {
  const [activity, setActivity] = useState<Transaction[]>([]);
  const [activityTypeFilter, setActivityTypeFilter] =
    useState<UserActivityTypeFilter>(UserActivityTypeFilter.ALL);

  const [activityPage, setActivityPage] = useState(1);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [activityTotalResults, setActivityTotalResults] = useState(0);

  const changeActivityPage = ({
    page,
    filter,
  }: {
    page: number;
    filter: UserActivityTypeFilter | null;
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
  }, [props.activeAddress]);

  useEffect(() => {
    if (
      activityPage === 1 &&
      activityTypeFilter === UserActivityTypeFilter.ALL
    ) {
      return;
    }
    changeActivityPage({ page: 1, filter: UserActivityTypeFilter.ALL });
  }, [props.show]);

  useEffect(() => {
    if (!props.show) {
      return;
    }

    if (activityLoaded) {
      return;
    }

    let url = `${process.env.API_ENDPOINT}/api/transactions?contract=${MEMES_CONTRACT}&wallet=${props.activeAddress}&page_size=${ACTIVITY_PAGE_SIZE}&page=${activityPage}`;
    if (!props.activeAddress) {
      const wallets = props.profile.consolidation.wallets.map(
        (w) => w.wallet.address
      );

      url = `${
        process.env.API_ENDPOINT
      }/api/transactions?contract=${MEMES_CONTRACT}&wallet=${wallets.join(
        ","
      )}&page_size=${ACTIVITY_PAGE_SIZE}&page=${activityPage}`;
    }
    switch (activityTypeFilter) {
      case UserActivityTypeFilter.SALES:
        url += `&filter=sales`;
        break;
      case UserActivityTypeFilter.PURCHASES:
        url += `&filter=purchases`;
        break;
      case UserActivityTypeFilter.TRANSFERS:
        url += `&filter=transfers`;
        break;
      case UserActivityTypeFilter.AIRDROPS:
        url += `&filter=airdrops`;
        break;
      case UserActivityTypeFilter.MINTS:
        url += `&filter=mints`;
        break;
      case UserActivityTypeFilter.BURNS:
        url += `&filter=burns`;
        break;
    }
    fetchUrl(url).then((response: DBResponse) => {
      setActivityTotalResults(response.count);
      setActivity(response.data);
      setActivityLoaded(true);
    });
  }, [
    activityPage,
    props.profile,
    activityTypeFilter,
    props.activeAddress,
    activityLoaded,
    props.show,
  ]);

  function findNftOrNull(tr: Transaction) {
    const nft = [...props.memesLite].find(
      (n) => areEqualAddresses(tr.contract, n.contract) && tr.token_id === n.id
    );

    return nft;
  }

  if (!props.show) {
    return <></>;
  }

  if (!activityLoaded) {
    return (
      <Row>
        <DotLoader />
      </Row>
    );
  }

  return (
    <>
      <Row className="pt-4">
        <Col
          className="d-flex align-items-center"
          xs={{ span: 7 }}
          sm={{ span: 7 }}
          md={{ span: 9 }}
          lg={{ span: 10 }}>
          <h3>Wallet Activity</h3>
        </Col>
        <Col
          xs={{ span: 5 }}
          sm={{ span: 5 }}
          md={{ span: 3 }}
          lg={{ span: 2 }}>
          <Dropdown
            className={styles.activityFilterDropdown}
            drop={"down-centered"}>
            <Dropdown.Toggle>Filter: {activityTypeFilter}</Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(UserActivityTypeFilter).map((filter) => (
                <Dropdown.Item
                  key={`nft-activity-${filter}`}
                  onClick={() =>
                    changeActivityPage({
                      page: 1,
                      filter,
                    })
                  }>
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
            <UserPageDetailsNothingHere />
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
}
