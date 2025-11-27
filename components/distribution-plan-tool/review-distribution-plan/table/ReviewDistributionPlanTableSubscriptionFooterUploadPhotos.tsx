"use client";

import { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { MEMES_CONTRACT } from "@/constants";
import { formatAddress } from "@/helpers/Helpers";
import { useRef, useState } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";

function extractAllNumbers(str: string): number[] {
  const regex = /\d+/g;
  const numbers = [];
  let match;

  while ((match = regex.exec(str)) !== null) {
    numbers.push(Number.parseInt(match[0], 10));
  }

  return numbers;
}

export function UploadDistributionPhotosModal(
  props: Readonly<{
    plan: AllowlistDescription;
    show: boolean;
    handleClose(): void;
    existingPhotosCount?: number;
    onUpload(contract: string, tokenId: string, files: File[]): void;
  }>
) {
  const [tokenId, setTokenId] = useState<string>(
    extractAllNumbers(props.plan.name)[0]?.toString() ?? ""
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contract = MEMES_CONTRACT;

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
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
          `${file.name}: Invalid file type. Only images are allowed.`
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size exceeds 10MB limit.`);
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

    if (!tokenId || Number.isNaN(Number.parseInt(tokenId, 10))) {
      return;
    }

    props.onUpload(contract, tokenId, selectedFiles);
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
    <Modal show={props.show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          Upload Distribution Photos
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
              <input
                style={{
                  color: "black",
                  width: "100px",
                }}
                min={1}
                type="number"
                value={tokenId}
                onChange={(e) => {
                  setTokenId(e.target.value);
                }}
              />
            </Col>
          </Row>
          {props.existingPhotosCount !== undefined &&
            props.existingPhotosCount > 0 && (
              <Row className="pt-2 pb-2">
                <Col>
                  <div className="alert alert-warning mb-0 border border-dark">
                    ⚠️ {props.existingPhotosCount} photo(s) already exist. This
                    will replace all existing photos.
                  </div>
                </Col>
              </Row>
            )}
          <Row className="pt-2 pb-2">
            <Col>
              Select Photos:{" "}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                style={{
                  color: "black",
                }}
              />
              {fileErrors.length > 0 && (
                <div className="mt-2">
                  {fileErrors.map((error) => (
                    <div key={error} className="text-danger">
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </Col>
          </Row>
          {selectedFiles.length > 0 && (
            <Row className="pt-2 pb-2">
              <Col>
                Selected Files ({selectedFiles.length}):
                <div className="mt-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="d-flex align-items-center justify-content-between mb-2 p-2 bg-light rounded">
                      <span className="text-truncate flex-grow-1 me-2">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="btn btn-sm btn-outline-danger">
                        Remove
                      </button>
                    </div>
                  ))}
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
            !tokenId ||
            Number.isNaN(Number.parseInt(tokenId, 10)) ||
            selectedFiles.length === 0
          }
          variant="primary"
          onClick={handleUpload}>
          Upload Photos
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
