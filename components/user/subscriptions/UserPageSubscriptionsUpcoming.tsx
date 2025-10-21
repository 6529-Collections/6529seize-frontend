"use client";

import { AuthContext } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import {
  formatFullDate,
  getUpcomingMintsForCurrentOrNextSeason,
  isMintingToday,
  SeasonMintRow,
  SeasonMintScanResult,
} from "@/components/meme-calendar/meme-calendar.helpers";
import ShowMoreButton from "@/components/show-more-button/ShowMoreButton";
import {
  NFTFinalSubscription,
  NFTSubscription,
  SubscriptionDetails,
} from "@/entities/ISubscription";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useState } from "react";
import { Col, Container, Row, Table } from "react-bootstrap";
import Toggle from "react-toggle";
import { Tooltip } from "react-tooltip";
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
  const { rows } = useMemo<SeasonMintScanResult>(
    () => getUpcomingMintsForCurrentOrNextSeason(now),
    [now]
  );

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h5 className="mb-0">Upcoming Drops</h5>
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <Table className={styles.nftSubscriptionsTable}>
            <tbody>
              {subscriptions.map((subscription, index) => (
                <tr key={subscription.token_id}>
                  <td>
                    <SubscriptionRow
                      profileKey={props.profileKey}
                      title="The Memes"
                      subscription={subscription}
                      readonly={props.readonly}
                      refresh={props.refresh}
                      minting_today={index === 0 && isMintingToday()}
                      first={index === 0}
                      date={rows[index]}
                    />
                  </td>
                </tr>
              ))}
              {props.memes_subscriptions.length > 3 && (
                <tr>
                  <td>
                    <div className="d-flex align-items-center justify-content-center gap-1">
                      <ShowMoreButton
                        expanded={expanded}
                        setExpanded={setExpanded}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}

function SubscriptionRow(
  props: Readonly<{
    profileKey: string;
    title: string;
    subscription: NFTSubscription;
    readonly: boolean;
    minting_today?: boolean;
    first: boolean;
    date: SeasonMintRow;
    refresh: () => void;
  }>
) {
  const id = `subscription-${props.subscription.token_id}`;

  const { requestAuth, setToast } = useContext(AuthContext);

  const [subscribed, setSubscribed] = useState<boolean>(
    !!props.subscription.subscribed
  );

  const { data: final } = useQuery<NFTFinalSubscription>({
    queryKey: [
      "consolidation-final-subscription",
      `${props.profileKey}-${props.subscription.contract}-${props.subscription.token_id}`,
    ],
    queryFn: async () =>
      await commonApiFetch<NFTFinalSubscription>({
        endpoint: `subscriptions/consolidation/final/${props.profileKey}/${props.subscription.contract}/${props.subscription.token_id}`,
      }),
    enabled: props.first,
  });

  useEffect(() => {
    setSubscribed(!!props.subscription.subscribed);
  }, [props.subscription.subscribed]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (): Promise<void> => {
    if (isSubmitting || props.minting_today) {
      return;
    }
    setIsSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setIsSubmitting(false);
      return;
    }
    const subscribe = !subscribed;
    interface SubscribeBody {
      contract: string;
      token_id: number;
      subscribed: boolean;
    }
    try {
      const response = await commonApiPost<SubscribeBody, SubscribeBody>({
        endpoint: `subscriptions/${props.profileKey}/subscription`,
        body: {
          contract: props.subscription.contract,
          token_id: props.subscription.token_id,
          subscribed: subscribe,
        },
      });
      const responseSubscribed = response.subscribed;
      setSubscribed(!!responseSubscribed);
      const detail = responseSubscribed
        ? `Subscribed for`
        : `Unsubscribed from`;
      setToast({
        message: `${detail} ${props.title} #${response.token_id}`,
        type: "success",
      });
      props.refresh();
    } catch (e: any) {
      setIsSubmitting(false);
      setToast({
        message: e ?? "Failed to change token subscription.",
        type: "error",
      });
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="no-padding pt-2 pb-2">
      <Row>
        <Col className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
          <span className="d-flex align-items-center gap-2">
            {props.title} #{props.subscription.token_id}{" "}
            {props.minting_today ? (
              <>
                <span
                  data-tooltip-id={`minting-today-${props.subscription.token_id}`}>
                  - Minting Today{" "}
                  <FontAwesomeIcon icon={faInfoCircle} height={"20px"} />
                </span>
                <Tooltip
                  id={`minting-today-${props.subscription.token_id}`}
                  place="right"
                  style={{
                    backgroundColor: "#f8f9fa",
                    color: "#212529",
                    padding: "4px 8px",
                  }}>
                  No changes allowed on minting day
                </Tooltip>
              </>
            ) : (
              <span className="font-color-silver">
                {formatFullDate(props.date.utcDay)}
              </span>
            )}
          </span>
          <span className="d-flex align-items-center gap-2">
            {isSubmitting && <Spinner />}
            <Toggle
              disabled={props.readonly || isSubmitting || props.minting_today}
              id={id}
              checked={subscribed}
              icons={false}
              onChange={submit}
              aria-label={`Toggle subscription for ${props.title} #${props.subscription.token_id}`}
            />
          </span>
        </Col>
      </Row>
      {props.first && final?.phase && final?.phase_position > 0 && (
        <Row className="pt-2">
          <Col className="font-smaller font-color-silver">
            Phase: {final.phase} - Subscription Position:{" "}
            {final.phase_position.toLocaleString()} /{" "}
            {final.phase_subscriptions.toLocaleString()} - Airdrop Address:{" "}
            {final.airdrop_address}
          </Col>
        </Row>
      )}
    </Container>
  );
}
