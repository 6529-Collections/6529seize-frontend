"use client";

import { AuthContext } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import {
  displayedSeasonNumberFromIndex,
  formatFullDate,
  getUpcomingMintsAcrossSeasons,
  isMintingToday,
  SeasonMintRow,
} from "@/components/meme-calendar/meme-calendar.helpers";
import ShowMoreButton from "@/components/show-more-button/ShowMoreButton";
import { NFTFinalSubscription } from "@/generated/models/NFTFinalSubscription";
import { NFTSubscription } from "@/generated/models/NFTSubscription";
import { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { formatAddress } from "@/helpers/Helpers";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
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
                className={`${styles.nftSubscriptionsListItem} ${
                  index % 2 === 0 ? styles.odd : styles.even
                } ${index === subscriptions.length - 1 ? styles.last : ""}`}>
                <SubscriptionRow
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

function SubscriptionRow(
  props: Readonly<{
    profileKey: string;
    title: string;
    subscription: NFTSubscription;
    eligibilityCount: number;
    readonly: boolean;
    minting_today?: boolean;
    first: boolean;
    date: SeasonMintRow | null;
    refresh: () => void;
  }>
) {
  const id = `subscription-${props.subscription.token_id}`;

  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useContext(AuthContext);

  const [subscribed, setSubscribed] = useState<boolean>(
    !!props.subscription.subscribed
  );

  const subscribedCount = useMemo<number>(
    () => props.subscription.subscribed_count ?? 1,
    [props.subscription.subscribed_count]
  );

  const [selectedCount, setSelectedCount] = useState<number>(subscribedCount);

  useEffect(() => {
    setSelectedCount(subscribedCount);
  }, [subscribedCount]);

  useEffect(() => {
    if (selectedCount > props.eligibilityCount) {
      setSelectedCount(Math.max(1, props.eligibilityCount));
    }
  }, [props.eligibilityCount, selectedCount]);

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
      queryClient.invalidateQueries({
        queryKey: [
          "consolidation-final-subscription",
          `${props.profileKey}-${props.subscription.contract}-${props.subscription.token_id}`,
        ],
      });
    } catch (e: unknown) {
      setToast({
        message:
          typeof e === "string" ? e : "Failed to change token subscription.",
        type: "error",
      });
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubscriptionCount = async (
    value: number
  ): Promise<void> => {
    if (isSubmitting || props.minting_today) {
      return;
    }
    setIsSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setIsSubmitting(false);
      return;
    }
    interface UpdateSubscriptionCountBody {
      contract: string;
      token_id: number;
      count: number;
    }
    try {
      const response = await commonApiPost<
        UpdateSubscriptionCountBody,
        UpdateSubscriptionCountBody
      >({
        endpoint: `subscriptions/${props.profileKey}/subscription-count`,
        body: {
          contract: props.subscription.contract,
          token_id: props.subscription.token_id,
          count: value,
        },
      });
      const responseCount = response.count;
      setSelectedCount(responseCount);
      setToast({
        message: `Subscription count updated to ${responseCount} for ${props.title} #${props.subscription.token_id}`,
        type: "success",
      });
      props.refresh();
      queryClient.invalidateQueries({
        queryKey: [
          "consolidation-final-subscription",
          `${props.profileKey}-${props.subscription.contract}-${props.subscription.token_id}`,
        ],
      });
    } catch (e: unknown) {
      setSelectedCount(subscribedCount);
      setToast({
        message:
          typeof e === "string" ? e : "Failed to update subscription count.",
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
        <Col className="d-flex gap-2 align-items-center justify-content-between">
          <div className="d-flex flex-column gap-2 tw-flex-1 tw-min-w-0">
            <span className="d-flex align-items-center gap-2">
              <span className="tw-font-medium">
                {props.title} #{props.subscription.token_id}{" "}
              </span>
              {props.date && (
                <>
                  <span>
                    - SZN
                    {displayedSeasonNumberFromIndex(props.date.seasonIndex)}
                  </span>
                  {" / "}
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
                    <span>{formatFullDate(props.date.utcDay)}</span>
                  )}
                </>
              )}
            </span>
            {props.first &&
              final?.phase &&
              final.phase_position !== undefined &&
              final.phase_position > 0 && (
                <span className="font-smaller font-color-silver">
                  Phase: {final.phase} - Subscription Position:{" "}
                  {final.phase_position.toLocaleString()} /{" "}
                  {(final.phase_subscriptions ?? 0).toLocaleString()} - Airdrop
                  Address: {formatAddress(final.airdrop_address)} - Subscription
                  Count: x{final.subscribed_count}
                </span>
              )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {isSubmitting && <Spinner />}
            <Toggle
              disabled={props.readonly || isSubmitting || props.minting_today}
              id={id}
              checked={subscribed}
              icons={false}
              onChange={submit}
              aria-label={`Toggle subscription for ${props.title} #${props.subscription.token_id}`}
            />
            <span className="tw-flex tw-items-center tw-gap-1 tw-min-w-16">
              {subscribed ? (
                <>
                  <select
                    className="tw-text-iron-400 tw-bg-transparent tw-border tw-border-iron-400 tw-rounded tw-px-1"
                    value={selectedCount}
                    disabled={
                      props.eligibilityCount <= 1 ||
                      props.readonly ||
                      isSubmitting ||
                      props.minting_today
                    }
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10);
                      setSelectedCount(value);
                      handleUpdateSubscriptionCount(value);
                    }}
                    style={{ minWidth: "3ch" }}
                    aria-label={`Select subscription quantity for ${props.title}`}>
                    {Array.from(
                      { length: props.eligibilityCount },
                      (_, i) => i + 1
                    ).map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                  <span className="tw-text-iron-400">
                    / {props.eligibilityCount}
                  </span>
                </>
              ) : null}
            </span>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
