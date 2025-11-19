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
  useRef,
  useState,
} from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import styles from "./MappingTool.module.scss";

const csvParser = require("csv-parser");

interface ConsolidationData {
  address: string;
  token_id: number;
  balance: number;
  contract: string;
  name: string;
}

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

function parseCsvText(csvText: string): Promise<ConsolidationData[]> {
  return new Promise<ConsolidationData[]>((resolve, reject) => {
    const results: ConsolidationData[] = [];
    let isFirstRow = true;

    const parser = csvParser({ headers: false })
      .on("data", (row: any) => {
        // Skip header row
        if (isFirstRow) {
          isFirstRow = false;
          return;
        }

        const address = row[0];
        const token_id = Number.parseInt(row[1], 10);
        const balance = Number.parseInt(row[2], 10);
        const contract = row[3];
        const name = row[4];

        // Validate numeric fields
        if (Number.isNaN(token_id) || Number.isNaN(balance)) {
          console.warn("Skipping invalid CSV row:", row);
          return;
        }

        results.push({ address, token_id, balance, contract, name });
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (err: any) => {
        reject(err);
      });

    parser.write(csvText);
    parser.end();
  });
}

async function parseCsvFile(file: File): Promise<ConsolidationData[]> {
  const csvText = await readFileAsText(file);
  return parseCsvText(csvText);
}

export default function ConsolidationMappingTool() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [consolidations, setConsolidations] = useState<Consolidation[]>([]);

  const [csvData, setCsvData] = useState<ConsolidationData[]>([]);
  function submit() {
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
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles && droppedFiles[0]) {
      setFile(droppedFiles[0]);
    }
  };

  function getForAddress(address: string) {
    for (const consolidation of consolidations) {
      for (const wallet of consolidation.wallets) {
        if (areEqualAddresses(address, wallet)) {
          return consolidation;
        }
      }
    }
    return undefined;
  }

  function sumForAddresses(
    addresses: string[],
    token_id: number,
    contract: string
  ) {
    let balance = 0;

    for (const data of csvData) {
      const isMatchingToken =
        areEqualAddresses(contract, data.contract) &&
        token_id === data.token_id;
      if (!isMatchingToken) {
        continue;
      }

      for (const address of addresses) {
        if (areEqualAddresses(address, data.address)) {
          balance += data.balance;
          break;
        }
      }
    }

    return balance;
  }

  function downloadCsvFile(data: ConsolidationData[]) {
    const csvHeader = "address,token_id,balance,contract,name";
    const csvData = data.map((d) => {
      return `${d.address},${d.token_id},${d.balance},${d.contract},${d.name}`;
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
  }

  useEffect(() => {
    if (!processing || !file) {
      return;
    }

    const initialUrl = `${publicEnv.API_ENDPOINT}/api/consolidations`;

    const fetchAndParseConsolidations = async () => {
      try {
        const fetchedConsolidations = await fetchAllPages<Consolidation>(
          initialUrl
        );
        setConsolidations(fetchedConsolidations);

        const parsedCsv = await parseCsvFile(file);
        setCsvData(parsedCsv);

        if (parsedCsv.length === 0 || fetchedConsolidations.length === 0) {
          setProcessing(false);
        }
      } catch (error) {
        console.error("Failed to fetch consolidations for mapping tool", error);
        toast.error(
          "Unable to process the CSV. Please verify the file and try again."
        );
        setConsolidations([]);
        setCsvData([]);
        setProcessing(false);
      }
    };

    void fetchAndParseConsolidations();
  }, [processing, file]);

  useEffect(() => {
    if (!processing) {
      return;
    }

    if (csvData.length === 0 || consolidations.length === 0) {
      setProcessing(false);
      return;
    }

    const normalizeEntry = (
      consolidationData: ConsolidationData
    ): ConsolidationData => {
      const addressConsolidations = getForAddress(consolidationData.address);
      if (!addressConsolidations) {
        return consolidationData;
      }

      const sum = sumForAddresses(
        addressConsolidations.wallets,
        consolidationData.token_id,
        consolidationData.contract
      );

      const canMergePrimary =
        areEqualAddresses(
          consolidationData.address,
          addressConsolidations.primary
        ) || sum === consolidationData.balance;

      if (!canMergePrimary) {
        return consolidationData;
      }

      return {
        ...consolidationData,
        address: addressConsolidations.primary,
        balance: sum,
      };
    };

    try {
      const normalizedOutput = csvData.map(normalizeEntry);
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
                  <span className="sr-only"></span>
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
          if (event.target.files) {
            const f = event.target.files[0];
            setFile(f);
          }
        }}
      />
    </Container>
  );
}
