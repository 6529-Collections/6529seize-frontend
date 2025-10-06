"use client";

import { publicEnv } from "@/config/env";
import { faFileUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { Consolidation } from "@/entities/IDelegation";
import { areEqualAddresses } from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import styles from "./MappingTool.module.scss";

const csvParser = require("csv-parser");

interface ConsolidationData {
  address: string;
  token_id: number;
  balance: number;
  contract: string;
  name: string;
}

export default function ConsolidationMappingTool() {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const [file, setFile] = useState<any>();
  const [processing, setProcessing] = useState(false);
  const [consolidations, setConsolidations] = useState<Consolidation[]>([]);

  const [csvData, setCsvData] = useState<ConsolidationData[]>([]);
  function submit() {
    setProcessing(true);
  }

  const handleUpload = () => {
    (inputRef.current as any).click();
  };

  const handleDrag = function (e: any) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function (e: any) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  function getForAddress(address: string) {
    const myConsolidations = consolidations.find((c) =>
      c.wallets.some((w) => areEqualAddresses(address, w))
    );
    return myConsolidations;
  }

  function sumForAddresses(
    addresses: string[],
    token_id: number,
    contract: string
  ) {
    const myConsolidations = csvData.filter(
      (d) =>
        addresses.some((a) => areEqualAddresses(a, d.address)) &&
        areEqualAddresses(contract, d.contract) &&
        token_id === d.token_id
    );
    const balance = myConsolidations.reduce((a, b) => a + b.balance, 0);
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
    async function fetchConsolidations(url: string) {
      fetchAllPages(url).then((consolidations: Consolidation[]) => {
        setConsolidations(consolidations);
        const reader = new FileReader();

        reader.onload = async () => {
          const data = reader.result;
          const results: ConsolidationData[] = [];
          let isFirstRow = true;

          const parser = csvParser({ headers: true })
            .on("data", (row: any) => {
              if (isFirstRow) {
                isFirstRow = false;
              } else {
                const address = row["_0"];
                const token_id = parseInt(row["_1"]);
                const balance = parseInt(row["_2"]);
                const contract = row["_3"];
                const name = row["_4"];
                results.push({ address, token_id, balance, contract, name });
              }
            })
            .on("end", () => {
              setCsvData(results);
            })
            .on("error", (err: any) => {
              console.error(err);
            });

          parser.write(data);
          parser.end();
        };

        reader.readAsText(file);
      });
    }
    if (processing) {
      const initialUrl = `${publicEnv.API_ENDPOINT}/api/consolidations`;
      fetchConsolidations(initialUrl);
    }
  }, [processing]);

  useEffect(() => {
    const out: ConsolidationData[] = [];
    if (csvData.length > 0 && consolidations.length > 0) {
      csvData.map((consolidationData) => {
        const addressConsolidations = getForAddress(consolidationData.address);
        if (addressConsolidations) {
          const sum = sumForAddresses(
            addressConsolidations.wallets,
            consolidationData.token_id,
            consolidationData.contract
          );
          if (
            areEqualAddresses(
              consolidationData.address,
              addressConsolidations.primary
            ) ||
            sum === consolidationData.balance
          ) {
            out.push({
              ...consolidationData,
              address: addressConsolidations.primary,
              balance: sum,
            });
          }
        } else {
          out.push(consolidationData);
        }
      });
      downloadCsvFile(out);
      setProcessing(false);
    }
  }, [csvData]);

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
        value={file?.fileName}
        onChange={(e: any) => {
          if (e.target.files) {
            const f = e.target.files[0];
            setFile(f);
          }
        }}
      />
    </Container>
  );
}
