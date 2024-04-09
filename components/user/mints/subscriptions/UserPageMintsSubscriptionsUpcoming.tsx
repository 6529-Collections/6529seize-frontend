import styles from "./UserPageMintsSubscriptions.module.scss";
import { useContext, useEffect, useState } from "react";
import { Container, Row, Col, Table, Button } from "react-bootstrap";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { AuthContext } from "../../../auth/Auth";
import {
  NFTSubscription,
  SubscriptionDetails,
} from "../../../../entities/ISubscription";
import { commonApiPost } from "../../../../services/api/common-api";
import { Spinner } from "../../../dotLoader/DotLoader";

export default function UserPageMintsSubscriptionsUpcoming(
  props: Readonly<{
    profile: IProfileAndConsolidations;
    details: SubscriptionDetails | undefined;
    memes_subscriptions: NFTSubscription[];
    readonly: boolean;
    refresh: () => void;
  }>
) {
  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h5>Upcoming Drops</h5>
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <Table className={styles.nftSubscriptionsTable}>
            <tbody>
              {props.memes_subscriptions.map((subscription, index) => (
                <tr key={subscription.token_id}>
                  <td>
                    <SubscriptionRow
                      profile={props.profile}
                      title="The Memes"
                      subscription={subscription}
                      readonly={props.readonly}
                      refresh={props.refresh}
                      first={index === 0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}

function SubscriptionRow(
  props: Readonly<{
    profile: IProfileAndConsolidations;
    title: string;
    subscription: NFTSubscription;
    readonly: boolean;
    first?: boolean;
    refresh: () => void;
  }>
) {
  const { requestAuth, setToast } = useContext(AuthContext);

  const [subscribed, setSubscribed] = useState<boolean>();
  const [tagClass, setTagClass] = useState<string>();

  useEffect(() => {
    setSubscribed(props.subscription.subscribed);
  }, [props.subscription]);

  useEffect(() => {
    setTagClass(subscribed ? styles.subscribedTag : styles.notSubscribedTag);
  }, [subscribed]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (): Promise<void> => {
    if (isSubmitting) {
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
        endpoint: `subscriptions/${props.profile.consolidation.consolidation_key}/subscription`,
        body: {
          contract: props.subscription.contract,
          token_id: props.subscription.token_id,
          subscribed: subscribe,
        },
      });
      const responseSubscribed = response.subscribed;
      setSubscribed(responseSubscribed);
      const detail = responseSubscribed
        ? `Subscribed for`
        : `Unsubscribed from`;
      setToast({
        message: `${detail} ${props.title} #${response.token_id}`,
        type: "success",
      });
      props.refresh();
    } catch (e: any) {
      console.log(e);
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
          <span>
            {props.title} #{props.subscription.token_id}
          </span>
          <span className="d-flex align-items-center gap-3">
            {isSubmitting && <Spinner />}
            <span className="d-flex align-items-center">
              <div className={tagClass}>
                {subscribed ? "Subscribed" : "Not Subscribed"}
              </div>
              {!props.readonly && (
                <Button className="seize-btn-link" onClick={submit}>
                  {subscribed ? "Unsubscribe" : "Subscribe"}
                </Button>
              )}
            </span>
          </span>
        </Col>
      </Row>
      {props.first && !props.readonly && (
        <Row className="pt-2">
          <Col
            className="font-smaller font-color-silver"
            style={{
              whiteSpace: "pre-wrap",
            }}>
            Important: The subscriber list for Meme #
            {props.subscription.token_id} is set at midnight and can be found{" "}
            <a
              href="/open-data/meme-subscriptions"
              className="font-color-silver">
              here
            </a>
            . If Meme #{props.subscription.token_id} is released today, any
            changes you make now won&apos;t affect your subscription for this
            drop. Make sure to subscribe/unsubscribe before midnight to be
            counted for future drops!
          </Col>
        </Row>
      )}
    </Container>
  );
}
