"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { MEMES_CONTRACT } from "@/constants/constants";
import {
  extractAllNumbers,
  formatAddress,
  isValidPositiveInteger,
} from "@/helpers/Helpers";
import { useRef, useState } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";

interface CsvRow {
  address: string;
  count: number;
}

export function AutomaticAirdropsModal(
  props: Readonly<{
    plan: AllowlistDescription;
    show: boolean;
    handleClose(): void;
    confirmedTokenId?: string | null | undefined;
    onUpload(contract: string, tokenId: string, csvContent: string): void;
  }>
) {
  const numbers = extractAllNumbers(props.plan.name);
  const initialTokenId = numbers.length > 0 ? numbers[0]?.toString() : "";
  const defaultTokenId = isValidPositiveInteger(initialTokenId!)
    ? initialTokenId!
    : "";
  const [tokenId, setTokenId] = useState<string>(
    props.confirmedTokenId ?? defaultTokenId
  );
  const displayTokenId = props.confirmedTokenId ?? tokenId;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contract = MEMES_CONTRACT;

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const isValidAddress = (address: string): boolean => {
    return /^0x[a-f0-9]{40}$/i.test(address.trim());
  };

  const isHeaderRow = (line: string): boolean => {
    const parts = line.split(",").map((part) => part.trim().toLowerCase());
    if (parts.length < 2) return false;
    const validFirstCol = parts[0] === "address" || parts[0] === "wallet";
    const validSecondCol = parts[1] === "count" || parts[1] === "value";
    return validFirstCol && validSecondCol;
  };

  const parseCsv = (
    csvContent: string
  ): { rows: CsvRow[]; hadHeader: boolean } => {
    let lines = csvContent.split(/\r?\n/).filter((line) => line.trim());
    const rows: CsvRow[] = [];
    let hadHeader = false;

    const firstLine = lines[0];
    if (firstLine && isHeaderRow(firstLine)) {
      hadHeader = true;
      lines = lines.slice(1);
    }

    const lineOffset = hadHeader ? 2 : 1;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const parts = trimmedLine.split(",").map((part) => part.trim());
      if (parts.length < 2) {
        throw new Error(
          `Line ${
            index + lineOffset
          }: Expected format "address,count" but found "${trimmedLine}"`
        );
      }

      const address = parts[0];
      const countStr = parts[1];

      if (!isValidAddress(address!)) {
        throw new Error(
          `Line ${index + lineOffset}: Invalid Ethereum address "${address}"`
        );
      }

      const count = Number.parseInt(countStr!, 10);
      if (Number.isNaN(count) || count < 0) {
        throw new Error(
          `Line ${
            index + lineOffset
          }: Invalid count "${countStr}". Must be a non-negative integer.`
        );
      }

      rows.push({
        address: address!.toLowerCase(),
        count,
      });
    });

    return { rows, hadHeader };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setParsedRows([]);
      setFileError(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`);
      setSelectedFile(null);
      setParsedRows([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    file
      .text()
      .then((csvContent) => {
        try {
          const { rows } = parseCsv(csvContent);
          setSelectedFile(file);
          setParsedRows(rows);
          setFileError(null);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to parse CSV file";
          setFileError(errorMessage);
          setSelectedFile(null);
          setParsedRows([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      })
      .catch(() => {
        setFileError("Failed to read file");
        setSelectedFile(null);
        setParsedRows([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
  };

  const handleUpload = () => {
    if (!selectedFile || parsedRows.length === 0) {
      setFileError("Please select a valid CSV file");
      return;
    }

    if (!isValidPositiveInteger(displayTokenId)) {
      return;
    }

    const csvContent = parsedRows
      .map((row) => `${row.address},${row.count}`)
      .join("\n");
    props.onUpload(contract, displayTokenId, csvContent);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    props.handleClose();
  };

  return (
    <Modal show={props.show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          Upload Automatic Airdrops
        </Modal.Title>
      </Modal.Header>
      <hr className="mb-0 mt-0" />
      <Modal.Body>
        <Container>
          <Row className="pt-2 pb-2">
            <Col>
              Contract: The Memes - <span>{formatAddress(contract)}</span>
            </Col>
          </Row>
          <Row className="pt-2 pb-2">
            <Col>
              Token ID:{" "}
              {props.confirmedTokenId !== undefined &&
              props.confirmedTokenId !== null ? (
                <span>{displayTokenId}</span>
              ) : (
                <input
                  style={{
                    color: "black",
                    width: "100px",
                  }}
                  min={1}
                  step={1}
                  type="number"
                  value={tokenId}
                  onChange={(e) => {
                    setTokenId(e.target.value);
                  }}
                />
              )}
            </Col>
          </Row>
          <Row className="pt-2 pb-2">
            <Col>
              <div className="alert alert-info mb-2 border border-dark">
                <div className="mb-2">
                  <strong>CSV format:</strong>{" "}
                  <code
                    className="p-1 bg-dark text-light rounded"
                    style={{
                      fontSize: "12px",
                    }}
                  >
                    address,value
                  </code>
                </div>
                <div className="mb-2">
                  <strong>Example:</strong>
                </div>
                <pre
                  className="mb-0 p-2 bg-dark text-light rounded"
                  style={{
                    fontSize: "12px",
                    overflowX: "auto",
                  }}
                >
                  <code>
                    {`0x33FD426905F149f8376e227d0C9D3340AaD17aF1,5
0x9f6ae0370d74f0e591c64cec4a8ae0d627817014,10`}
                  </code>
                </pre>
              </div>
            </Col>
          </Row>
          <Row className="pt-2 pb-2">
            <Col>
              Select CSV File:{" "}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileChange}
                style={{
                  color: "black",
                }}
              />
              {fileError && (
                <div className="mt-2">
                  <div className="text-danger">{fileError}</div>
                </div>
              )}
            </Col>
          </Row>
          {parsedRows.length > 0 && (
            <Row className="pt-2 pb-2">
              <Col>
                <div className="alert alert-success mb-0 border border-dark">
                  ✓ Successfully parsed {parsedRows.length} row(s)
                </div>
              </Col>
            </Row>
          )}
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button
          disabled={
            !isValidPositiveInteger(displayTokenId) ||
            !selectedFile ||
            parsedRows.length === 0
          }
          variant="primary"
          onClick={handleUpload}
        >
          Upload Airdrops
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
