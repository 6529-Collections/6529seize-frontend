"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { MEMES_CONTRACT } from "@/constants/constants";
import {
  extractAllNumbers,
  formatAddress,
  isValidPositiveInteger,
} from "@/helpers/Helpers";
import { type ChangeEvent, useRef, useState } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";

export type DistributionAirdropsPhase = "artist" | "team";

interface CsvRow {
  address: string;
  count: number;
}

const PHASE_COPY: Record<
  DistributionAirdropsPhase,
  {
    title: string;
    submitLabel: string;
    successLabel: string;
  }
> = {
  artist: {
    title: "Upload Artist Airdrops",
    submitLabel: "Upload Artist Airdrops",
    successLabel: "artist",
  },
  team: {
    title: "Upload Team Airdrops",
    submitLabel: "Upload Team Airdrops",
    successLabel: "team",
  },
};

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Invalid CSV content";
}

function isValidAddress(address: string): boolean {
  return /^0x[a-f0-9]{40}$/i.test(address.trim());
}

function isHeaderRow(line: string): boolean {
  const parts = line.split(",").map((part) => part.trim().toLowerCase());
  return parts.length === 2 && parts[0] === "address" && parts[1] === "count";
}

function parseCsv(csvContent: string): CsvRow[] {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("Enter at least one address,count row.");
  }

  if (isHeaderRow(lines[0]!)) {
    throw new Error(
      'Do not include a header row. Use raw "address,count" lines only.'
    );
  }

  return lines.map((line, index) => {
    const trimmedLine = line.trim();
    const parts = trimmedLine.split(",").map((part) => part.trim());

    if (parts.length !== 2) {
      throw new Error(
        `Line ${index + 1}: Expected exactly one wallet address and one count in "address,count" format.`
      );
    }

    const [address, countValue] = parts;

    if (!isValidAddress(address!)) {
      throw new Error(
        `Line ${index + 1}: Invalid Ethereum address "${address}".`
      );
    }

    if (!/^[1-9]\d*$/.test(countValue!)) {
      throw new Error(`Line ${index + 1}: Count must be a positive integer.`);
    }

    return {
      address: address!.toLowerCase(),
      count: Number.parseInt(countValue!, 10),
    };
  });
}

export function DistributionPhaseAirdropsModal(
  props: Readonly<{
    plan: AllowlistDescription;
    phase: DistributionAirdropsPhase;
    isUploading: boolean;
    handleClose(): void;
    confirmedTokenId?: string | null | undefined;
    onUpload(
      contract: string,
      tokenId: string,
      phase: DistributionAirdropsPhase,
      csvContent: string
    ): Promise<boolean>;
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
  const [csvContent, setCsvContent] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contract = MEMES_CONTRACT;
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const copy = PHASE_COPY[props.phase];

  let parsedRows: CsvRow[] = [];
  let previewError: string | null = null;
  if (csvContent.trim()) {
    try {
      parsedRows = parseCsv(csvContent);
    } catch (error) {
      previewError = getErrorMessage(error);
    }
  }

  const resetState = () => {
    setCsvContent("");
    setSelectedFileName(null);
    setInputError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (props.isUploading) {
      return;
    }
    resetState();
    props.handleClose();
  };

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];

    if (!file) {
      setSelectedFileName(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setInputError(
        `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`
      );
      setSelectedFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      const nextCsvContent = await file.text();
      setCsvContent(nextCsvContent);
      setSelectedFileName(file.name);
      setInputError(null);
    } catch {
      setInputError("Failed to read file.");
      setSelectedFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUpload = async () => {
    setInputError(null);

    if (!isValidPositiveInteger(displayTokenId)) {
      setInputError("Enter a valid positive token ID.");
      return;
    }

    let rows: CsvRow[];
    try {
      rows = parseCsv(csvContent);
    } catch (error) {
      setInputError(getErrorMessage(error));
      return;
    }

    const normalizedCsvContent = rows
      .map((row) => `${row.address},${row.count}`)
      .join("\n");

    const didUpload = await props.onUpload(
      contract,
      displayTokenId,
      props.phase,
      normalizedCsvContent
    );

    if (didUpload) {
      resetState();
      props.handleClose();
    }
  };

  return (
    <Modal show onHide={handleClose}>
      <Modal.Header closeButton={!props.isUploading}>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          {copy.title}
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
              <div className="alert alert-info mb-0 border border-dark">
                <div className="mb-2">
                  <strong>CSV format:</strong>{" "}
                  <code
                    className="p-1 bg-dark text-light rounded"
                    style={{ fontSize: "12px" }}
                  >
                    address,count
                  </code>
                </div>
                <div className="mb-2">
                  Do not include a header row. Each line must contain exactly
                  one wallet address and one positive integer count.
                </div>
                <pre
                  className="mb-0 p-2 bg-dark text-light rounded"
                  style={{ fontSize: "12px", overflowX: "auto" }}
                >
                  <code>
                    {`0x33fd426905f149f8376e227d0c9d3340aad17af1,2
0x9f6ae0370d74f0e591c64cec4a8ae0d627817014,1`}
                  </code>
                </pre>
              </div>
            </Col>
          </Row>
          <Row className="pt-3 pb-2">
            <Col>
              <label className="form-label mb-2" htmlFor="airdrop-csv-textarea">
                Paste CSV
              </label>
              <textarea
                id="airdrop-csv-textarea"
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setInputError(null);
                }}
                placeholder="0x...,2&#10;0x...,1"
                rows={8}
                className="form-control"
                style={{ color: "black" }}
              />
            </Col>
          </Row>
          <Row className="pt-2 pb-2">
            <Col>
              <label className="form-label mb-2" htmlFor="airdrop-csv-file">
                Or upload a CSV file
              </label>
              <input
                id="airdrop-csv-file"
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileChange}
                style={{ color: "black" }}
              />
              {selectedFileName && (
                <div className="mt-2 text-muted">{selectedFileName}</div>
              )}
            </Col>
          </Row>
          {(inputError || previewError) && (
            <Row className="pt-2 pb-2">
              <Col>
                <div className="text-danger">{inputError ?? previewError}</div>
              </Col>
            </Row>
          )}
          {parsedRows.length > 0 && !previewError && (
            <Row className="pt-2 pb-2">
              <Col>
                <div className="alert alert-success mb-0 border border-dark">
                  Ready to upload {copy.successLabel} airdrops:{" "}
                  {parsedRows.length} address(es) |{" "}
                  {parsedRows.reduce((total, row) => total + row.count, 0)}{" "}
                  count
                </div>
              </Col>
            </Row>
          )}
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={props.isUploading}
        >
          Close
        </Button>
        <Button
          disabled={
            props.isUploading ||
            !isValidPositiveInteger(displayTokenId) ||
            !csvContent.trim() ||
            !!previewError ||
            parsedRows.length === 0
          }
          variant="primary"
          onClick={handleUpload}
        >
          {props.isUploading ? "Uploading..." : copy.submitLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
