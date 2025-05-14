import styles from "../../styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import {
  RedeemedSubscriptionCounts,
  SubscriptionCounts,
} from "../../entities/ISubscription";
import {
  getMintingDates,
  numberOfCardsForSeasonEnd,
} from "../../helpers/meme_calendar.helpers";
import { commonApiFetch } from "../../services/api/common-api";
import { getCommonHeaders } from "../../helpers/server.helpers";
import { Time } from "../../helpers/time";
import Image from "next/image";
import Link from "next/link";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

interface SubscriptionsProps {
  readonly szn: number;
  readonly upcoming: SubscriptionCounts[];
  readonly redeemed: RedeemedSubscriptionCounts[];
}

export default function SubscriptionsReport({
  pageProps,
}: {
  readonly pageProps: SubscriptionsProps;
}) {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Subscriptions Report | Tools",
    });
  }, []);

  return (
    <main className={styles.main}>
      <SubscriptionsReportComponent
        szn={pageProps.szn}
        upcomingCounts={pageProps.upcoming}
        redeemedCounts={pageProps.redeemed}
      />
    </main>
  );
}

function SubscriptionsReportComponent({
  szn,
  upcomingCounts,
  redeemedCounts,
}: {
  readonly szn: number;
  readonly upcomingCounts: SubscriptionCounts[];
  readonly redeemedCounts: RedeemedSubscriptionCounts[];
}) {
  const addDays = redeemedCounts.some((count) => {
    const mintDate = Time.fromString(count.mint_date);
    return mintDate.toIsoDateString() === Time.now().toIsoDateString();
  })
    ? 1
    : 0;
  const dates = getMintingDates(upcomingCounts.length, addDays);

  return (
    <Container className="pt-4">
      <Row>
        <Col className="d-flex align-items-center justify-content-between">
          <h1>
            <span className="font-lightest">Subscriptions</span> Report
          </h1>
          <Link
            href="/about/subscriptions"
            className="decoration-hover-underline">
            Learn More
          </Link>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <p className="font-larger font-bolder decoration-none">
            Upcoming Drops for SZN{szn}
          </p>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          {upcomingCounts?.length > 0 ? (
            <table
              className="table table-bordered"
              style={{
                borderColor: "white",
              }}>
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1px solid white",
                      width: "50%",
                      padding: "15px",
                    }}>
                    Meme Card
                  </th>
                  <th
                    style={{
                      border: "1px solid white",
                      width: "50%",
                      padding: "15px",
                      textAlign: "center",
                    }}>
                    Subscriptions
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcomingCounts.map((count, index) => (
                  <SubscriptionDayDetails
                    date={dates[index]}
                    count={count}
                    key={count.token_id}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <>No Subscriptions Found</>
          )}
        </Col>
      </Row>
      <Row className="pt-5">
        <Col>
          <p className="font-larger font-bolder decoration-none">Past Drops</p>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          {redeemedCounts?.length > 0 ? (
            <table
              className="table table-bordered"
              style={{
                borderColor: "white",
              }}>
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1px solid white",
                      width: "50%",
                      padding: "15px",
                    }}>
                    Meme Card
                  </th>
                  <th
                    style={{
                      border: "1px solid white",
                      width: "50%",
                      padding: "15px",
                      textAlign: "center",
                    }}>
                    Subscriptions
                  </th>
                </tr>
              </thead>
              <tbody>
                {redeemedCounts.map((count, index) => (
                  <RedeemedSubscriptionDetails
                    count={count}
                    key={count.token_id}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <>No Subscriptions Found</>
          )}
        </Col>
      </Row>
    </Container>
  );
}

function SubscriptionDayDetails(
  props: Readonly<{
    count: SubscriptionCounts;
    date: Time;
  }>
) {
  return (
    <tr>
      <td
        style={{
          border: "1px solid white",
          width: "50%",
          padding: "15px",
          verticalAlign: "middle",
        }}>
        <span className="d-flex flex-column">
          <span>The Memes #{props.count.token_id}</span>
          <span className="font-color-silver font-smaller">
            {props.date.toIsoDateString()} / {props.date.toDayName()}
          </span>
        </span>
      </td>
      <td
        style={{
          border: "1px solid white",
          width: "50%",
          padding: "15px",
          textAlign: "center",
          verticalAlign: "middle",
        }}>
        {props.count.count > 0 ? props.count.count.toLocaleString() : "0"}
      </td>
    </tr>
  );
}

function RedeemedSubscriptionDetails(
  props: Readonly<{
    count: RedeemedSubscriptionCounts;
  }>
) {
  const dateTime = Time.fromString(props.count.mint_date);
  return (
    <tr>
      <td
        style={{
          border: "1px solid white",
          width: "50%",
          padding: "15px",
          verticalAlign: "middle",
        }}>
        <span className="d-flex gap-2 align-items-center flex-wrap">
          <Image
            src={props.count.image_url}
            alt={props.count.name}
            width={0}
            height={0}
            style={{
              height: "45px",
              width: "auto",
              marginRight: "8px",
            }}
          />
          <span className="d-flex flex-column">
            <Link
              href={`/the-memes/${props.count.token_id}`}
              className="decoration-hover-underline">
              #{props.count.token_id} - {props.count.name}
            </Link>
            <span className="font-color-silver font-smaller">
              {dateTime.toIsoDateString()} / {dateTime.toDayName()}
            </span>
          </span>
        </span>
      </td>
      <td
        style={{
          border: "1px solid white",
          width: "50%",
          padding: "15px",
          textAlign: "center",
          verticalAlign: "middle",
        }}>
        {props.count.count > 0 ? props.count.count.toLocaleString() : "0"}
      </td>
    </tr>
  );
}

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: SubscriptionsProps;
}> {
  const remainingMintsForSeason = numberOfCardsForSeasonEnd();

  const headers = getCommonHeaders(req);
  const upcoming = await commonApiFetch<SubscriptionCounts[]>({
    endpoint: `subscriptions/upcoming-memes-counts?card_count=${remainingMintsForSeason.count}`,
    headers: headers,
  });
  const redeemed = await commonApiFetch<RedeemedSubscriptionCounts[]>({
    endpoint: `subscriptions/redeemed-memes-counts`,
    headers: headers,
  });

  return {
    props: {
      szn: remainingMintsForSeason.szn,
      upcoming: upcoming ?? [],
      redeemed: redeemed ?? [],
    },
  };
}

SubscriptionsReport.metadata = {
  title: "Subscriptions Report",
  description: "Tools",
};
