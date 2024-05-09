import { Col, Container, Row } from "react-bootstrap";
import {
  numberOfCardsForSeasonEnd,
  getMintingDates,
} from "../../helpers/meme_calendar.helplers";
import {
  RedeemedSubscriptionCounts,
  SubscriptionCounts,
} from "../../entities/ISubscription";
import { commonApiFetch } from "../../services/api/common-api";
import { useEffect, useState } from "react";
import { Time } from "../../helpers/time";
import DotLoader from "../dotLoader/DotLoader";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

export default function AboutSubscriptionsUpcoming() {
  const remainingMintsForSeason = numberOfCardsForSeasonEnd();
  const dates = getMintingDates(remainingMintsForSeason.count);
  const [upcomingCounts, setUpcomingCounts] = useState<SubscriptionCounts[]>(
    []
  );

  useEffect(() => {
    commonApiFetch<SubscriptionCounts[]>({
      endpoint: `subscriptions/upcoming-memes-counts?card_count=${remainingMintsForSeason.count}`,
    }).then((data) => {
      setUpcomingCounts(data);
    });
  }, [remainingMintsForSeason.count]);

  const { data: redeemedCounts } = useQuery<RedeemedSubscriptionCounts[]>({
    queryKey: ["redeeemed-memes-counts"],
    queryFn: async () =>
      await commonApiFetch<RedeemedSubscriptionCounts[]>({
        endpoint: `subscriptions/redeemed-memes-counts`,
      }),
  });

  return (
    <Container>
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Upcoming</span> Drops
          </h1>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <p className="font-larger font-bolder decoration-none">
            Upcoming Drops for SZN{remainingMintsForSeason.szn}
          </p>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          {upcomingCounts.length > 0 ? (
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
            <DotLoader />
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
          {redeemedCounts ? (
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
            <DotLoader />
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
        The Memes #{props.count.token_id}{" "}
        <span className="font-color-silver">
          {props.date.toIsoDateString()} / {props.date.toDayName()}
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
