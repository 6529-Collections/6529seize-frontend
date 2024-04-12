import styles from "./UserPageSubscriptions.module.scss";
import { useContext, useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { AuthContext } from "../../auth/Auth";
import {
  NFTSubscription,
  SubscriptionDetails,
} from "../../../entities/ISubscription";
import { commonApiPost } from "../../../services/api/common-api";
import { Spinner } from "../../dotLoader/DotLoader";
import Toggle from "react-toggle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { isMintingToday } from "../../../helpers/meme_calendar.helplers";

export default function UserPageSubscriptionsUpcoming(
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
                      minting_today={index === 0 && isMintingToday()}
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
    minting_today?: boolean;
    refresh: () => void;
  }>
) {
  const id = `subscription-${props.subscription.token_id}`;

  const { requestAuth, setToast } = useContext(AuthContext);

  const [subscribed, setSubscribed] = useState<boolean>(
    props.subscription.subscribed
  );

  useEffect(() => {
    setSubscribed(props.subscription.subscribed);
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
          <span className="d-flex align-items-center gap-2">
            {props.title} #{props.subscription.token_id}{" "}
            {props.minting_today && (
              <Tippy
                placement="right"
                theme="light"
                content="No changes allowed on minting day">
                <span>
                  - Minting Today{" "}
                  <FontAwesomeIcon icon="info-circle" height={"20px"} />
                </span>
              </Tippy>
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
    </Container>
  );
}
