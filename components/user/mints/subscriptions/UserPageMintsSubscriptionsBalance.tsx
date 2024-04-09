import DotLoader, { Spinner } from "../../../dotLoader/DotLoader";
import EthereumIcon from "../../utils/icons/EthereumIcon";
import { numberWithCommas } from "../../../../helpers/Helpers";
import { SubscriptionDetails } from "../../../../entities/ISubscription";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";

export default function UserPageMintsSubscriptionsBalance(
  props: Readonly<{
    details: SubscriptionDetails | undefined;
    show_refresh: boolean;
    fetching: boolean;
    refresh: () => void;
  }>
) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h5 className="no-wrap">Current Balance</h5>
        </Col>
      </Row>
      <Row className="pt-1">
        <Col>
          {props.fetching ? (
            <DotLoader />
          ) : (
            <span className="d-flex align-items-center gap-3">
              <span className="d-flex align-items-center gap-1">
                <b>
                  {props.details?.balance
                    ? numberWithCommas(
                        Math.round(props.details.balance * 1000000) / 1000000
                      )
                    : 0}
                </b>
                <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-50">
                  <EthereumIcon />
                </div>
              </span>
              {props.show_refresh && (
                <>
                  {props.fetching || isRefreshing ? (
                    <Spinner />
                  ) : (
                    <FontAwesomeIcon
                      icon="refresh"
                      onClick={() => {
                        setIsRefreshing(true);
                        setTimeout(() => {
                          setIsRefreshing(false);
                        }, 500);
                        props.refresh();
                      }}
                      style={{
                        height: "24px",
                        cursor: "pointer",
                      }}
                    />
                  )}
                </>
              )}
            </span>
          )}
        </Col>
      </Row>
    </Container>
  );
}
