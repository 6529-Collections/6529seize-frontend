import styles from "./Delegation.module.scss";
import { Container, Row, Col, Accordion } from "react-bootstrap";
import { useAccount, useConnect, useEnsName } from "wagmi";
import { formatAddress } from "../../helpers/Helpers";
import { useState } from "react";
import Image from "next/image";

import {
  DelegationCollection,
  SUPPORTED_COLLECTIONS,
} from "../../pages/delegations/[contract]";

interface Props {
  collection: DelegationCollection;
}

export const USE_CASES = [
  {
    use_case: 1,
    display: "All (1-15)",
  },
  {
    use_case: 2,
    display: "Minting / Allowlist",
  },
  {
    use_case: 3,
    display: "Airdrops",
  },
  {
    use_case: 4,
    display: "Voting / Governance",
  },
  {
    use_case: 5,
    display: "Avatar Display",
  },
  {
    use_case: 6,
    display: "Social Media",
  },
  {
    use_case: 7,
    display: "Physical Events Access",
  },
  {
    use_case: 8,
    display: "Virtual Events Access",
  },
  {
    use_case: 9,
    display: "Club Access",
  },
  {
    use_case: 10,
    display: "Metaverse Access",
  },
  {
    use_case: 11,
    display: "Metaverse Land",
  },
  {
    use_case: 12,
    display: "Gameplay",
  },
  {
    use_case: 13,
    display: "IP Licensing",
  },
  {
    use_case: 14,
    display: "NFT rentals",
  },
  {
    use_case: 15,
    display: "View Access",
  },
  {
    use_case: 16,
    display: "Sub-delegation",
  },
  {
    use_case: 99,
    display: "Consolidation",
  },
];

const DELEGATIONS_SAMPLE = [
  {
    uc: 2,
    wallets: [
      "0x0000000000e43e0c383403dd18066ff60d5003b3",
      "0x00000000174b0ba12b89da994258020837ad8818",
    ],
  },
  {
    uc: 3,
    wallets: ["0x0000007370af0000ad00be0efd2f1eb6e6e9d700"],
  },
  {
    uc: 8,
    wallets: [
      "0x000000004b5ad44f70781462233d177d32d993f1",
      "0x0000000765306855601b70d930ac579b23a18d44",
      "0x0000000f20b778d2424e95120652e2d40d8f5aac",
    ],
  },
];
export default function CollectionDelegationComponent(props: Props) {
  const { address, connector, isConnected } = useAccount();
  const connectResolution = useConnect();
  const ensResolution = useEnsName({
    address: address,
  });

  const [showCreateNew, setShowCreateNew] = useState(false);

  function printLive() {
    return (
      <Container className="pt-3 pb-5">
        <Row className="pt-2 pb-2">
          <Col>
            <h4>Current Delegations</h4>
          </Col>
        </Row>
        <Row>
          <Col className="pt-2 pb-2">
            <Accordion className={styles.collectionDelegationsAccordion}>
              {DELEGATIONS_SAMPLE.map((ds, index) => {
                const useCase = USE_CASES.find((uc) => uc.use_case == ds.uc);
                if (useCase) {
                  return (
                    <Accordion.Item
                      className={styles.collectionDelegationsAccordionItem}
                      eventKey={index.toString()}
                      key={`accordion-item-${ds.uc}`}>
                      <Accordion.Header>
                        Use Case #{useCase.use_case} - {useCase.display}
                      </Accordion.Header>
                      <Accordion.Body>
                        <ul>
                          {ds.wallets.map((w) => (
                            <li
                              key={`accordion-item-${ds.uc}-${w}`}
                              className="mt-2 mb-2">
                              {w}{" "}
                              <a
                                href={`/${w}`}
                                className={styles.useCaseWalletLink}
                                target="_blank"
                                rel="noreferrer">
                                view
                              </a>
                            </li>
                          ))}
                        </ul>
                      </Accordion.Body>
                    </Accordion.Item>
                  );
                }
              })}
            </Accordion>
          </Col>
        </Row>
      </Container>
    );
  }
  return (
    <Container fluid>
      <Row>
        <Col>
          {isConnected && address && props.collection && (
            <Container>
              <Row className="pt-5 pb-2">
                <Col className="text-center">
                  <h4 className={styles.connectedAsHeader}>
                    Connected as{" "}
                    {ensResolution.data && `${ensResolution.data} - `}
                    {formatAddress(address)}
                  </h4>
                </Col>
              </Row>
              <Row className="pt-2 pb-3">
                <Col className="text-center">
                  <h4 className={styles.connectedAsHeader}>
                    Collection {props.collection.display} -{" "}
                    {formatAddress(props.collection.contract)}
                  </h4>
                </Col>
              </Row>
              {!showCreateNew && printLive()}
            </Container>
          )}
        </Col>
      </Row>
    </Container>
  );
}
