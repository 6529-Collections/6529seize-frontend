"use client";

import { useContext, useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Toggle from "react-toggle";
import { AuthContext } from "@/components/auth/Auth";
import { commonApiPost } from "@/services/api/common-api";
import { SubscriptionDetails } from "@/entities/ISubscription";
import { Spinner } from "@/components/dotLoader/DotLoader";

export default function UserPageSubscriptionsMode(
  props: Readonly<{
    profileKey: string;
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
        endpoint: `subscriptions/${props.profileKey}/subscription-mode`,
        body: {
          automatic: auto,
        },
      });
      const responseAuto = response.automatic;
      setIsAuto(responseAuto);
      const message = `Subscription Mode set to ${
        responseAuto ? `Automatic` : `Manual`
      }. ${
        responseAuto ? `Subscribed for` : `Unsubscribed from`
      } all upcoming drops`;
      setToast({
        message: message,
        type: "success",
      });
      props.refresh();
    } catch (e: any) {
      setIsUpdating(false);
      setToast({
        message: e ?? "Failed to set subscription mode",
        type: "error",
      });
      return;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Container className="no-padding">
      <Row className="pb-2">
        <Col>
          <h5 className="mb-0">Mode</h5>
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
      {!props.readonly && (
        <Row className="pt-1">
          <Col className="no-wrap">
            {isAuto
              ? "Automatic airdrops of all eligible cards unless you opt-out"
              : "You have to opt-in to each specific card"}
          </Col>
        </Row>
      )}
    </Container>
  );
}
