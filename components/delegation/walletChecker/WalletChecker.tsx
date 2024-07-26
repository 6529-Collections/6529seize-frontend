import { Fragment, useEffect, useState } from "react";
import styles from "./WalletChecker.module.scss";
import { Container, Row, Col, Form, Button, Table } from "react-bootstrap";
import { useEnsName, useEnsAddress } from "wagmi";
import { areEqualAddresses, isValidEthAddress } from "../../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  DELEGATION_ALL_ADDRESS,
  MEMES_CONTRACT,
  NEVER_DATE,
} from "../../../constants";
import { DBResponse } from "../../../entities/IDBResponse";
import { Delegation, WalletConsolidation } from "../../../entities/IDelegation";
import {
  SUB_DELEGATION_USE_CASE,
  ALL_USE_CASES,
  SUPPORTED_COLLECTIONS,
  MINTING_USE_CASE,
} from "../../../pages/delegation/[...section]";
import { fetchUrl } from "../../../services/6529api";
import Address from "../../address/Address";

interface Props {
  path?: string;
}

interface ConsolidationDisplay {
  from: string;
  from_display: string | undefined;
  to: string;
  to_display: string | undefined;
}

export default function WalletCheckerComponent(
  props: Readonly<{
    address_query: string;
    setAddressQuery(address: string): any;
  }>
) {
  const [fetchedAddress, setFetchedAddress] = useState<string>("");
  const [walletInput, setWalletInput] = useState(props.address_query);
  const [walletAddress, setWalletAddress] = useState(props.address_query);

  const [checking, setChecking] = useState(!!props.address_query);
  const [addressError, setAddressError] = useState(false);

  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [subDelegations, setSubDelegations] = useState<Delegation[]>([]);
  const [delegationsLoaded, setDelegationsLoaded] = useState(false);

  const [consolidations, setConsolidations] = useState<ConsolidationDisplay[]>(
    []
  );
  const [consolidationActions, setConsolidationActions] = useState<
    ConsolidationDisplay[]
  >([]);
  const [consolidatedWallets, setConsolidatedWallets] = useState<
    { address: string; display: string | undefined }[]
  >([]);
  const [consolidationsLoaded, setConsolidationsLoaded] = useState(false);
  const [activeDelegation, setActiveDelegation] = useState<Delegation>();

  const walletAddressEns = useEnsName({
    address:
      walletInput && walletInput.startsWith("0x")
        ? (walletInput as `0x${string}`)
        : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (walletAddressEns.data) {
      setWalletAddress(walletInput);
      setWalletInput(`${walletAddressEns.data} - ${walletInput}`);
    }
  }, [walletAddressEns.data]);

  const walletAddressFromEns = useEnsAddress({
    name: walletInput && walletInput.endsWith(".eth") ? walletInput : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (walletAddressFromEns.data) {
      setWalletAddress(walletAddressFromEns.data);
      setWalletInput(`${walletInput} - ${walletAddressFromEns.data}`);
    }
  }, [walletAddressFromEns.data]);

  function fetchDelegations(address: string) {
    const url = `${process.env.API_ENDPOINT}/api/delegations/${address}`;
    fetchUrl(url).then((response: DBResponse) => {
      setDelegations(
        [...response.data].filter(
          (d) => d.use_case != SUB_DELEGATION_USE_CASE.use_case
        )
      );
      setSubDelegations(
        [...response.data].filter(
          (d) => d.use_case === SUB_DELEGATION_USE_CASE.use_case
        )
      );
      setDelegationsLoaded(true);
    });
  }

  function setAllConsolidations(consolidations: WalletConsolidation[]) {
    const myConsolidations: ConsolidationDisplay[] = [];
    consolidations.map((c) => {
      const newConsolidation1: ConsolidationDisplay = {
        from: c.wallet1,
        from_display: c.wallet1_display,
        to: c.wallet2,
        to_display: c.wallet2_display,
      };
      if (
        !myConsolidations.find(
          (mc) =>
            areEqualAddresses(mc.from, newConsolidation1.from) &&
            areEqualAddresses(mc.to, newConsolidation1.to)
        )
      ) {
        myConsolidations.push(newConsolidation1);
      }
      if (c.confirmed) {
        const newConsolidation2 = {
          from: c.wallet2,
          from_display: c.wallet2_display,
          to: c.wallet1,
          to_display: c.wallet1_display,
        };
        if (
          !myConsolidations.find(
            (mc) =>
              areEqualAddresses(mc.from, newConsolidation2.from) &&
              areEqualAddresses(mc.to, newConsolidation2.to)
          )
        ) {
          myConsolidations.push(newConsolidation2);
        }
      }
    });
    setConsolidations(myConsolidations);
    setConsolidationsLoaded(true);
  }

  function getForAddress(address: string, collection: string, useCase: number) {
    const myDelegations = delegations.find(
      (d) =>
        areEqualAddresses(address, d.from_address) &&
        areEqualAddresses(collection, d.collection) &&
        useCase === d.use_case
    );
    return myDelegations;
  }

  useEffect(() => {
    if (delegationsLoaded) {
      const memesUseCase = getForAddress(
        walletAddress,
        MEMES_CONTRACT,
        MINTING_USE_CASE.use_case
      );
      if (memesUseCase) {
        setActiveDelegation(memesUseCase);
      } else {
        const memesAll = getForAddress(walletAddress, MEMES_CONTRACT, 1);
        if (memesAll) {
          setActiveDelegation(memesAll);
        } else {
          const anyUseCase = getForAddress(
            walletAddress,
            DELEGATION_ALL_ADDRESS,
            MINTING_USE_CASE.use_case
          );
          if (anyUseCase) {
            setActiveDelegation(anyUseCase);
          } else {
            const anyAll = getForAddress(
              walletAddress,
              DELEGATION_ALL_ADDRESS,
              1
            );
            if (anyAll) {
              setActiveDelegation(anyAll);
            }
          }
        }
      }
    }
  }, [delegationsLoaded]);

  useEffect(() => {
    if (consolidationsLoaded) {
      fetchConsolidatedWallets(fetchedAddress);

      const actions: ConsolidationDisplay[] = [];
      consolidations.map((c) => {
        if (
          !consolidations.find(
            (c2) =>
              areEqualAddresses(c2.to, c.from) &&
              areEqualAddresses(c2.from, c.to)
          )
        ) {
          actions.push(c);
        }
      });
      setConsolidationActions(actions);
    }
  }, [consolidationsLoaded]);

  function fetchConsolidatedWallets(address: string) {
    const url = `${process.env.API_ENDPOINT}/api/consolidations/${address}`;
    fetchUrl(url).then((response: DBResponse) => {
      const myConsolidatedWallets: {
        address: string;
        display: string | undefined;
      }[] = [];
      response.data.map((address) => {
        let display = undefined;

        const f = consolidations.find((c) =>
          areEqualAddresses(c.from, address)
        );
        if (f) {
          display = f.from_display;
        }

        const t = consolidations.find((c) => areEqualAddresses(c.to, address));
        if (t) {
          display = t.to_display;
        }
        myConsolidatedWallets.push({ address, display });
      });
      setConsolidatedWallets(myConsolidatedWallets);
    });
  }

  function fetchConsolidations(address: string) {
    const url = `${process.env.API_ENDPOINT}/api/consolidations/${address}?show_incomplete=true`;
    fetchUrl(url).then((response1: DBResponse) => {
      if (response1.data.length > 0) {
        const newWallet = areEqualAddresses(address, response1.data[0].wallet1)
          ? response1.data[0].wallet2
          : response1.data[0].wallet1;
        const newUrl = `${process.env.API_ENDPOINT}/api/consolidations/${newWallet}?show_incomplete=true`;
        fetchUrl(newUrl).then((response2: DBResponse) => {
          setAllConsolidations([...response1.data, ...response2.data]);
        });
      } else {
        setAllConsolidations(response1.data);
      }
    });
  }

  function getUseCaseDisplay(useCase: number) {
    const resolved = ALL_USE_CASES.find((u) => u.use_case === useCase);
    return resolved ? `#${useCase} - ${resolved.display}` : `#${useCase}`;
  }

  function getCollectionDisplay(collection: string) {
    const resolved = SUPPORTED_COLLECTIONS.find((sc) =>
      areEqualAddresses(sc.contract, collection)
    );
    return resolved ? resolved.title : collection;
  }

  function formatExpiry(myDate: number) {
    const date = new Date(myDate * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getDateDisplay(myDate: number) {
    if (myDate === NEVER_DATE) {
      return `Never`;
    }
    return formatExpiry(myDate);
  }

  useEffect(() => {
    if (checking) {
      if (!walletAddress || !isValidEthAddress(walletAddress)) {
        setAddressError(true);
        setChecking(false);
        return;
      } else {
        props.setAddressQuery(walletAddress);
        setAddressError(false);
        setActiveDelegation(undefined);
        setFetchedAddress(walletAddress);
        setDelegationsLoaded(false);
        setDelegations([]);
        setConsolidationsLoaded(false);
        setConsolidations([]);
        setConsolidatedWallets([]);
        fetchDelegations(walletAddress);
        fetchConsolidations(walletAddress);
      }
    }
  }, [checking]);

  useEffect(() => {
    if (delegationsLoaded && consolidationsLoaded) {
      setChecking(false);
    }
  }, [delegationsLoaded, consolidationsLoaded]);

  const formDisabled =
    checking ||
    !walletAddress ||
    (!isValidEthAddress(walletAddress) && !walletAddress.endsWith(".eth")) ||
    walletAddressFromEns.isLoading ||
    walletAddressEns.isLoading;

  return (
    <Container className="pt-3 pb-3">
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Wallet</span> Checker
          </h1>
        </Col>
      </Row>
      <Row>
        <Col>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formDisabled) {
                setChecking(true);
              }
            }}>
            <Form.Group as={Row}>
              <Form.Label column sm={12} className="d-flex align-items-center">
                Wallet Address
              </Form.Label>
              <Col sm={12}>
                <Form.Control
                  disabled={delegationsLoaded || consolidationsLoaded}
                  autoFocus
                  placeholder={"0x... or ENS"}
                  className={`${styles.formInput}`}
                  type="text"
                  value={walletInput}
                  onChange={(e) => {
                    setWalletInput(e.target.value);
                    setWalletAddress(e.target.value);
                    setAddressError(false);
                  }}
                />
              </Col>
            </Form.Group>
            {addressError && (
              <Form.Group as={Row}>
                <Form.Text className={styles.error}>Invalid address</Form.Text>
              </Form.Group>
            )}
            <Form.Group as={Row} className="pt-3 text-center">
              <Col
                sm={12}
                className="d-flex align-items-center justify-content-center gap-3">
                <Button
                  onClick={() => {
                    setWalletInput("");
                    setWalletAddress("");
                    setDelegationsLoaded(false);
                    setDelegations([]);
                    setConsolidationsLoaded(false);
                    setConsolidations([]);
                    setChecking(false);
                    props.setAddressQuery("");
                  }}
                  className={styles.clearBtn}>
                  Clear
                </Button>
                <Button
                  disabled={formDisabled}
                  onClick={() => setChecking(true)}
                  className={styles.checkBtn}>
                  {checking ? `Checking...` : `Check`}
                </Button>
              </Col>
            </Form.Group>
            {delegationsLoaded && (
              <>
                <Form.Group as={Row} className="pt-4">
                  <Col sm={12}>
                    <h5 className="pt-2 pb-2">
                      Delegations ({delegations.length})
                    </h5>
                    {delegations.length > 0 ? (
                      <Table>
                        <thead className="mb-2">
                          <tr>
                            <th>From</th>
                            <th>To</th>
                            <th>Collection</th>
                            <th>Use Case</th>
                            <th className="text-center">Tokens</th>
                            <th className="text-center">Expiry</th>
                          </tr>
                        </thead>
                        <tbody>
                          {delegations.map((delegation, index) => (
                            <tr key={`delegations-${index}`}>
                              <td>
                                {areEqualAddresses(
                                  fetchedAddress,
                                  delegation.from_address
                                ) ? (
                                  <Address
                                    wallets={[
                                      delegation.from_address as `0x${string}`,
                                    ]}
                                    display={delegation.from_display}
                                  />
                                ) : (
                                  <span className={styles.supportingAddress}>
                                    <Address
                                      wallets={[
                                        delegation.from_address as `0x${string}`,
                                      ]}
                                      display={delegation.from_display}
                                    />
                                  </span>
                                )}
                              </td>
                              <td>
                                {areEqualAddresses(
                                  fetchedAddress,
                                  delegation.to_address
                                ) ? (
                                  <Address
                                    wallets={[
                                      delegation.to_address as `0x${string}`,
                                    ]}
                                    display={delegation.to_display}
                                  />
                                ) : (
                                  <span className={styles.supportingAddress}>
                                    <Address
                                      wallets={[
                                        delegation.to_address as `0x${string}`,
                                      ]}
                                      display={delegation.to_display}
                                    />
                                  </span>
                                )}
                              </td>
                              <td>
                                {getCollectionDisplay(delegation.collection)}
                              </td>
                              <td>{getUseCaseDisplay(delegation.use_case)}</td>
                              <td className="text-center">
                                {delegation.all_tokens
                                  ? `All`
                                  : delegation.token_id}
                              </td>
                              <td className="text-center">
                                {getDateDisplay(delegation.expiry)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      `No delegations found`
                    )}
                  </Col>
                </Form.Group>
                {activeDelegation && (
                  <div className="pt-2">
                    <h5 className="pt-2 pb-2">
                      Active Minting Delegation for The Memes
                    </h5>
                    <div className="d-flex align-items-center gap-4">
                      <span>
                        To:{" "}
                        <Address
                          wallets={[
                            activeDelegation.to_address as `0x${string}`,
                          ]}
                          display={activeDelegation.to_display}
                        />
                      </span>
                      <span>
                        Collection:{" "}
                        <b>
                          {getCollectionDisplay(activeDelegation.collection)}
                        </b>
                      </span>
                      <span>
                        Use Case:{" "}
                        <b>{getUseCaseDisplay(activeDelegation.use_case)}</b>
                      </span>
                      {activeDelegation.expiry && (
                        <span>
                          &nbsp;&nbsp;Expiry:{" "}
                          <b>
                            {activeDelegation.expiry == NEVER_DATE
                              ? `Never`
                              : formatExpiry(activeDelegation.expiry)}
                          </b>
                        </span>
                      )}
                      <FontAwesomeIcon
                        icon="check"
                        className={styles.activeDelegationIcon}
                      />
                    </div>
                  </div>
                )}
                <Form.Group as={Row} className="pt-4">
                  <Col sm={12}>
                    <h5 className="pt-2 pb-2">
                      Delegation Managers ({subDelegations.length})
                    </h5>
                    {subDelegations.length > 0 ? (
                      <Table>
                        <thead className="mb-2">
                          <tr>
                            <th>From</th>
                            <th>To</th>
                            <th>Collection</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subDelegations.map((delegation, index) => (
                            <tr key={`sub-delegations-${index}`}>
                              <td>
                                {areEqualAddresses(
                                  fetchedAddress,
                                  delegation.from_address
                                ) ? (
                                  <Address
                                    wallets={[
                                      delegation.from_address as `0x${string}`,
                                    ]}
                                    display={delegation.from_display}
                                  />
                                ) : (
                                  <span className={styles.supportingAddress}>
                                    <Address
                                      wallets={[
                                        delegation.from_address as `0x${string}`,
                                      ]}
                                      display={delegation.from_display}
                                    />
                                  </span>
                                )}
                              </td>
                              <td>
                                {areEqualAddresses(
                                  fetchedAddress,
                                  delegation.to_address
                                ) ? (
                                  <Address
                                    wallets={[
                                      delegation.to_address as `0x${string}`,
                                    ]}
                                    display={delegation.to_display}
                                  />
                                ) : (
                                  <span className={styles.supportingAddress}>
                                    <Address
                                      wallets={[
                                        delegation.to_address as `0x${string}`,
                                      ]}
                                      display={delegation.to_display}
                                    />
                                  </span>
                                )}
                              </td>
                              <td>
                                {getCollectionDisplay(delegation.collection)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      `No delegation managers found`
                    )}
                  </Col>
                </Form.Group>
              </>
            )}
            {consolidationsLoaded && (
              <Form.Group as={Row} className="pt-4">
                <Col sm={12}>
                  <h5 className="pt-2 pb-2">
                    Consolidations ({consolidations.length})
                  </h5>
                  {consolidations.length > 0 ? (
                    <Table>
                      <tbody>
                        {consolidations.map((consolidation, index) => (
                          <tr key={`consolidations-${index}`}>
                            <td className="d-flex align-items-center mt-1 mb-1">
                              {areEqualAddresses(
                                fetchedAddress,
                                consolidation.from
                              ) ? (
                                <Address
                                  wallets={[
                                    consolidation.from as `0x${string}`,
                                  ]}
                                  display={consolidation.from_display}
                                />
                              ) : (
                                <span className={styles.supportingAddress}>
                                  <Address
                                    wallets={[
                                      consolidation.from as `0x${string}`,
                                    ]}
                                    display={consolidation.from_display}
                                  />
                                </span>
                              )}
                              <span className="d-inline-flex align-items-center justify-content-center">
                                <span className={styles.arrowBody}></span>
                                <span className={styles.arrowHead}></span>
                              </span>
                              {areEqualAddresses(
                                fetchedAddress,
                                consolidation.to
                              ) ? (
                                <Address
                                  wallets={[consolidation.to as `0x${string}`]}
                                  display={consolidation.to_display}
                                />
                              ) : (
                                <span className={styles.supportingAddress}>
                                  <Address
                                    wallets={[
                                      consolidation.to as `0x${string}`,
                                    ]}
                                    display={consolidation.to_display}
                                  />
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    `No consolidations found`
                  )}
                  {consolidations.length > 1 &&
                    consolidatedWallets.length > 1 && (
                      <div className="pt-2">
                        <h5 className="pt-2 pb-2">Active Consolidation</h5>
                        <div className="d-flex align-items-center">
                          {consolidatedWallets.map((wallet, index) => (
                            <Fragment key={`consolidated-wallets-${index}`}>
                              {areEqualAddresses(
                                fetchedAddress,
                                wallet.address
                              ) ? (
                                <Address
                                  wallets={[wallet.address as `0x${string}`]}
                                  display={wallet.display}
                                />
                              ) : (
                                <span className={styles.supportingAddress}>
                                  <Address
                                    wallets={[wallet.address as `0x${string}`]}
                                    display={wallet.display}
                                  />
                                </span>
                              )}
                              {consolidatedWallets.length - 1 > index && (
                                <FontAwesomeIcon
                                  icon="plus-circle"
                                  className={styles.consolidationPlusIcon}
                                />
                              )}
                            </Fragment>
                          ))}
                          <FontAwesomeIcon
                            icon="check"
                            className={styles.consolidationActiveIcon}
                          />
                        </div>
                      </div>
                    )}
                  {consolidationActions.length > 0 && (
                    <>
                      <div className="pt-2 pb-2 d-flex-align-items-center">
                        <FontAwesomeIcon
                          icon="xmark"
                          className={styles.consolidationRecommendationIcon}
                        />
                        Incomplete Consolidation
                      </div>
                      <div className="pt-2 pb-2">
                        Recommended Actions:
                        <ul className={`${styles.recommendationsList} pt-2`}>
                          {consolidationActions.map((c, index) => (
                            <li
                              key={`consolidated-wallets-${index}`}
                              className="d-flex align-items-center gap-2">
                              &bull;&nbsp;Register Consolidation from{" "}
                              {areEqualAddresses(fetchedAddress, c.to) ? (
                                <Address
                                  wallets={[c.to as `0x${string}`]}
                                  display={c.to_display}
                                />
                              ) : (
                                <span className={styles.supportingAddress}>
                                  <Address
                                    wallets={[c.to as `0x${string}`]}
                                    display={c.to_display}
                                  />
                                </span>
                              )}{" "}
                              to{" "}
                              {areEqualAddresses(fetchedAddress, c.from) ? (
                                <Address
                                  wallets={[c.from as `0x${string}`]}
                                  display={c.from_display}
                                />
                              ) : (
                                <span className={styles.supportingAddress}>
                                  <Address
                                    wallets={[c.from as `0x${string}`]}
                                    display={c.from_display}
                                  />
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </Col>
              </Form.Group>
            )}
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
