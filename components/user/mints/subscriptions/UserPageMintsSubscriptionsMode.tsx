import { useContext, useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import Toggle from "react-toggle";
import { AuthContext } from "../../../auth/Auth";
import { commonApiPost } from "../../../../services/api/common-api";
import { SubscriptionDetails } from "../../../../entities/ISubscription";
import { Spinner } from "../../../dotLoader/DotLoader";

export default function UserPageMintsSubscriptionsMode(
  props: Readonly<{
    profile: IProfileAndConsolidations;
    details: SubscriptionDetails | undefined;
    readonly: boolean;
    refresh: () => void;
  }>
) {
  const { requestAuth, setToast } = useContext(AuthContext);

  const [isAuto, setIsAuto] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    setIsAuto(props.details?.automatic ?? false);
  }, [props.details]);

  const toggleMode = async (): Promise<void> => {
    if (isUpdating) {
      return;
    }
    setIsUpdating(true);
    const { success } = await requestAuth();
    if (!success) {
      setIsUpdating(false);
      return;
    }
    const auto = !isAuto;
    interface SubscribeModeBody {
      automatic: boolean;
    }
    try {
      const response = await commonApiPost<
        SubscribeModeBody,
        SubscribeModeBody
      >({
        endpoint: `subscriptions/${props.profile.consolidation.consolidation_key}/subscription-mode`,
        body: {
          automatic: auto,
        },
      });
      const responseAuto = response.automatic;
      setIsAuto(responseAuto);
      const message = `Subscription Mode set to ${
        responseAuto ? `Automatic` : `Manual`
      } - ${
        responseAuto ? `Subscribed for` : `Unsubscribed from`
      } all upcoming drops`;
      setToast({
        message: message,
        type: "success",
      });
      props.refresh();
    } catch (e) {
      setIsUpdating(false);
      setToast({
        message: `Failed to set subscription mode`,
        type: "error",
      });
      return;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-l sm:tw-tracking-tight">
            Mode
          </h2>
        </Col>
      </Row>
      <Row className="pt-1">
        <Col className="d-flex align-items-center gap-2">
          <label htmlFor={"subscription-mode"} className={"font-color"}>
            <b>Manual</b>
          </label>
          <Toggle
            disabled={props.readonly || isUpdating}
            id={"subscription-mode"}
            checked={isAuto}
            icons={false}
            onChange={toggleMode}
          />
          <label htmlFor={"subscription-mode"} className={"font-color"}>
            <b>Automatic</b>
          </label>
          {isUpdating && <Spinner />}
        </Col>
      </Row>
    </Container>
  );
}
