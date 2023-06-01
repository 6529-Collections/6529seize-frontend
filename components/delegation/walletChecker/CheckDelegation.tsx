import styles from "./WalletChecker.module.scss";
import { useState, useEffect } from "react";
import { Form, Row, Col, Button, Table } from "react-bootstrap";
import { useEnsName, useEnsAddress } from "wagmi";
import { areEqualAddresses, isValidEthAddress } from "../../../helpers/Helpers";
import { DBResponse } from "../../../entities/IDBResponse";
import { Delegation, WalletConsolidation } from "../../../entities/IDelegation";
import { fetchUrl } from "../../../services/6529api";
import { NEVER_DATE } from "../../../constants";
import Address from "../../address/Address";
import {
  ALL_USE_CASES,
  SUB_DELEGATION_USE_CASE,
} from "../../../pages/delegation/[...section]";
import { SUPPORTED_COLLECTIONS } from "../../../pages/delegation/[...section]";

export interface ConsolidationDisplay {
  from: string;
  from_display: string | undefined;
  to: string;
  to_display: string | undefined;
}

export default function CheckDelegation() {
  const [fetchedAddress, setFetchedAddress] = useState<string>("");
  const [walletInput, setWalletInput] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const [checking, setChecking] = useState(false);
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
          (d) => d.use_case == SUB_DELEGATION_USE_CASE.use_case
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
      console.log("myConsolidatedWallets", myConsolidatedWallets);
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
    const resolved = ALL_USE_CASES.find((u) => u.use_case == useCase);
    return resolved ? `#${useCase} - ${resolved.display}` : `#${useCase}`;
  }

  function getCollectionDisplay(collection: string) {
    const resolved = SUPPORTED_COLLECTIONS.find((sc) =>
      areEqualAddresses(sc.contract, collection)
    );
    return resolved ? resolved.title : collection;
  }

  useEffect(() => {
    if (checking) {
      if (!walletAddress || !isValidEthAddress(walletAddress)) {
        setAddressError(true);
        setChecking(false);
        return;
      } else {
        setAddressError(false);
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

  return (
    <Form>
      <Form.Group as={Row}>
        <Form.Label column sm={12} className="d-flex align-items-center">
          Wallet Address
        </Form.Label>
        <Col sm={12}>
          <Form.Control
            disabled={checking}
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
        <Col sm={12}>
          <Button
            disabled={checking || !walletAddress}
            onClick={() => setChecking(true)}
            className={styles.checkBtn}>
            {checking ? `Checking...` : `Check`}
          </Button>
        </Col>
      </Form.Group>
      {delegationsLoaded && (
        <>
          <Form.Group as={Row} className="pt-3">
            <Col sm={12}>
              <h5 className="pt-2 pb-2 float-none">
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
                            <span className={styles.selectedAddress}>
                              <Address
                                wallets={[
                                  delegation.from_address as `0x${string}`,
                                ]}
                                display={delegation.from_display}
                              />
                            </span>
                          ) : (
                            <Address
                              wallets={[
                                delegation.from_address as `0x${string}`,
                              ]}
                              display={delegation.from_display}
                            />
                          )}
                        </td>
                        <td>
                          {areEqualAddresses(
                            fetchedAddress,
                            delegation.to_address
                          ) ? (
                            <span className={styles.selectedAddress}>
                              <Address
                                wallets={[
                                  delegation.to_address as `0x${string}`,
                                ]}
                                display={delegation.to_display}
                              />
                            </span>
                          ) : (
                            <Address
                              wallets={[delegation.to_address as `0x${string}`]}
                              display={delegation.to_display}
                            />
                          )}
                        </td>
                        <td>{getCollectionDisplay(delegation.collection)}</td>
                        <td>{getUseCaseDisplay(delegation.use_case)}</td>
                        <td className="text-center">
                          {delegation.all_tokens ? `All` : delegation.token_id}
                        </td>
                        <td className="text-center">
                          {delegation.expiry == NEVER_DATE
                            ? `Never`
                            : delegation.expiry}
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
          <Form.Group as={Row} className="pt-3">
            <Col sm={12}>
              <h5 className="pt-2 pb-2 float-none">
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
                    {delegations.map((delegation, index) => (
                      <tr key={`delegations-${index}`}>
                        <td>
                          {areEqualAddresses(
                            fetchedAddress,
                            delegation.from_address
                          ) ? (
                            <span className={styles.selectedAddress}>
                              <Address
                                wallets={[
                                  delegation.from_address as `0x${string}`,
                                ]}
                                display={delegation.from_display}
                              />
                            </span>
                          ) : (
                            <Address
                              wallets={[
                                delegation.from_address as `0x${string}`,
                              ]}
                              display={delegation.from_display}
                            />
                          )}
                        </td>
                        <td>
                          {areEqualAddresses(
                            fetchedAddress,
                            delegation.to_address
                          ) ? (
                            <span className={styles.selectedAddress}>
                              <Address
                                wallets={[
                                  delegation.to_address as `0x${string}`,
                                ]}
                                display={delegation.to_display}
                              />
                            </span>
                          ) : (
                            <Address
                              wallets={[delegation.to_address as `0x${string}`]}
                              display={delegation.to_display}
                            />
                          )}
                        </td>
                        <td>{getCollectionDisplay(delegation.collection)}</td>
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
        <Form.Group as={Row} className="pt-3">
          <Col sm={12}>
            <h5 className="pt-2 pb-2 float-none">
              Consolidations ({consolidations.length})
            </h5>
            {consolidations.length > 0 ? (
              <Table>
                <thead className="mb-2">
                  <tr>
                    <th>From</th>
                    <th>To</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidations.map((consolidation, index) => (
                    <tr key={`consolidations-${index}`}>
                      <td>
                        {areEqualAddresses(
                          fetchedAddress,
                          consolidation.from
                        ) ? (
                          <span className={styles.selectedAddress}>
                            <Address
                              wallets={[consolidation.from as `0x${string}`]}
                              display={consolidation.from_display}
                            />
                          </span>
                        ) : (
                          <Address
                            wallets={[consolidation.from as `0x${string}`]}
                            display={consolidation.from_display}
                          />
                        )}
                      </td>
                      <td>
                        {areEqualAddresses(fetchedAddress, consolidation.to) ? (
                          <span className={styles.selectedAddress}>
                            <Address
                              wallets={[consolidation.to as `0x${string}`]}
                              display={consolidation.to_display}
                            />
                          </span>
                        ) : (
                          <Address
                            wallets={[consolidation.to as `0x${string}`]}
                            display={consolidation.to_display}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              `No consolidations found`
            )}
            {consolidations.length > 0 && consolidatedWallets.length > 0 && (
              <div className="pt-2">
                TDH Consolidation:
                <ul className="pt-2">
                  {consolidatedWallets.length > 1 ? (
                    consolidatedWallets.map((wallet, index) => (
                      <li key={`consolidated-wallets-${index}`}>
                        {areEqualAddresses(fetchedAddress, wallet.address) ? (
                          <span className={styles.selectedAddress}>
                            <Address
                              wallets={[wallet.address as `0x${string}`]}
                              display={wallet.display}
                            />
                          </span>
                        ) : (
                          <Address
                            wallets={[wallet.address as `0x${string}`]}
                            display={wallet.display}
                          />
                        )}
                      </li>
                    ))
                  ) : (
                    <li>No TDH consolidations found</li>
                  )}
                </ul>
              </div>
            )}
            {consolidationActions.length > 0 && (
              <div className="pt-2">
                Recommended Actions:
                <ul className="pt-2">
                  {consolidationActions.map((c, index) => (
                    <li key={`consolidated-wallets-${index}`}>
                      Register Consolidation from{" "}
                      {areEqualAddresses(fetchedAddress, c.to) ? (
                        <span className={styles.selectedAddress}>
                          <Address
                            wallets={[c.to as `0x${string}`]}
                            display={c.to_display}
                          />
                        </span>
                      ) : (
                        <Address
                          wallets={[c.to as `0x${string}`]}
                          display={c.to_display}
                        />
                      )}{" "}
                      to{" "}
                      {areEqualAddresses(fetchedAddress, c.from) ? (
                        <span className={styles.selectedAddress}>
                          <Address
                            wallets={[c.from as `0x${string}`]}
                            display={c.from_display}
                          />
                        </span>
                      ) : (
                        <Address
                          wallets={[c.from as `0x${string}`]}
                          display={c.from_display}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Col>
        </Form.Group>
      )}
    </Form>
  );
}
