import styles from "./UserPageSubscriptions.module.scss";
import { useContext, useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { AuthContext } from "../../auth/Auth";
import {
  NFTFinalSubscription,
  NFTSubscription,
  SubscriptionDetails,
} from "../../../entities/ISubscription";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../services/api/common-api";
import { Spinner } from "../../dotLoader/DotLoader";
import Toggle from "react-toggle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import {
  getMintingDates,
  isMintingToday,
} from "../../../helpers/meme_calendar.helpers";
import { useQuery } from "@tanstack/react-query";
import { Time } from "../../../helpers/time";
import {
  faChevronCircleDown,
  faChevronCircleUp,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

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

  const dates = getMintingDates(subscriptions.length);

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
                      date={dates[index]}
                    />
                  </td>
                </tr>
              ))}
              {props.memes_subscriptions.length > 0 && (
                <tr>
                  <td>
                    <div className="d-flex align-items-center justify-content-center gap-1">
                      <SubscriptionExpandButton
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

function SubscriptionExpandButton(
  props: Readonly<{
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
  }>
) {
  return (
    <button
      className="btn-link decoration-none"
      onClick={() => props.setExpanded(!props.expanded)}>
      {props.expanded ? (
        <>
          Show Less <FontAwesomeIcon icon={faChevronCircleUp} height={"20px"} />
        </>
      ) : (
        <>
          Show More{" "}
          <FontAwesomeIcon icon={faChevronCircleDown} height={"20px"} />
        </>
      )}
    </button>
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
    date: Time;
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
              <Tippy
                placement="right"
                theme="light"
                content="No changes allowed on minting day">
                <span>
                  - Minting Today{" "}
                  <FontAwesomeIcon icon={faInfoCircle} height={"20px"} />
                </span>
              </Tippy>
            ) : (
              <span className="font-color-silver">
                {props.date.toIsoDateString()} / {props.date.toDayName()}
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
