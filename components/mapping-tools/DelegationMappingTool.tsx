"use client";

import {
  DELEGATION_USE_CASES,
  SUPPORTED_COLLECTIONS,
} from "@/components/delegation/delegation-constants";
import { publicEnv } from "@/config/env";
import { DELEGATION_ALL_ADDRESS, MEMES_CONTRACT } from "@/constants";
import { Delegation } from "@/entities/IDelegation";
import { areEqualAddresses } from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import { faFileUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import styles from "./MappingTool.module.scss";

const csvParser = require("csv-parser");

async function parseCsvFile(file: File): Promise<string[]> {
  const data = await file.text();
  return parseCsvContent(data);
}

function parseCsvContent(data: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const results: string[] = [];
    const parser = csvParser({ headers: true })
      .on("data", (row: Record<string, unknown>) => {
        const value = row["_0"];
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            results.push(trimmed);
          }
        }
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (err: any) => {
        reject(err);
      });

    parser.write(data);
    parser.end();
  });
}

export default function DelegationMappingTool() {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const [file, setFile] = useState<File | undefined>();
  const [collection, setCollection] = useState<string>("0");
  const [useCase, setUseCase] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [delegations, setDelegations] = useState<Delegation[]>([]);

  const [csvData, setCsvData] = useState<string[]>([]);
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

  function getForAddress(address: string, collection: string, useCase: number) {
    const myDelegations = delegations.find(
      (d) =>
        areEqualAddresses(address, d.from_address) &&
        areEqualAddresses(collection, d.collection) &&
        useCase === d.use_case
    );
    return myDelegations;
  }

  function resolveDelegatedAddress(address: string): string {
    const fallbackOrder: Array<{ collection: string; useCase: number }> = [
      { collection, useCase },
      { collection, useCase: 1 },
      { collection: MEMES_CONTRACT, useCase },
      { collection: MEMES_CONTRACT, useCase: 1 },
      { collection: DELEGATION_ALL_ADDRESS, useCase },
      { collection: DELEGATION_ALL_ADDRESS, useCase: 1 },
    ];

    for (const option of fallbackOrder) {
      const match = getForAddress(address, option.collection, option.useCase);
      if (match) {
        return match.to_address;
      }
    }

    return address;
  }

  function downloadCsvFile(data: string[]) {
    const csvString = data.map((d) => d.toLowerCase()).join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "output.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    async function fetchDelegations(url: string) {
      try {
        if (!file) {
          throw new Error("No file provided");
        }

        const delegationsResponse = await fetchAllPages<Delegation>(url);
        setDelegations(delegationsResponse);

        const results = await parseCsvFile(file);
        setCsvData(results);
      } catch (error) {
        console.error("Failed to process delegations for mapping tool", error);
        setDelegations([]);
        setProcessing(false);
      }
    }
    if (processing) {
      const useCaseFilter = `&use_case=1,${useCase}`;

      const collectionFilter = `&collection=${DELEGATION_ALL_ADDRESS},${collection}`;
      const initialUrl = `${publicEnv.API_ENDPOINT}/api/delegations?${useCaseFilter}${collectionFilter}`;
      fetchDelegations(initialUrl);
    }
  }, [processing, file, useCase, collection]);

  useEffect(() => {
    if (!processing) {
      return;
    }

    if (csvData.length === 0) {
      setProcessing(false);
      return;
    }

    try {
      const out = csvData.map((address) => resolveDelegatedAddress(address));
      downloadCsvFile(out);
    } catch (error) {
      console.error("Failed to generate CSV output", error);
    } finally {
      setProcessing(false);
    }
  }, [csvData, delegations, processing]);

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
      <Row className="pt-4">
        <Col>Select Collection</Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <Form.Select
            className={`${styles.formInput}`}
            value={collection}
            onChange={(e) => {
              setCollection(e.target.value);
            }}>
            <option value="0" disabled>
              ...
            </option>
            {SUPPORTED_COLLECTIONS.map((sc) => {
              return (
                <option
                  key={`delegation-tool-select-collection-${sc.contract}`}
                  value={sc.contract}>
                  {sc.display}
                </option>
              );
            })}
          </Form.Select>
        </Col>
      </Row>
      <Row className="pt-4">
        <Col>Select Use Case</Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <Form.Select
            className={`${styles.formInput}`}
            value={useCase}
            onChange={(e) => {
              const newCase = Number.parseInt(e.target.value);
              setUseCase(newCase);
            }}>
            <option value={0} disabled>
              ...
            </option>
            {DELEGATION_USE_CASES.map((uc) => {
              return (
                <option
                  key={`delegation-tool-select-use-case-${uc.use_case}`}
                  value={uc.use_case}>
                  #{uc.use_case} - {uc.display}
                </option>
              );
            })}
          </Form.Select>
        </Col>
      </Row>
      <Row className="pt-4">
        <Col className="font-color-h font-smaller">
          Note: If the selected collection or use case delegation is not found,
          the tool will automatically switch to using delegations for
          &quot;Any&quot; or &quot;All&quot; options respectively.
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <Button
            className={`${styles.submitBtn} ${
              useCase === 0 || processing || !file
                ? styles.submitBtnDisabled
                : ""
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
        value={file?.name}
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
