"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Toggle from "react-toggle";

export default function UserPageSubscriptionsEditionPreference(
  props: Readonly<{
    profileKey: string;
    details: SubscriptionDetails | undefined;
    readonly: boolean;
    refresh: () => void;
  }>
) {
  const { requestAuth, setToast } = useContext(AuthContext);

  const [isAllEditions, setIsAllEditions] = useState<boolean>(false);
  const [isUpdatingAllEditions, setIsUpdatingAllEditions] =
    useState<boolean>(false);

  const subscriptionEligibilityCount =
    props.details?.subscription_eligibility_count ?? 1;

  useEffect(() => {
    setIsAllEditions(props.details?.subscribe_all_editions ?? false);
  }, [props.details?.subscribe_all_editions]);

  const toggleAllEditions = async (): Promise<void> => {
    if (isUpdatingAllEditions) {
      return;
    }
    setIsUpdatingAllEditions(true);
    try {
      const { success } = await requestAuth();
      if (!success) {
        return;
      }
      const allEditions = !isAllEditions;
      interface SubscribeAllEditionsBody {
        subscribe_all_editions: boolean;
      }
      const response = await commonApiPost<
        SubscribeAllEditionsBody,
        SubscribeAllEditionsBody
      >({
        endpoint: `subscriptions/${props.profileKey}/subscribe-all-editions`,
        body: {
          subscribe_all_editions: allEditions,
        },
      });
      const responseAllEditions = response.subscribe_all_editions;
      setIsAllEditions(responseAllEditions);
      setToast({
        type: "success",
        title: "Edition preference updated.",
        description: responseAllEditions
          ? "All eligible editions are included."
          : "One edition is included.",
      });
      props.refresh();
    } catch (e: any) {
      setToast({
        type: "error",
        title: "Couldn't update edition preference.",
        description: "Please try again.",
        details: getToastErrorDetails(e, "Could not set edition preference."),
      });
    } finally {
      setIsUpdatingAllEditions(false);
    }
  };

  return (
    <Container className="no-padding">
      <Row className="tw-pb-2">
        <Col>
          <h5 className="tw-mb-0">
            Edition Preference{" "}
            <span className="tw-text-iron-400 tw-text-sm tw-font-semibold tw-whitespace-nowrap">
              Eligibility x{subscriptionEligibilityCount}
            </span>
          </h5>
        </Col>
      </Row>
      <Row className="tw-pt-1">
        <Col className="tw-flex tw-items-center tw-gap-2">
          <label
            htmlFor={"subscription-all-editions-mode"}
            className="font-color">
            <b>One edition</b>
          </label>
          <Toggle
            disabled={props.readonly || isUpdatingAllEditions}
            id={"subscription-all-editions-mode"}
            checked={isAllEditions}
            icons={false}
            onChange={toggleAllEditions}
          />
          <label
            htmlFor={"subscription-all-editions-mode"}
            className="font-color">
            <b>All eligible</b>
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
  );
}
