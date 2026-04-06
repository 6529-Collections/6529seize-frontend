"use client";
import type {
  SeasonMintRow} from "@/components/meme-calendar/meme-calendar.helpers";
import {
  getUpcomingMintsAcrossSeasons,
  isMintingToday
} from "@/components/meme-calendar/meme-calendar.helpers";
import ShowMoreButton from "@/components/show-more-button/ShowMoreButton";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { useEffect, useMemo, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import MemeSubscriptionRow from "./MemeSubscriptionRow";
import styles from "./UserPageSubscriptions.module.scss";

export default function UserPageSubscriptionsUpcoming(
  props: Readonly<{
    profileKey: string;
    details: SubscriptionDetails | undefined;
    memes_subscriptions: NFTSubscription[];
    readonly: boolean;
    refresh: () => void;
  }>
) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const [subscriptions, setSubscriptions] = useState<NFTSubscription[]>([]);

  useEffect(() => {
    const subs = props.memes_subscriptions;
    if (expanded) {
      setSubscriptions(subs);
    } else {
      setSubscriptions(subs.slice(0, 3));
    }
  }, [props.memes_subscriptions, expanded]);

  const [now] = useState(() => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  });
  const rows = useMemo<SeasonMintRow[]>(
    () => getUpcomingMintsAcrossSeasons(props.memes_subscriptions.length, now),
    [now, props.memes_subscriptions.length]
  );

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h5 className="mb-0 tw-font-semibold">Upcoming Drops</h5>
        </Col>
      </Row>
      <hr className="tw-border-white tw-opacity-100 tw-border-2 tw-mt-1 tw-mb-0" />
      <Row>
        <Col>
          <div>
            {subscriptions.map((subscription, index) => (
              <div
                key={subscription.token_id}
                className={`${styles["nftSubscriptionsListItem"]} ${
                  index % 2 === 0 ? styles["odd"] : styles["even"]
                } ${index === subscriptions.length - 1 ? styles["last"] : ""}`}>
                <MemeSubscriptionRow
                  profileKey={props.profileKey}
                  title="The Memes"
                  subscription={subscription}
                  eligibilityCount={
                    props.details?.subscription_eligibility_count ?? 1
                  }
                  readonly={props.readonly}
                  refresh={props.refresh}
                  minting_today={index === 0 && isMintingToday()}
                  first={index === 0}
                  date={rows[index] ?? null}
                />
              </div>
            ))}
          </div>
          {props.memes_subscriptions.length > 3 && (
            <div className="mt-2 text-center">
              <ShowMoreButton expanded={expanded} setExpanded={setExpanded} />
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}
