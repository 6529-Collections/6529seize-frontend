"use client";

import { publicEnv } from "@/config/env";
import { Consolidation } from "@/entities/IDelegation";
import { areEqualAddresses } from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import { faFileUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import csvParser from "csv-parser";
import { toast } from "react-toastify";
import styles from "./MappingTool.module.scss";

interface ConsolidationData {
  address: string;
  token_id: number;
  balance: number;
  contract: string;
  name: string;
}

const buildBalanceKey = (
  contract: string,
  tokenId: number,
  address: string
) => `${contract}-${tokenId}-${address}`.toUpperCase();

type ConsolidationLookup = (address: string) => Consolidation | undefined;
type SumForAddresses = (
  addresses: string[],
  token_id: number,
  contract: string
) => number;
type PrimaryKeyBuilder = (
  contract: string,
  tokenId: number,
  primary: string
) => string;

function readFileAsText(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const data = reader.result;
      if (typeof data === "string") {
        resolve(data);
      } else {
        reject(new Error("Unexpected file format"));
      }
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

const csvHeaders = ["address", "token_id", "balance", "contract", "name"];

function normalizeHeader(header: string) {
  const normalized = header
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "tokenid") {
    return "token_id";
  }

  return normalized;
}

async function parseCsvText(csvText: string): Promise<ConsolidationData[]> {
  return new Promise((resolve, reject) => {
    const results: ConsolidationData[] = [];

    const parser = csvParser({
      headers: true,
      mapHeaders: ({ header }: { header: string }) => {
        const normalized = normalizeHeader(header);
        return csvHeaders.includes(normalized) ? normalized : null;
      },
    })
      .on("data", (row: Record<string, unknown>) => {
        const address =
          typeof row.address === "string" ? row.address.trim() : "";
        const contract =
          typeof row.contract === "string" ? row.contract.trim() : "";
        const name = typeof row.name === "string" ? row.name.trim() : "";

        const tokenValue = row.token_id;
        const balanceValue = row.balance;

        const token_id = Number.parseInt(
          typeof tokenValue === "string"
            ? tokenValue.trim()
            : String(tokenValue ?? ""),
          10
        );
        const balance = Number.parseInt(
          typeof balanceValue === "string"
            ? balanceValue.trim()
            : String(balanceValue ?? ""),
          10
        );

        if (
          !address ||
          !contract ||
          !name ||
          Number.isNaN(token_id) ||
          Number.isNaN(balance)
        ) {
          console.warn("Skipping CSV row with missing or invalid fields:", row);
          return;
        }

        results.push({ address, token_id, balance, contract, name });
      })
      .on("end", () => resolve(results))
      .on("error", (error: unknown) => reject(error));

    parser.write(csvText);
    parser.end();
  });
}

async function parseCsvFile(file: File): Promise<ConsolidationData[]> {
  const csvText = await readFileAsText(file);
  return parseCsvText(csvText);
}

function buildMergeTargets(
  entries: ConsolidationData[],
  getConsolidationForAddress: ConsolidationLookup,
  sumAddresses: SumForAddresses,
  primaryKeyFor: PrimaryKeyBuilder
) {
  const mergeTargets = new Map<string, ConsolidationData>();

  for (const entry of entries) {
    const addressConsolidations = getConsolidationForAddress(entry.address);
    if (!addressConsolidations) {
      continue;
    }

    const sum = sumAddresses(
      addressConsolidations.wallets,
      entry.token_id,
      entry.contract
    );

    const canMergePrimary =
      areEqualAddresses(entry.address, addressConsolidations.primary) ||
      // Some rows may already contain the consolidated total; allow those to merge directly.
      sum === entry.balance;

    if (!canMergePrimary) {
      continue;
    }

    const primaryKey = primaryKeyFor(
      entry.contract,
      entry.token_id,
      addressConsolidations.primary
    );

    if (!mergeTargets.has(primaryKey)) {
      mergeTargets.set(primaryKey, {
        ...entry,
        address: addressConsolidations.primary,
        balance: sum,
      });
    }
  }

  return mergeTargets;
}

function buildNormalizedOutput(
  entries: ConsolidationData[],
  getConsolidationForAddress: ConsolidationLookup,
  primaryKeyFor: PrimaryKeyBuilder,
  mergeTargets: Map<string, ConsolidationData>
) {
  const emittedPrimaryKeys = new Set<string>();
  const normalizedOutput: ConsolidationData[] = [];

  for (const entry of entries) {
    const addressConsolidations = getConsolidationForAddress(entry.address);
    if (!addressConsolidations) {
      normalizedOutput.push(entry);
      continue;
    }

    const primaryKey = primaryKeyFor(
      entry.contract,
      entry.token_id,
      addressConsolidations.primary
    );

    const mergedEntry = mergeTargets.get(primaryKey);
    if (mergedEntry) {
      if (!emittedPrimaryKeys.has(primaryKey)) {
        normalizedOutput.push(mergedEntry);
        emittedPrimaryKeys.add(primaryKey);
      }
      continue;
    }

    normalizedOutput.push(entry);
  }

  return normalizedOutput;
}

export default function ConsolidationMappingTool() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [consolidations, setConsolidations] = useState<Consolidation[]>([]);

  const [csvData, setCsvData] = useState<ConsolidationData[]>([]);

  const balanceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const data of csvData) {
      const key = buildBalanceKey(data.contract, data.token_id, data.address);
      map.set(key, (map.get(key) ?? 0) + data.balance);
    }
    return map;
  }, [csvData]);

  const consolidationMap = useMemo(() => {
    const map = new Map<string, Consolidation>();
    for (const consolidation of consolidations) {
      for (const wallet of consolidation.wallets) {
        map.set(wallet.toUpperCase(), consolidation);
      }
    }
    return map;
  }, [consolidations]);

  function submit() {
    if (!file) {
      toast.warning("Please upload a CSV file before submitting.");
      return;
    }
    setProcessing(true);
  }

  const handleUpload = () => {
    inputRef.current?.click();
  };

  const handleDrag = function (event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function (event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const droppedFile = event.dataTransfer?.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  function downloadCsvFile(data: ConsolidationData[]) {
    const csvHeader = "address,token_id,balance,contract,name";
    const escapeValue = (value: string | number) => {
      const str = String(value);
      return `"${str.replaceAll('"', '""')}"`;
    };

    const csvData = data.map((d) => {
      return [
        escapeValue(d.address),
        escapeValue(d.token_id),
        escapeValue(d.balance),
        escapeValue(d.contract),
        escapeValue(d.name),
      ].join(",");
    });
    const csvString = `${csvHeader}\n${csvData.join("\n")}`;

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "consolidation_output.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (!processing || !file) {
      return;
    }

    let isMounted = true;
    const initialUrl = `${publicEnv.API_ENDPOINT}/api/consolidations`;

    const fetchAndParseConsolidations = async () => {
      try {
        const fetchedConsolidations = await fetchAllPages<Consolidation>(
          initialUrl
        );
        if (!isMounted) {
          return;
        }
        setConsolidations(fetchedConsolidations);

        const parsedCsv = await parseCsvFile(file);
        if (!isMounted) {
          return;
        }
        setCsvData(parsedCsv);

        if (parsedCsv.length === 0 || fetchedConsolidations.length === 0) {
          if (!isMounted) {
            return;
          }
          const message =
            parsedCsv.length === 0
              ? "The CSV file contains no valid data rows."
              : "No consolidations found to process.";
          toast.warning(message);
          setProcessing(false);
        }
      } catch (error) {
        console.error("Failed to fetch consolidations for mapping tool", error);
        if (!isMounted) {
          return;
        }
        toast.error(
          "Unable to process the CSV. Please verify the file and try again."
        );
        setConsolidations([]);
        setCsvData([]);
        setProcessing(false);
      }
    };

    void fetchAndParseConsolidations();

    return () => {
      isMounted = false;
    };
  }, [processing, file]);

  useEffect(() => {
    if (!processing) {
      return;
    }

    if (csvData.length === 0 || consolidations.length === 0) {
      // Waiting for data to finish loading; the fetch/parse effect will handle
      // empty results and clear processing state.
      return;
    }

    const getForAddress: ConsolidationLookup = (address: string) => {
      return consolidationMap.get(address.toUpperCase());
    };

    const sumForAddresses: SumForAddresses = (
      addresses: string[],
      token_id: number,
      contract: string
    ) => {
      let balance = 0;

      for (const address of addresses) {
        const key = buildBalanceKey(contract, token_id, address);
        balance += balanceMap.get(key) ?? 0;
      }

      return balance;
    };

    try {
      const primaryKeyFor = (
        contract: string,
        tokenId: number,
        primary: string
      ) => buildBalanceKey(contract, tokenId, primary);

      const mergeTargets = buildMergeTargets(
        csvData,
        getForAddress,
        sumForAddresses,
        primaryKeyFor
      );
      const normalizedOutput = buildNormalizedOutput(
        csvData,
        getForAddress,
        primaryKeyFor,
        mergeTargets
      );
      downloadCsvFile(normalizedOutput);
    } catch (error) {
      console.error("Failed to generate CSV output", error);
      toast.error(
        "Unable to generate the consolidated CSV. Please try again later."
      );
    } finally {
      setProcessing(false);
    }
  }, [csvData, consolidations, processing]);

  return (
    <Container className={styles.toolArea} id="mapping-tool-form">
      <Row>
        <Col>
          Upload File <span className="font-color-h">(.csv)</span>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <Container
            className={`${styles.uploadArea} ${
              dragActive ? styles.uploadAreaActive : ""
            }`}
            onClick={handleUpload}
            onDrop={handleDrop}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}>
            <div>
              <FontAwesomeIcon
                icon={faFileUpload}
                className={styles.uploadIcon}
              />
            </div>
            {file ? (
              <div>{file.name}</div>
            ) : (
              <div>Drag and drop your file here, or click to upload</div>
            )}
          </Container>
        </Col>
      </Row>
      {/* <Row className="pt-4">
        <Col className="font-color-h font-smaller">
          Note: If the selected collection or use case delegation is not found,
          the tool will automatically switch to using delegations for
          &quot;Any&quot; or &quot;All&quot; options respectively.
        </Col>
      </Row> */}
      <Row className="pt-3">
        <Col>
          <Button
            className={`${styles.submitBtn} ${
              processing || !file ? styles.submitBtnDisabled : ""
            }`}
            onClick={() => submit()}>
            {processing ? "Processing" : "Submit"}
            {processing && (
              <div className="d-inline">
                <div
                  className={`spinner-border ${styles.loader}`}
                  role="status">
                  <span className="sr-only">Processing CSV file...</span>
                </div>
              </div>
            )}
          </Button>
        </Col>
      </Row>
      <Form.Control
        ref={inputRef}
        className={`${styles.formInputHidden}`}
        type="file"
        accept=".csv"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const selectedFile = event.target.files?.[0];
          if (selectedFile) {
            setFile(selectedFile);
          }
        }}
      />
    </Container>
  );
}
