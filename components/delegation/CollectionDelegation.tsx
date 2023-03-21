import styles from "./Delegation.module.scss";
import { Container, Row, Col, Accordion, Button, Form } from "react-bootstrap";
import { useAccount, useConnect, useEnsName } from "wagmi";
import { formatAddress } from "../../helpers/Helpers";
import { useState } from "react";
import Image from "next/image";

import {
  DelegationCollection,
  SUPPORTED_COLLECTIONS,
} from "../../pages/delegations/[contract]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";

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
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);
  const [showTokensInput, setShowTokensInput] = useState(false);

  const [newDelegationDate, setNewDelegationDate] = useState<Date | undefined>(
    undefined
  );
  const [newDelegationToken, setNewDelegationToken] = useState<
    number | undefined
  >(undefined);

  const [errors, setErrors] = useState<string[]>([]);

  function submitDelegation() {
    const newErrors: string[] = [];
    if (showExpiryCalendar && !newDelegationDate) {
      newErrors.push("Missing or invalid Expiry");
    }
    if (showTokensInput && !newDelegationToken) {
      newErrors.push("Missing or invalid Token");
    }
    setErrors(newErrors);
    window.scrollTo(0, document.body.scrollHeight);
  }

  function printLive() {
    return (
      <Container className="pt-3 pb-5 no-padding">
        <Row className="pt-2 pb-2">
          <Col>
            <h4>Current Delegations</h4>
          </Col>
        </Row>
        <Row>
          <Col className="pt-2 pb-3">
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
                        <span
                          className={`${styles.lockDelegationBtn} mr-2 mb-3`}>
                          <FontAwesomeIcon
                            icon="lock"
                            className={styles.buttonIcon}
                          />
                          Lock Use Case
                        </span>
                      </Accordion.Body>
                    </Accordion.Item>
                  );
                }
              })}
            </Accordion>
          </Col>
        </Row>
        <Row className="pt-5 pb-2">
          <Col>
            <h4>Register</h4>
          </Col>
        </Row>
        <Row className="pt-2 pb-3">
          <Col>
            <span
              className={styles.addNewDelegationBtn}
              onClick={() => setShowCreateNew(true)}>
              <FontAwesomeIcon icon="plus" className={styles.buttonIcon} />
              Register New Delegation
            </span>
          </Col>
        </Row>
        <Row className="pt-5 pb-2">
          <Col>
            <h4>Revoke</h4>
          </Col>
        </Row>
        <Row className="pt-2 pb-3">
          <Col>
            <span className={styles.revokeDelegationBtn}>
              <FontAwesomeIcon icon="minus" className={styles.buttonIcon} />
              Revoke Delegations
            </span>
          </Col>
        </Row>
        <Row className="pt-5 pb-2">
          <Col>
            <h4>Lock</h4>
          </Col>
        </Row>
        <Row className="pt-2 pb-3">
          <Col>
            <span className={styles.lockDelegationBtn}>
              <FontAwesomeIcon icon="lock" className={styles.buttonIcon} />
              Lock Collection
            </span>
            <span className={styles.lockDelegationBtn}>
              <FontAwesomeIcon icon="lock" className={styles.buttonIcon} />
              Lock Use Case
            </span>
          </Col>
        </Row>
      </Container>
    );
  }

  function printCreateNew() {
    return (
      <Container className="pt-3 pb-5 no-padding">
        <Row className="pt-2 pb-2">
          <Col xs={10}>
            <h4>Register New Delegation</h4>
          </Col>
          <Col xs={2} className="text-right">
            <Tippy
              content={"Cancel Delegation"}
              delay={250}
              placement={"top"}
              theme={"light"}>
              <FontAwesomeIcon
                className={styles.closeNewDelegationForm}
                icon="times-circle"
                onClick={() => setShowCreateNew(false)}></FontAwesomeIcon>
            </Tippy>
          </Col>
        </Row>
        <Row className="pt-4">
          <Col>
            <Form>
              <Form.Group as={Row} className="pb-4">
                <Form.Label column sm={2}>
                  Delegator
                </Form.Label>
                <Col sm={10}>
                  <Form.Control
                    className={`${styles.formInput} ${styles.formInputDisabled}`}
                    type="text"
                    defaultValue={
                      ensResolution.data
                        ? `${ensResolution.data} - ${address}`
                        : `${address}`
                    }
                    disabled
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="pb-4">
                <Form.Label column sm={2}>
                  Collection
                </Form.Label>
                <Col sm={10}>
                  <Form.Control
                    className={`${styles.formInput} ${styles.formInputDisabled}`}
                    type="text"
                    defaultValue={`${props.collection.display} - ${props.collection.contract}`}
                    disabled
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="pb-4">
                <Form.Label column sm={2}>
                  Use Case
                </Form.Label>
                <Col sm={10}>
                  <Form.Select
                    className={`${styles.formInput}`}
                    defaultValue="0">
                    <option value="0" disabled>
                      Select use case
                    </option>
                    {USE_CASES.map((uc) => (
                      <option
                        key={`add-delegation-select-${uc.use_case}`}
                        value={uc.use_case}>
                        #{uc.use_case} - {uc.display}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="pb-4">
                <Form.Label column sm={2}>
                  Expiry
                </Form.Label>
                <Col sm={10}>
                  <Form.Check
                    defaultChecked
                    className={styles.newDelegationFormToggle}
                    type="radio"
                    label="Never"
                    name="expiryRadio"
                    onChange={() => setShowExpiryCalendar(false)}
                  />
                  &nbsp;&nbsp;
                  <Form.Check
                    className={styles.newDelegationFormToggle}
                    type="radio"
                    label="Select Date"
                    name="expiryRadio"
                    onChange={() => setShowExpiryCalendar(true)}
                  />
                  {showExpiryCalendar && (
                    <Container fluid className="no-padding pt-3">
                      <Row>
                        <Col xs={12} xm={12} md={6} lg={4}>
                          <Form.Control
                            min={new Date().toISOString().slice(0, 10)}
                            className={`${styles.formInput}`}
                            type="date"
                            placeholder="Expiry Date"
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value) {
                                setNewDelegationDate(new Date(value));
                              } else {
                                setNewDelegationDate(undefined);
                              }
                            }}
                          />
                        </Col>
                      </Row>
                    </Container>
                  )}
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="pb-4">
                <Form.Label column sm={2}>
                  Tokens
                </Form.Label>
                <Col sm={10}>
                  <Form.Check
                    defaultChecked
                    className={styles.newDelegationFormToggle}
                    type="radio"
                    label="All"
                    name="tokenIdRadio"
                    onChange={() => setShowTokensInput(false)}
                  />
                  &nbsp;&nbsp;
                  <Form.Check
                    className={styles.newDelegationFormToggle}
                    type="radio"
                    label="Select Token ID"
                    name="tokenIdRadio"
                    onChange={() => setShowTokensInput(true)}
                  />
                  {showTokensInput && (
                    <Container fluid className="no-padding pt-3">
                      <Row>
                        <Col xs={12} xm={12} md={6} lg={4}>
                          <Form.Control
                            min={0}
                            className={`${styles.formInput}`}
                            type="number"
                            placeholder="Token ID"
                            onChange={(e) => {
                              const value = e.target.value;
                              try {
                                const intValue = parseInt(value);
                                setNewDelegationToken(intValue);
                              } catch {
                                setNewDelegationToken(undefined);
                              }
                            }}
                          />
                        </Col>
                      </Row>
                    </Container>
                  )}
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="pt-4 pb-4">
                <Form.Label column sm={2}></Form.Label>
                <Col sm={10} className="">
                  <span
                    className={styles.newDelegationSubmitBtn}
                    onClick={() => {
                      setErrors([]);
                      submitDelegation();
                    }}>
                    Submit
                  </span>
                  <span
                    className={styles.newDelegationCancelBtn}
                    onClick={() => setShowCreateNew(false)}>
                    Cancel
                  </span>
                </Col>
              </Form.Group>
              {errors.length > 0 && (
                <Form.Group
                  as={Row}
                  className={`pt-4 pb-4 ${styles.newDelegationError}`}>
                  <Form.Label column sm={2}>
                    Errors
                  </Form.Label>
                  <Col sm={10}>
                    <ul>
                      {errors.map((e, index) => (
                        <li key={`new-delegation-error-${index}`}>{e}</li>
                      ))}
                    </ul>
                  </Col>
                </Form.Group>
              )}
            </Form>
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
              {!showCreateNew && printLive()}
              {showCreateNew && printCreateNew()}
            </Container>
          )}
          {!isConnected && printConnect()}
        </Col>
      </Row>
    </Container>
  );
}
