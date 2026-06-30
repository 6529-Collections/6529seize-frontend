"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { MEMES_CONTRACT } from "@/constants/constants";
import {
  extractAllNumbers,
  formatAddress,
  isValidPositiveInteger,
} from "@/helpers/Helpers";
import { useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import {
  subscriptionFooterModalContainerClass,
  subscriptionFooterWarningAlertClass,
} from "./ReviewDistributionPlanTableSubscriptionFooter.classes";

export function UploadDistributionPhotosModal(
  props: Readonly<{
    plan: AllowlistDescription;
    handleClose(): void;
    existingPhotosCount?: number | undefined;
    confirmedTokenId?: string | null | undefined;
    onUpload(contract: string, tokenId: string, files: File[]): void;
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contract = MEMES_CONTRACT;

  const MAX_FILE_SIZE = 500 * 1024 * 1024;
  const ACCEPTED_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ]);

  const validateFiles = (files: File[]): string[] => {
    const errors: string[] = [];

    if (files.length === 0) {
      errors.push("Please select at least one file");
      return errors;
    }

    files.forEach((file) => {
      if (!ACCEPTED_TYPES.has(file.type)) {
        errors.push(
          `${file.name}: This file type is not supported. Only images are allowed.`
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size exceeds 500MB limit.`);
      }
    });

    return errors;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const errors = validateFiles(files);

    if (errors.length > 0) {
      setFileErrors(errors);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      setFileErrors([]);
      setSelectedFiles(files);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      setFileErrors(["Please select at least one file"]);
      return;
    }

    if (!isValidPositiveInteger(displayTokenId)) {
      return;
    }

    props.onUpload(contract, displayTokenId, selectedFiles);
    setSelectedFiles([]);
    setFileErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setFileErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    props.handleClose();
  };

  return (
    <Modal show onHide={handleClose} className="tailwind-scope">
      <Modal.Header closeButton>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          Upload Distribution Photos
        </Modal.Title>
      </Modal.Header>
      <hr className="tw-my-0" />
      <Modal.Body>
        <div className={subscriptionFooterModalContainerClass}>
          <div className="tw-py-2">
            <div>
              Contract: The Memes - <span>{formatAddress(contract)}</span>
            </div>
          </div>
          <div className="tw-py-2">
            <div>
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
                  aria-label="Token ID"
                  value={tokenId}
                  onChange={(e) => {
                    setTokenId(e.target.value);
                  }}
                />
              )}
            </div>
          </div>
          {props.existingPhotosCount !== undefined &&
            props.existingPhotosCount > 0 && (
              <div className="tw-py-2">
                <div>
                  <div className={subscriptionFooterWarningAlertClass}>
                    ⚠️ {props.existingPhotosCount} photo(s) already exist. This
                    will replace all existing photos.
                  </div>
                </div>
              </div>
            )}
          <div className="tw-py-2">
            <div>
              Select Photos:{" "}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                aria-label="Select photos"
                onChange={handleFileChange}
                style={{
                  color: "black",
                }}
              />
              {fileErrors.length > 0 && (
                <div className="tw-mt-2">
                  {fileErrors.map((error) => (
                    <div key={error} className="tw-text-red">
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {selectedFiles.length > 0 && (
            <div className="tw-py-2">
              <div>
                Selected Files ({selectedFiles.length}):
                <div className="tw-mt-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="tw-mb-2 tw-flex tw-items-center tw-justify-between tw-rounded tw-bg-iron-100 tw-p-2"
                    >
                      <span className="tw-me-2 tw-grow tw-truncate">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="tw-rounded-md tw-border tw-border-red tw-bg-transparent tw-px-2 tw-py-1 tw-text-sm tw-text-red"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          onClick={handleClose}
          className="tw-rounded-lg tw-border-0 tw-bg-iron-500 tw-px-4 tw-py-2 tw-font-semibold tw-text-white"
        >
          Close
        </button>
        <button
          type="button"
          disabled={
            !isValidPositiveInteger(displayTokenId) ||
            selectedFiles.length === 0
          }
          onClick={handleUpload}
          className="tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2 tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
        >
          Upload Photos
        </button>
      </Modal.Footer>
    </Modal>
  );
}
