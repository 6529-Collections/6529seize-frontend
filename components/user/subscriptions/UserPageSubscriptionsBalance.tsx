import DotLoader, { Spinner } from "@/components/dotLoader/DotLoader";
import EthereumIcon from "../utils/icons/EthereumIcon";
import { numberWithCommas } from "@/helpers/Helpers";
import { SubscriptionDetails } from "@/entities/ISubscription";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Container, Row, Col } from "react-bootstrap";
import { MEMES_MINT_PRICE } from "@/constants";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";

export default function UserPageSubscriptionsBalance(
  props: Readonly<{
    details: SubscriptionDetails | undefined;
    show_refresh: boolean;
    fetching: boolean;
    refresh: () => void;
  }>
) {
  return (
    <Container className="no-padding">
      <Row className="pb-2">
        <Col className="d-flex align-items-center gap-2">
          <h5 className="no-wrap mb-0">Current Balance</h5>
          {props.show_refresh && (
            <>
              {props.fetching ? (
                <Spinner />
              ) : (
                <FontAwesomeIcon
                  icon={faRefresh}
                  onClick={() => {
                    props.refresh();
                  }}
                  style={{
                    height: "24px",
                    cursor: "pointer",
                  }}
                  aria-label="Refresh balance"
                  tabIndex={0}
                  role="button"
                />
              )}
            </>
          )}
        </Col>
      </Row>
      <Row className="pt-1">
        <Col>
          {props.fetching ? (
            <DotLoader />
          ) : (
            <span className="d-flex align-items-center gap-3">
              <span className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center gap-1">
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
                </div>
                {props.details && props.details.balance > 0 && (
                  <>
                    ({(props.details.balance / MEMES_MINT_PRICE).toFixed(0)}{" "}
                    cards)
                  </>
                )}
              </span>
            </span>
          )}
        </Col>
      </Row>
    </Container>
  );
}
