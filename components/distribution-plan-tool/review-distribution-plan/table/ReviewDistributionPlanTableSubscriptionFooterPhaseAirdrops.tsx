"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { MEMES_CONTRACT } from "@/constants/constants";
import { extractAllNumbers, isValidPositiveInteger } from "@/helpers/Helpers";
import { type ChangeEvent, useRef, useState } from "react";
import {
  ReviewDistributionPlanTableSubscriptionFooterAlertRow,
  ReviewDistributionPlanTableSubscriptionFooterContractOnlyRow,
  ReviewDistributionPlanTableSubscriptionFooterModal,
  ReviewDistributionPlanTableSubscriptionFooterTokenIdRow,
} from "./ReviewDistributionPlanTableSubscriptionFooterModal";

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
  const initialTokenId = numbers.length > 0 ? numbers[0]!.toString() : "";
  const defaultTokenId = isValidPositiveInteger(initialTokenId)
    ? initialTokenId
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
    <ReviewDistributionPlanTableSubscriptionFooterModal
      title={copy.title}
      onClose={handleClose}
      closeButton={!props.isUploading}
      isDismissable={!props.isUploading}
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={props.isUploading}
            className="tw-rounded-lg tw-border-0 tw-bg-iron-500 tw-px-4 tw-py-2 tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          >
            Close
          </button>
          <button
            type="button"
            disabled={
              props.isUploading ||
              !isValidPositiveInteger(displayTokenId) ||
              !csvContent.trim() ||
              !!previewError ||
              parsedRows.length === 0
            }
            onClick={handleUpload}
            className="tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2 tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          >
            {props.isUploading ? "Uploading..." : copy.submitLabel}
          </button>
        </>
      }
    >
      <ReviewDistributionPlanTableSubscriptionFooterContractOnlyRow
        contract={contract}
      />
      <ReviewDistributionPlanTableSubscriptionFooterTokenIdRow
        confirmedTokenId={props.confirmedTokenId}
        displayTokenId={displayTokenId}
        tokenId={tokenId}
        onTokenIdChange={setTokenId}
      />
      <ReviewDistributionPlanTableSubscriptionFooterAlertRow variant="warning">
        This upload will replace the current {copy.successLabel} airdrops list
        for this token.
      </ReviewDistributionPlanTableSubscriptionFooterAlertRow>
      <div className="tw-py-2">
        <div>
          <div className="tw-mb-0 tw-rounded-lg tw-border tw-border-sky-300 tw-bg-sky-100 tw-px-4 tw-py-3 tw-text-sky-950">
            <div className="tw-mb-2">
              <strong>CSV format:</strong>{" "}
              <code className="tw-rounded tw-bg-iron-900 tw-p-1 tw-text-xs tw-text-iron-50">
                address,count
              </code>
            </div>
            <div className="tw-mb-2">
              Do not include a header row. Each line must contain exactly one
              wallet address and one positive integer count.
            </div>
            <pre className="tw-mb-0 tw-overflow-x-auto tw-rounded tw-bg-iron-900 tw-p-2 tw-text-xs tw-text-iron-50">
              <code>
                {`0x33fd426905f149f8376e227d0c9d3340aad17af1,2
0x9f6ae0370d74f0e591c64cec4a8ae0d627817014,1`}
              </code>
            </pre>
          </div>
        </div>
      </div>
      <div className="tw-pb-2 tw-pt-3">
        <div>
          <label className="tw-mb-2 tw-block" htmlFor="airdrop-csv-textarea">
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
            className="tw-block tw-w-full tw-rounded-lg tw-border tw-border-iron-300 tw-px-3 tw-py-2 tw-text-black"
          />
        </div>
      </div>
      <div className="tw-py-2">
        <div>
          <label className="tw-mb-2 tw-block" htmlFor="airdrop-csv-file">
            Or upload a CSV file
          </label>
          <input
            id="airdrop-csv-file"
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            className="tw-text-black"
          />
          {selectedFileName && (
            <div className="tw-mt-2 tw-text-iron-500">{selectedFileName}</div>
          )}
        </div>
      </div>
      {(inputError || previewError) && (
        <div className="tw-py-2">
          <div>
            <div className="tw-text-red">{inputError ?? previewError}</div>
          </div>
        </div>
      )}
      {parsedRows.length > 0 && !previewError && (
        <div className="tw-py-2">
          <div>
            <div className="tw-mb-0 tw-rounded-lg tw-border tw-border-success/30 tw-bg-success/10 tw-px-4 tw-py-3 tw-text-success">
              Ready to upload {copy.successLabel} airdrops: {parsedRows.length}{" "}
              address(es) |{" "}
              {parsedRows.reduce((total, row) => total + row.count, 0)} count
            </div>
          </div>
        </div>
      )}
    </ReviewDistributionPlanTableSubscriptionFooterModal>
  );
}
