import styles from "./Delegation.module.scss";
import {
  Container,
  Row,
  Col,
  Accordion,
  Table,
  FormCheck,
} from "react-bootstrap";
import { useAccount, useConnect, useEnsName } from "wagmi";
import { Fragment, useState } from "react";

import {
  DelegationCollection,
  MAX_BULK_ACTIONS,
} from "../../pages/delegations/[contract]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { NewDelegationParams } from "../../entities/IDelegation";
import { areEqualAddresses } from "../../helpers/Helpers";

const NewDelegationComponent = dynamic(() => import("./NewDelegation"), {
  ssr: false,
});

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

const DELEGATOR_SAMPLE = [
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

const DELEGATED_SAMPLE = [
  {
    uc: 4,
    wallets: [
      "0x0000000000e43e0c383403dd18066ff60d5003b3",
      "0x00000000174b0ba12b89da994258020837ad8818",
    ],
  },
  {
    uc: 12,
    wallets: ["0x0000007370af0000ad00be0efd2f1eb6e6e9d700"],
  },
  {
    uc: 13,
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

  const [bulkDelegations, setBulkDelegations] = useState<any[]>([]);

  const [delegationParams, setDelegationParams] = useState<
    NewDelegationParams[]
  >([]);

  const [showCreateNew, setShowCreateNew] = useState(false);

  function printDelegations() {
    return (
      <Accordion className={styles.collectionDelegationsAccordion}>
        <Accordion.Item
          className={styles.collectionDelegationsAccordionItem}
          eventKey={"0"}>
          <Accordion.Header>Outgoing Delegations</Accordion.Header>
          <Accordion.Body>{printOutgoingDelegations()}</Accordion.Body>
        </Accordion.Item>
        <Accordion.Item
          className={`${styles.collectionDelegationsAccordionItem} mt-4`}
          eventKey={"1"}>
          <Accordion.Header>Incoming Delegations</Accordion.Header>
          <Accordion.Body>{printIncomingDelegations()}</Accordion.Body>
        </Accordion.Item>
      </Accordion>
    );
  }

  function printOutgoingDelegations() {
    return (
      <Container className="no-padding">
        <Row className={styles.delegationsTableScrollContainer}>
          <Col className="pt-2 pb-3">
            <Table className={styles.delegationsTable}>
              <tbody>
                {DELEGATOR_SAMPLE.map((ds, index) => {
                  const useCase = USE_CASES.find((uc) => uc.use_case == ds.uc);
                  return (
                    <Fragment key={`${ds.uc}-${index}`}>
                      <tr>
                        <td
                          colSpan={4}
                          className={styles.delegationsTableUseCaseHeader}>
                          #{ds.uc} - {useCase?.display}
                        </td>
                      </tr>
                      {ds.wallets.map((w) => (
                        <tr key={`${ds.uc}-${w}`}>
                          <td>
                            <FormCheck
                              disabled={
                                bulkDelegations.length == MAX_BULK_ACTIONS &&
                                !bulkDelegations.some(
                                  (bd) =>
                                    bd.use_case == ds.uc &&
                                    areEqualAddresses(bd.wallet, w)
                                )
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkDelegations((bd) => [
                                    ...bd,
                                    {
                                      use_case: ds.uc,
                                      wallet: w,
                                    },
                                  ]);
                                } else {
                                  setBulkDelegations((bd) =>
                                    bd.filter(
                                      (x) =>
                                        !(
                                          x.use_case == ds.uc &&
                                          areEqualAddresses(x.wallet, w)
                                        )
                                    )
                                  );
                                }
                              }}
                            />
                          </td>
                          <td>{w}</td>
                          <td className="text-right">
                            <span
                              className={styles.useCaseWalletUpdate}
                              onClick={() =>
                                alert(
                                  `\nupdating delegation... \n\ndelegator: ${address}\nuse case: ${ds.uc}\naddress: ${w} `
                                )
                              }>
                              Update
                            </span>
                          </td>
                          <td>
                            <span
                              className={styles.useCaseWalletRevoke}
                              onClick={() =>
                                alert(
                                  `\nrevoking delegation... \n\ndelegator: ${address}\nuse case: ${ds.uc}\naddress: ${w} `
                                )
                              }>
                              Revoke
                            </span>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
                <tr>
                  <td colSpan={4} className="pt-3">
                    selected:{" "}
                    {bulkDelegations.length == 5
                      ? `5 (max)`
                      : bulkDelegations.length}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4}>
                    <span
                      className={`${styles.useCaseWalletRevoke} ${
                        bulkDelegations.length == 0
                          ? `${styles.useCaseWalletRevokeDisabled}`
                          : ``
                      }`}
                      onClick={() =>
                        alert(
                          `\nrevoking delegation... \n\ndelegator: ${address}\nuse case: `
                        )
                      }>
                      Bulk Revoke
                    </span>
                  </td>
                </tr>
              </tbody>
            </Table>
            {/* <Accordion className={styles.collectionDelegationsAccordion}>
              {DELEGATOR_SAMPLE.map((ds, index) => {
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
                              className="pt-4 pb-4">
                              {w}{" "}
                              <a
                                href={`/${w}`}
                                className={styles.useCaseWalletLink}
                                target="_blank"
                                rel="noreferrer">
                                view
                              </a>
                              <span
                                className={styles.useCaseWalletUpdate}
                                onClick={() =>
                                  alert(
                                    `\nupdating delegation... \n\ndelegator: ${address}\nuse case: ${ds.uc}\naddress: ${w} `
                                  )
                                }>
                                Update
                              </span>
                              <span
                                className={styles.useCaseWalletRevoke}
                                onClick={() =>
                                  alert(
                                    `\nrevoking delegation... \n\ndelegator: ${address}\nuse case: ${ds.uc}\naddress: ${w} `
                                  )
                                }>
                                Revoke
                              </span>
                            </li>
                          ))}
                        </ul>
                      </Accordion.Body>
                    </Accordion.Item>
                  );
                }
              })}
            </Accordion> */}
          </Col>
        </Row>
      </Container>
    );
  }

  function printIncomingDelegations() {
    return (
      <Container className="no-padding">
        <Row className={styles.delegationsTableScrollContainer}>
          <Col className="pt-2 pb-3">
            <Table className={styles.delegationsTable}>
              <tbody>
                {DELEGATED_SAMPLE.map((ds, index) => {
                  const useCase = USE_CASES.find((uc) => uc.use_case == ds.uc);
                  return (
                    <Fragment key={`${ds.uc}-${index}`}>
                      <tr>
                        <td
                          colSpan={4}
                          className={styles.delegationsTableUseCaseHeader}>
                          #{ds.uc} - {useCase?.display}
                        </td>
                      </tr>
                      {ds.wallets.map((w) => (
                        <tr key={`${ds.uc}-${w}`}>
                          <td className={styles.incomingDelegationAddress}>
                            &bull; {w}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    );
  }

  function printActions() {
    return (
      <Container>
        <Row className="pt-5 pb-2">
          <Col>
            <h4>Actions</h4>
          </Col>
        </Row>
        <Row className="pt-2 pb-3">
          <Col>
            <span
              className={styles.addNewDelegationBtn}
              onClick={() => setShowCreateNew(true)}>
              <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
              Register Delegation
            </span>
            <span
              className={styles.addNewDelegationBtn}
              onClick={() => setShowCreateNew(true)}>
              <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
              Register Delegation with Sub-delegation Rights
            </span>
            <span className={styles.lockDelegationBtn}>
              <FontAwesomeIcon icon="lock" className={styles.buttonIcon} />
              Lock Use Case
            </span>
            <span className={styles.lockDelegationBtn}>
              <FontAwesomeIcon icon="lock" className={styles.buttonIcon} />
              Lock Collection
            </span>
          </Col>
        </Row>
      </Container>
    );
  }

  function printConnect() {
    return (
      <Container className={styles.mainContainer}>
        <Row className="pt-5 pb-3">
          <Col className="text-center">
            <h3 className="float-none">Connect your wallet</h3>
          </Col>
        </Row>
        <Row className="pt-5">
          {connectResolution.connectors.map((connector) => (
            <Col
              key={`${connector.name}`}
              xs={12}
              xm={12}
              md={4}
              className="pt-3 pb-3 d-flex justify-content-center">
              <div
                className={styles.connectBtn}
                onClick={() => {
                  if (connector.ready) {
                    connectResolution.connect({ connector });
                  } else if (connector.name == "MetaMask") {
                    window.open("https://metamask.io/download/", "_blank");
                  }
                }}>
                {connector.name}
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          {isConnected && address && props.collection && (
            <Container className="pt-3 -b-3">
              <Row className="pt-2 pb-2">
                <Col>
                  <h1>{props.collection.display.toUpperCase()} DELEGATIONS</h1>
                </Col>
              </Row>
              {!showCreateNew && (
                <>
                  {/* {printOutgoingDelegations()}
                  {printIncomingDelegations()} */}
                  {printDelegations()}
                  {printActions()}
                </>
              )}
              {showCreateNew && (
                <NewDelegationComponent
                  collection={props.collection}
                  address={address}
                  ens={ensResolution.data}
                  showAddMore={true}
                  showCancel={true}
                  onHide={() => setShowCreateNew(false)}
                />
              )}
            </Container>
          )}
          {!isConnected && printConnect()}
        </Col>
      </Row>
    </Container>
  );
}
