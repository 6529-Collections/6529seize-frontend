"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { SubscriptionDetails } from "@/entities/ISubscription";
import { commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Toggle from "react-toggle";

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

  const [isAllEditions, setIsAllEditions] = useState<boolean>(false);
  const [isUpdatingAllEditions, setIsUpdatingAllEditions] =
    useState<boolean>(false);

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

  const toggleAllEditions = async (): Promise<void> => {
    if (isUpdatingAllEditions) {
      return;
    }
    setIsUpdatingAllEditions(true);
    setIsAllEditions(!isAllEditions);
    setIsUpdatingAllEditions(false);
    // TODO: Implement API call to toggle all editions
  };

  return (
    <>
      <Container className="no-padding">
        <Row className="tw-pb-2">
          <Col>
            <h5 className="tw-mb-0">Mode</h5>
          </Col>
        </Row>
        <Row className="tw-pt-1">
          <Col className="tw-flex tw-items-center tw-gap-2">
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
            {isUpdating && <CircleLoader size={CircleLoaderSize.MEDIUM} />}
          </Col>
        </Row>
        {!props.readonly && (
          <Row className="tw-pt-1">
            <Col className="tw-whitespace-nowrap">
              {isAuto
                ? "Automatic airdrops of all eligible drops unless you opt-out"
                : "You have to opt-in to each specific drop"}
            </Col>
          </Row>
        )}
      </Container>

      {isAuto && (
        <Container className="no-padding">
          <Row className="tw-pb-2">
            <Col>
              <h5 className="tw-mb-0">Edition Preference</h5>
            </Col>
          </Row>
          <Row className="tw-pt-1">
            <Col className="tw-flex tw-items-center tw-gap-2">
              <label
                htmlFor={"subscription-all-editions-mode"}
                className={"font-color"}>
                <b>Only one</b>
              </label>
              <Toggle
                disabled={props.readonly || isUpdating}
                id={"subscription-all-editions-mode"}
                checked={isAllEditions}
                icons={false}
                onChange={toggleAllEditions}
              />
              <label
                htmlFor={"subscription-all-editions-mode"}
                className={"font-color"}>
                <b>All editions</b>
              </label>
              {isUpdatingAllEditions && (
                <CircleLoader size={CircleLoaderSize.MEDIUM} />
              )}
            </Col>
          </Row>
          {!props.readonly && (
            <Row className="tw-pt-1">
              <Col className="tw-whitespace-nowrap">
                {isAllEditions
                  ? "You will receive all editions you are eligible for"
                  : "You will receive only one edition"}
              </Col>
            </Row>
          )}
        </Container>
      )}
    </>
  );
}
