import { Col, Container, Row } from "react-bootstrap";
import {
  numberOfCardsForSeasonEnd,
  getMintingDates,
} from "../../helpers/meme_calendar.helplers";
import { SubscriptionCounts } from "../../entities/ISubscription";
import { commonApiFetch } from "../../services/api/common-api";
import { useEffect, useState } from "react";
import { Time } from "../../helpers/time";
import DotLoader from "../dotLoader/DotLoader";

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
        }}>
        {props.count.count > 0 ? props.count.count.toLocaleString() : "0"}
      </td>
    </tr>
  );
}
