"use client";

import {
  faCheck,
  faPlusCircle,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Form, Row, Table } from "react-bootstrap";

import Address from "@/components/address/Address";
import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";
import { publicEnv } from "@/config/env";
import {
  DELEGATION_ALL_ADDRESS,
  MEMES_CONTRACT,
  NEVER_DATE,
} from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Delegation, WalletConsolidation } from "@/entities/IDelegation";
import { areEqualAddresses, isValidEthAddress } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";

import {
  ALL_USE_CASES,
  MINTING_USE_CASE,
  SUB_DELEGATION_USE_CASE,
  SUPPORTED_COLLECTIONS,
} from "../delegation-constants";

import styles from "./WalletChecker.module.scss";

interface ConsolidationDisplay {
  from: string;
  from_display: string | undefined;
  to: string;
  to_display: string | undefined;
}

function resolveConsolidationDisplay(
  wallet: string,
  candidates: ConsolidationDisplay[]
): string | undefined {
  let fallback: string | undefined;

  for (const candidate of candidates) {
    if (areEqualAddresses(candidate.from, wallet)) {
      return candidate.from_display;
    }

    if (!fallback && areEqualAddresses(candidate.to, wallet)) {
      fallback = candidate.to_display;
    }
  }

  return fallback;
}

export default function WalletCheckerComponent(
  props: Readonly<{
    address_query: string;
    setAddressQuery(address: string): any;
  }>
) {
  const { address_query, setAddressQuery } = props;

  const [fetchedAddress, setFetchedAddress] = useState<string>("");
  const [walletInputValue, setWalletInputValue] = useState(address_query ?? "");
  const [walletAddress, setWalletAddress] = useState("");
  const [ensLoading, setEnsLoading] = useState(false);

  const [checking, setChecking] = useState(!!address_query);
  const [addressError, setAddressError] = useState(false);

  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [subDelegations, setSubDelegations] = useState<Delegation[]>([]);
  const [delegationsLoaded, setDelegationsLoaded] = useState(false);

  const [consolidations, setConsolidations] = useState<ConsolidationDisplay[]>(
    []
  );
  const [consolidatedWallets, setConsolidatedWallets] = useState<
    { address: string; display: string | undefined }[]
  >([]);
  const [consolidationsLoaded, setConsolidationsLoaded] = useState(false);

  const shouldFetchDelegations = checking && isValidEthAddress(walletAddress);

  const { data: delegationsResponse, status: delegationsStatus } =
    useQuery<DBResponse>({
      queryKey: ["delegations", walletAddress],
      queryFn: async () => {
        try {
          const url = `${publicEnv.API_ENDPOINT}/api/delegations/${walletAddress}`;
          return await fetchUrl(url);
        } catch (error) {
          console.error(
            `Failed to fetch delegations for ${walletAddress}`,
            error
          );
          throw error;
        }
      },
      enabled: shouldFetchDelegations,
      refetchOnWindowFocus: false,
    });

  useEffect(() => {
    if (delegationsStatus === "success" && delegationsResponse) {
      const allDelegations = Array.isArray(delegationsResponse.data)
        ? (delegationsResponse.data as Delegation[])
        : [];
      setDelegations(
        allDelegations.filter(
          (delegation) =>
            delegation.use_case !== SUB_DELEGATION_USE_CASE.use_case
        )
      );
      setSubDelegations(
        allDelegations.filter(
          (delegation) =>
            delegation.use_case === SUB_DELEGATION_USE_CASE.use_case
        )
      );
      setDelegationsLoaded(true);
      return;
    }

    if (delegationsStatus === "error") {
      setDelegations([]);
      setSubDelegations([]);
      setDelegationsLoaded(true);
    }
  }, [delegationsStatus, delegationsResponse]);

  const setAllConsolidations = useCallback(
    (nextConsolidations: WalletConsolidation[]) => {
      const normalized: ConsolidationDisplay[] = [];

      for (const consolidation of nextConsolidations) {
        const primary: ConsolidationDisplay = {
          from: consolidation.wallet1,
          from_display: consolidation.wallet1_display,
          to: consolidation.wallet2,
          to_display: consolidation.wallet2_display,
        };

        if (
          !normalized.some(
            (existing) =>
              areEqualAddresses(existing.from, primary.from) &&
              areEqualAddresses(existing.to, primary.to)
          )
        ) {
          normalized.push(primary);
        }

        if (consolidation.confirmed) {
          const reciprocal: ConsolidationDisplay = {
            from: consolidation.wallet2,
            from_display: consolidation.wallet2_display,
            to: consolidation.wallet1,
            to_display: consolidation.wallet1_display,
          };

          if (
            !normalized.some(
              (existing) =>
                areEqualAddresses(existing.from, reciprocal.from) &&
                areEqualAddresses(existing.to, reciprocal.to)
            )
          ) {
            normalized.push(reciprocal);
          }
        }
      }

      setConsolidations(normalized);
      setConsolidationsLoaded(true);
    },
    []
  );

  const { data: consolidationsResponse, status: consolidationsStatus } =
    useQuery<WalletConsolidation[]>({
      queryKey: ["consolidations", walletAddress],
      queryFn: async () => {
        try {
          const baseUrl = `${publicEnv.API_ENDPOINT}/api/consolidations/${walletAddress}?show_incomplete=true`;
          const firstResponse: DBResponse<WalletConsolidation> =
            await fetchUrl(baseUrl);
          const firstData = firstResponse.data;

          if (firstData.length > 0) {
            const newWallet = areEqualAddresses(
              walletAddress,
              firstData[0]?.wallet1
            )
              ? firstData[0]?.wallet2
              : firstData[0]?.wallet1;
            const nextUrl = `${publicEnv.API_ENDPOINT}/api/consolidations/${newWallet}?show_incomplete=true`;
            try {
              const secondResponse: DBResponse<WalletConsolidation> =
                await fetchUrl(nextUrl);
              return [...firstData, ...secondResponse.data];
            } catch {
              console.error(
                `Failed to fetch consolidations for related wallet: ${newWallet}`
              );
              return firstData;
            }
          }

          return firstData;
        } catch (error) {
          console.error(
            `Failed to fetch consolidations for ${walletAddress}`,
            error
          );
          throw error;
        }
      },
      enabled: shouldFetchDelegations,
      refetchOnWindowFocus: false,
    });

  useEffect(() => {
    if (consolidationsStatus === "success" && consolidationsResponse) {
      setAllConsolidations(consolidationsResponse);
      return;
    }

    if (consolidationsStatus === "error") {
      setConsolidations([]);
      setConsolidationsLoaded(true);
    }
  }, [consolidationsStatus, consolidationsResponse, setAllConsolidations]);

  const {
    refetch: refetchConsolidatedWalletsRaw,
    data: consolidatedWalletsResponse,
    status: consolidatedWalletsStatus,
  } = useQuery<{ address: string; display: string | undefined }[]>({
    queryKey: ["consolidated-wallets", fetchedAddress],
    queryFn: async () => {
      try {
        const url = `${publicEnv.API_ENDPOINT}/api/consolidations/${fetchedAddress}`;
        const response: DBResponse<string> = await fetchUrl(url);
        const wallets = response.data;

        const mappedWallets: {
          address: string;
          display: string | undefined;
        }[] = [];

        for (const wallet of wallets) {
          mappedWallets.push({
            address: wallet,
            display: resolveConsolidationDisplay(wallet, consolidations),
          });
        }

        return mappedWallets;
      } catch (error) {
        console.error(
          `Failed to fetch consolidated wallets for ${fetchedAddress}`,
          error
        );
        throw error;
      }
    },
    enabled: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (
      consolidatedWalletsStatus === "success" &&
      consolidatedWalletsResponse
    ) {
      setConsolidatedWallets(consolidatedWalletsResponse);
      return;
    }

    if (consolidatedWalletsStatus === "error") {
      setConsolidatedWallets([]);
    }
  }, [consolidatedWalletsStatus, consolidatedWalletsResponse]);

  const refetchConsolidatedWallets = refetchConsolidatedWalletsRaw;

  const activeDelegation = useMemo(() => {
    if (!delegationsLoaded) {
      return undefined;
    }

    const searchTargets: Array<[string, string, number]> = [
      [walletAddress, MEMES_CONTRACT, MINTING_USE_CASE.use_case],
      [walletAddress, MEMES_CONTRACT, 1],
      [walletAddress, DELEGATION_ALL_ADDRESS, MINTING_USE_CASE.use_case],
      [walletAddress, DELEGATION_ALL_ADDRESS, 1],
    ];

    for (const [address, collection, useCase] of searchTargets) {
      const match = delegations.find(
        (delegation) =>
          areEqualAddresses(address, delegation.from_address) &&
          areEqualAddresses(collection, delegation.collection) &&
          delegation.use_case === useCase
      );

      if (match) {
        return match;
      }
    }

    return undefined;
  }, [delegationsLoaded, delegations, walletAddress]);

  const consolidationActions = useMemo<ConsolidationDisplay[]>(() => {
    if (!consolidationsLoaded) {
      return [];
    }

    return consolidations.filter(
      (candidate) =>
        !consolidations.some(
          (comparison) =>
            areEqualAddresses(comparison.to, candidate.from) &&
            areEqualAddresses(comparison.from, candidate.to)
        )
    );
  }, [consolidationsLoaded, consolidations]);

  useEffect(() => {
    if (!consolidationsLoaded || !fetchedAddress) {
      return;
    }

    if (!consolidations.length) {
      setConsolidatedWallets([]);
      return;
    }

    refetchConsolidatedWallets().catch((error) => {
      console.error("Failed to refetch consolidated wallets", error);
    });
  }, [
    consolidationsLoaded,
    consolidations,
    fetchedAddress,
    refetchConsolidatedWallets,
  ]);

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
    if (!checking) {
      return;
    }

    if (ensLoading) {
      return;
    }

    if (!walletAddress || !isValidEthAddress(walletAddress)) {
      setFetchedAddress("");
      setDelegations([]);
      setDelegationsLoaded(false);
      setConsolidations([]);
      setConsolidationsLoaded(false);
      setConsolidatedWallets([]);
      setAddressError(true);
      setChecking(false);
      return;
    }

    setAddressQuery(walletAddress);
    setAddressError(false);
    setFetchedAddress(walletAddress);
    setDelegationsLoaded(false);
    setDelegations([]);
    setConsolidationsLoaded(false);
    setConsolidations([]);
    setConsolidatedWallets([]);
  }, [checking, walletAddress, ensLoading, setAddressQuery]);

  useEffect(() => {
    if (delegationsLoaded && consolidationsLoaded) {
      setChecking(false);
    }
  }, [delegationsLoaded, consolidationsLoaded]);

  const formDisabled =
    checking ||
    !walletAddress ||
    (!isValidEthAddress(walletAddress) && !walletAddress.endsWith(".eth")) ||
    ensLoading;

  return (
    <Container className="pt-3 pb-3">
      <Row>
        <Col>
          <h1>Wallet Checker</h1>
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
            }}
          >
            <Form.Group as={Row}>
              <Form.Label column sm={12} className="d-flex align-items-center">
                Wallet Address
              </Form.Label>
              <Col sm={12}>
                <EnsAddressInput
                  disabled={delegationsLoaded || consolidationsLoaded}
                  autoFocus
                  placeholder="0x... or ENS"
                  className={styles["formInput"] ?? ""}
                  value={walletInputValue}
                  onAddressChange={(addr) => {
                    setWalletAddress(addr);
                    setAddressError(false);
                  }}
                  onLoadingChange={setEnsLoading}
                  onError={setAddressError}
                />
              </Col>
            </Form.Group>
            {addressError && (
              <Form.Group as={Row}>
                <Form.Text className={styles["error"]}>
                  Invalid address
                </Form.Text>
              </Form.Group>
            )}
            <Form.Group as={Row} className="pt-3 text-center">
              <Col
                sm={12}
                className="d-flex align-items-center justify-content-center gap-3"
              >
                <Button
                  onClick={() => {
                    setWalletInputValue("");
                    setWalletAddress("");
                    setDelegationsLoaded(false);
                    setDelegations([]);
                    setConsolidationsLoaded(false);
                    setConsolidations([]);
                    setChecking(false);
                    setAddressQuery("");
                  }}
                  className={styles["clearBtn"]}
                >
                  Clear
                </Button>
                <Button
                  disabled={formDisabled}
                  onClick={() => setChecking(true)}
                  className={styles["checkBtn"]}
                >
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
                                  <span className={styles["supportingAddress"]}>
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
                                  <span className={styles["supportingAddress"]}>
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
                        icon={faCheck}
                        className={styles["activeDelegationIcon"]}
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
                                  <span className={styles["supportingAddress"]}>
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
                                  <span className={styles["supportingAddress"]}>
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
                                <span className={styles["supportingAddress"]}>
                                  <Address
                                    wallets={[
                                      consolidation.from as `0x${string}`,
                                    ]}
                                    display={consolidation.from_display}
                                  />
                                </span>
                              )}
                              <span className="d-inline-flex align-items-center justify-content-center">
                                <span className={styles["arrowBody"]}></span>
                                <span className={styles["arrowHead"]}></span>
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
                                <span className={styles["supportingAddress"]}>
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
                                <span className={styles["supportingAddress"]}>
                                  <Address
                                    wallets={[wallet.address as `0x${string}`]}
                                    display={wallet.display}
                                  />
                                </span>
                              )}
                              {consolidatedWallets.length - 1 > index && (
                                <FontAwesomeIcon
                                  icon={faPlusCircle}
                                  className={styles["consolidationPlusIcon"]}
                                />
                              )}
                            </Fragment>
                          ))}
                          <FontAwesomeIcon
                            icon={faCheck}
                            className={styles["consolidationActiveIcon"]}
                          />
                        </div>
                      </div>
                    )}
                  {consolidationActions.length > 0 && (
                    <>
                      <div className="pt-2 pb-2 d-flex-align-items-center">
                        <FontAwesomeIcon
                          icon={faXmark}
                          className={styles["consolidationRecommendationIcon"]}
                        />
                        Incomplete Consolidation
                      </div>
                      <div className="pt-2 pb-2">
                        Recommended Actions:
                        <ul className={`${styles["recommendationsList"]} pt-2`}>
                          {consolidationActions.map((c, index) => (
                            <li
                              key={`consolidated-wallets-${index}`}
                              className="d-flex align-items-center gap-2"
                            >
                              &bull;&nbsp;Register Consolidation from{" "}
                              {areEqualAddresses(fetchedAddress, c.to) ? (
                                <Address
                                  wallets={[c.to as `0x${string}`]}
                                  display={c.to_display}
                                />
                              ) : (
                                <span className={styles["supportingAddress"]}>
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
                                <span className={styles["supportingAddress"]}>
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
